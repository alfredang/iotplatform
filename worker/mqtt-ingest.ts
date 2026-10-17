/**
 * Long-running MQTT ingestion worker.
 *
 * - Subscribes to `devices/+/telemetry` on the configured broker.
 * - Authenticates each message by the device token embedded in the payload.
 * - Writes telemetry via the shared ingest engine (same path as the HTTP API).
 * - Periodically sweeps for offline devices and raises OFFLINE alerts.
 *
 * Run with: npm run worker   (tsx worker/mqtt-ingest.ts)
 */
import mqtt from "mqtt";
import {
  ingestForDevice,
  resolveDeviceToken,
} from "@/lib/telemetry/ingest";
import { evaluateOffline } from "@/lib/alerts/evaluate";
import { RateLimitError } from "@/lib/plans";
import {
  TELEMETRY_TOPIC_WILDCARD,
  deviceIdFromTopic,
} from "@/lib/mqtt/topics";
import { getMqttConfig } from "@/lib/app-config";

const OFFLINE_SECONDS = Number(process.env.DEVICE_OFFLINE_SECONDS || 120);
const SWEEP_INTERVAL_MS = 60 * 1000;

function log(...args: unknown[]) {
  // eslint-disable-next-line no-console
  console.log(`[mqtt-worker ${new Date().toISOString()}]`, ...args);
}

async function handleMessage(topic: string, raw: Buffer) {
  const publicDeviceId = deviceIdFromTopic(topic);
  if (!publicDeviceId) return;

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw.toString());
  } catch {
    log(`bad JSON on ${topic}`);
    return;
  }

  const token = typeof parsed.token === "string" ? parsed.token : undefined;
  // Strip auth/meta fields before treating the rest as telemetry.
  const { token: _t, ...payload } = parsed;

  if (!token) {
    log(`missing token on ${topic}`);
    return;
  }
  const device = await resolveDeviceToken(token);
  if (!device) {
    log(`invalid token on ${topic}`);
    return;
  }
  if (device.deviceId !== publicDeviceId) {
    log(`token/device mismatch on ${topic}`);
    return;
  }

  try {
    const result = await ingestForDevice(device, payload);
    log(`stored ${result.stored} metric(s) for ${device.deviceId}` + (result.alerts ? `, raised ${result.alerts} alert(s)` : ""));
  } catch (err) {
    if (err instanceof RateLimitError) log(`rate limited ${device.deviceId}: ${err.message}`);
    else log("ingest error", err);
  }
}

async function startOfflineSweep() {
  const run = async () => {
    try {
      const { markedOffline, raised } = await evaluateOffline(OFFLINE_SECONDS);
      if (markedOffline || raised) {
        log(`offline sweep: ${markedOffline} device(s) offline, ${raised} alert(s)`);
      }
    } catch (err) {
      log("offline sweep error", err);
    }
  };
  await run();
  setInterval(run, SWEEP_INTERVAL_MS);
}

async function main() {
  // Broker settings come from the Admin → Settings page (AppConfig), falling
  // back to MQTT_* env vars.
  const cfg = await getMqttConfig();
  log(`connecting to ${cfg.brokerUrl}`);
  const client = mqtt.connect(cfg.brokerUrl, {
    username: cfg.username,
    password: cfg.password,
    reconnectPeriod: 5000,
  });

  client.on("connect", () => {
    log("connected");
    client.subscribe(TELEMETRY_TOPIC_WILDCARD, (err) => {
      if (err) log("subscribe error", err);
      else log(`subscribed to ${TELEMETRY_TOPIC_WILDCARD}`);
    });
  });

  client.on("message", (topic, message) => {
    void handleMessage(topic, message);
  });

  client.on("error", (err) => log("client error", err.message));
  client.on("reconnect", () => log("reconnecting..."));

  void startOfflineSweep();

  const shutdown = () => {
    log("shutting down");
    client.end(true, () => process.exit(0));
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

void main();

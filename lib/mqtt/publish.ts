import mqtt, { type MqttClient } from "mqtt";
import { commandTopic } from "./topics";

/**
 * Server-side MQTT publisher for downlink control commands.
 *
 * Next.js API routes run inside the long-lived Node server (`next start`), so a
 * single shared MQTT connection is reused across requests. The connection is
 * created lazily on the first publish and reconnects automatically.
 *
 * Publishing is best-effort: if the broker is unreachable we log and continue,
 * because the command is always persisted to the database first (and HTTP-only
 * devices pick it up by polling `GET /api/device/state`).
 */

const BROKER_URL = process.env.MQTT_BROKER_URL || "mqtt://localhost:1883";

// Reuse the client across hot-reloads in dev and across requests in prod.
const globalForMqtt = globalThis as unknown as { __mqttPub?: MqttClient };

function getClient(): MqttClient {
  if (globalForMqtt.__mqttPub) return globalForMqtt.__mqttPub;
  const client = mqtt.connect(BROKER_URL, {
    username: process.env.MQTT_USERNAME || undefined,
    password: process.env.MQTT_PASSWORD || undefined,
    reconnectPeriod: 5000,
    connectTimeout: 8000,
  });
  client.on("error", (err) => {
    // eslint-disable-next-line no-console
    console.error("[mqtt-publish] error", err.message);
  });
  globalForMqtt.__mqttPub = client;
  return client;
}

/**
 * Publish a control command to a device's downlink topic.
 * Resolves once the message is handed to the broker (or times out gracefully).
 */
export function publishCommand(
  publicDeviceId: string,
  payload: { pin: string; value: number | null; strValue?: string | null },
): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    // Never let a slow/unreachable broker block the API response.
    const timer = setTimeout(done, 3000);
    try {
      const client = getClient();
      const body = JSON.stringify({
        pin: payload.pin,
        value: payload.value,
        ...(payload.strValue != null ? { strValue: payload.strValue } : {}),
        ts: Date.now(),
      });
      client.publish(commandTopic(publicDeviceId), body, { qos: 1 }, (err) => {
        clearTimeout(timer);
        if (err) {
          // eslint-disable-next-line no-console
          console.error("[mqtt-publish] publish failed", err.message);
        }
        done();
      });
    } catch (err) {
      clearTimeout(timer);
      // eslint-disable-next-line no-console
      console.error("[mqtt-publish] unexpected", err);
      done();
    }
  });
}

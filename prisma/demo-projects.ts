/**
 * Demo seeder — adds 10 self-contained maker projects to the admin account,
 * across a mix of boards (ESP32, ESP8266, Arduino, Raspberry Pi) with simple
 * sensors/actuators. Each project gets devices, ~24h telemetry, a dashboard
 * (display + control widgets), an alert rule, and an Automation wired to the
 * matching n8n flow on N8N_BASE_URL (webhook path `iot-demo-<slug>`).
 *
 * Run:  npx tsx prisma/demo-projects.ts
 * Safe to re-run — it deletes and recreates the 10 demo projects each time.
 */
import { PrismaClient, Protocol, DeviceStatus, type AutomationEvent } from "@prisma/client";
import { readFileSync } from "node:fs";
import { generateDeviceToken } from "../lib/tokens";

const prisma = new PrismaClient();

const N8N_BASE = (process.env.N8N_BASE_URL || "https://n8n.tertiarytraining.com").replace(/\/$/, "");

// Optional enrichment: a slug→{id,url} map written by make-demo-flows.mjs.
let flowMap: Record<string, { id?: string; url?: string }> = {};
try {
  const p = process.env.FLOWS_JSON;
  if (p) flowMap = JSON.parse(readFileSync(p, "utf8"));
} catch { /* fall back to deterministic URLs */ }

function webhookUrl(slug: string): string {
  return flowMap[slug]?.url || `${N8N_BASE}/webhook/iot-demo-${slug}`;
}

type WType = "NUMBER" | "GAUGE" | "LINE" | "BAR" | "STATUS" | "ALERTS" | "MAP"
  | "BUTTON" | "SWITCH" | "SLIDER" | "TERMINAL" | "LED";

type DeviceDef = {
  name: string; board: string; deviceId: string; protocol: Protocol;
  location: string; lat: number; lng: number; metrics: string[]; online?: boolean;
};
type ControlDef = { type: "SWITCH" | "SLIDER" | "BUTTON"; title: string; pin: string; value: number; min?: number; max?: number };
type ProjectDef = {
  slug: string; name: string; description: string;
  devices: DeviceDef[];
  control?: ControlDef;
  event: AutomationEvent; metric?: string;
  alert?: { metric: string; op: "GT" | "LT"; threshold: number; name: string };
};

// Value ranges per metric so dashboards look realistic.
function metricValue(metric: string, t: number, jitter: number): number {
  const r = (n: number, d = 1) => Math.round(n * 10 ** d) / 10 ** d;
  switch (metric) {
    case "temperature": return r(24 + 6 * Math.sin(t * Math.PI * 2) + jitter * 1.5);
    case "humidity": return r(Math.min(95, Math.max(25, 55 + 15 * Math.cos(t * Math.PI * 2) + jitter * 4)), 0);
    case "pressure": return r(1013 + 5 * Math.sin(t * Math.PI * 2) + jitter, 0);
    case "soil": return r(Math.max(120, 380 + 160 * Math.sin(t * Math.PI * 2) + jitter * 30), 0);
    case "co2": return r(Math.max(400, 700 + 300 * Math.sin(t * Math.PI * 2) + jitter * 60), 0);
    case "power": return r(Math.max(0, 900 + 700 * Math.sin(t * Math.PI * 2) + jitter * 120), 0);
    case "level": return r(Math.min(100, Math.max(0, 55 + 30 * Math.sin(t * Math.PI * 2) + jitter * 6)), 0);
    case "distance": return r(Math.max(3, 45 + 35 * Math.sin(t * Math.PI * 2) + jitter * 8), 0);
    case "motion": return Math.sin(t * Math.PI * 8) + jitter > 0.9 ? 1 : 0;
    case "signal": return r(Math.min(99, Math.max(45, 78 + 10 * Math.sin(t * Math.PI * 2) + jitter * 5)), 0);
    default: return r(50 + jitter * 10);
  }
}

const PROJECTS: ProjectDef[] = [
  {
    slug: "esp32-led", name: "ESP32 LED Blinker", description: "Blink an LED on an ESP32 dev board from the dashboard.",
    devices: [
      { name: "ESP32 Dev Board", board: "ESP32", deviceId: "esp32-led-01", protocol: Protocol.MQTT, location: "Bench", lat: 1.3521, lng: 103.8198, metrics: ["signal"] },
      { name: "Arduino Nano LED", board: "Arduino Nano", deviceId: "nano-led-02", protocol: Protocol.HTTP, location: "Bench", lat: 1.3525, lng: 103.8203, metrics: ["signal"] },
    ],
    control: { type: "SWITCH", title: "Onboard LED", pin: "V1", value: 1 },
    event: "COMMAND",
  },
  {
    slug: "dht22", name: "DHT22 Climate (ESP8266)", description: "Temperature & humidity from a DHT22 on an ESP8266.",
    devices: [
      { name: "ESP8266 + DHT22", board: "ESP8266", deviceId: "esp8266-dht22", protocol: Protocol.HTTP, location: "Study", lat: 1.30, lng: 103.85, metrics: ["temperature", "humidity"] },
      { name: "ESP32 + BME280", board: "ESP32", deviceId: "esp32-bme280", protocol: Protocol.MQTT, location: "Bedroom", lat: 1.301, lng: 103.851, metrics: ["temperature", "humidity", "pressure"] },
    ],
    event: "TELEMETRY", metric: "temperature",
    alert: { metric: "temperature", op: "GT", threshold: 35, name: "High temperature" },
  },
  {
    slug: "soil", name: "Arduino Soil Moisture", description: "Soil moisture with an Arduino Uno; auto-water when dry.",
    devices: [
      { name: "Arduino Uno + Soil Sensor", board: "Arduino Uno", deviceId: "uno-soil-01", protocol: Protocol.HTTP, location: "Garden Bed 1", lat: 1.29, lng: 103.84, metrics: ["soil"] },
      { name: "ESP32 Soil Node", board: "ESP32", deviceId: "esp32-soil-02", protocol: Protocol.MQTT, location: "Garden Bed 2", lat: 1.291, lng: 103.841, metrics: ["soil", "temperature"] },
    ],
    control: { type: "SWITCH", title: "Water Pump", pin: "pump", value: 0 },
    event: "TELEMETRY", metric: "soil",
    alert: { metric: "soil", op: "LT", threshold: 300, name: "Soil dry" },
  },
  {
    slug: "weather", name: "Raspberry Pi Weather Station", description: "Temperature, humidity & pressure on a Raspberry Pi.",
    devices: [
      { name: "Raspberry Pi 4", board: "Raspberry Pi", deviceId: "rpi-weather", protocol: Protocol.MQTT, location: "Rooftop", lat: 1.3644, lng: 103.9915, metrics: ["temperature", "humidity", "pressure"] },
      { name: "ESP8266 Outdoor Node", board: "ESP8266", deviceId: "esp8266-outdoor", protocol: Protocol.HTTP, location: "Garden", lat: 1.3648, lng: 103.9919, metrics: ["temperature", "humidity"] },
    ],
    event: "TELEMETRY", metric: "temperature",
  },
  {
    slug: "motion", name: "ESP32-CAM Motion Light", description: "PIR motion on an ESP32-CAM turns a light on.",
    devices: [
      { name: "ESP32-CAM", board: "ESP32-CAM", deviceId: "esp32cam-motion", protocol: Protocol.MQTT, location: "Hallway", lat: 1.31, lng: 103.86, metrics: ["motion"] },
      { name: "Raspberry Pi Zero PIR", board: "Raspberry Pi Zero", deviceId: "rpi-zero-pir", protocol: Protocol.MQTT, location: "Porch", lat: 1.311, lng: 103.861, metrics: ["motion"] },
    ],
    control: { type: "SWITCH", title: "Hallway Light", pin: "light", value: 0 },
    event: "TELEMETRY", metric: "motion",
  },
  {
    slug: "distance", name: "Arduino Ultrasonic Distance", description: "HC-SR04 distance on an Arduino Uno; buzz when close.",
    devices: [
      { name: "Arduino Uno + HC-SR04", board: "Arduino Uno", deviceId: "uno-sonar-01", protocol: Protocol.HTTP, location: "Door", lat: 1.32, lng: 103.87, metrics: ["distance"] },
      { name: "ESP32 Parking Sensor", board: "ESP32", deviceId: "esp32-parking", protocol: Protocol.MQTT, location: "Garage", lat: 1.321, lng: 103.871, metrics: ["distance"] },
    ],
    control: { type: "BUTTON", title: "Test Buzzer", pin: "buzzer", value: 0 },
    event: "TELEMETRY", metric: "distance",
  },
  {
    slug: "room", name: "Raspberry Pi Room Monitor", description: "Temperature, humidity & CO₂ on a Raspberry Pi Zero.",
    devices: [
      { name: "Raspberry Pi Zero", board: "Raspberry Pi Zero", deviceId: "rpi-room", protocol: Protocol.MQTT, location: "Office", lat: 1.30, lng: 103.83, metrics: ["temperature", "humidity", "co2"] },
      { name: "ESP32 CO₂ Sensor", board: "ESP32", deviceId: "esp32-co2", protocol: Protocol.MQTT, location: "Meeting Room", lat: 1.302, lng: 103.832, metrics: ["co2"] },
    ],
    event: "ALERT",
    alert: { metric: "co2", op: "GT", threshold: 1000, name: "High CO₂" },
  },
  {
    slug: "plug", name: "ESP8266 Smart Plug", description: "A Sonoff-style ESP8266 smart plug with power metering.",
    devices: [
      { name: "Sonoff (ESP8266)", board: "ESP8266", deviceId: "esp8266-plug", protocol: Protocol.MQTT, location: "Kitchen", lat: 1.33, lng: 103.74, metrics: ["power"] },
      { name: "ESP32 Energy Meter", board: "ESP32", deviceId: "esp32-energy", protocol: Protocol.MQTT, location: "Mains Panel", lat: 1.331, lng: 103.741, metrics: ["power"] },
    ],
    control: { type: "SWITCH", title: "Plug Relay", pin: "relay", value: 1 },
    event: "TELEMETRY", metric: "power",
  },
  {
    slug: "rgb", name: "ESP32 RGB LED Controller", description: "Dim a WS2812 LED strip on an ESP32 with a slider.",
    devices: [
      { name: "ESP32 + WS2812", board: "ESP32", deviceId: "esp32-rgb", protocol: Protocol.MQTT, location: "Living Room", lat: 1.30, lng: 103.85, metrics: ["signal"] },
      { name: "Raspberry Pi Pico W", board: "Raspberry Pi Pico", deviceId: "pico-rgb-02", protocol: Protocol.HTTP, location: "Bedroom", lat: 1.303, lng: 103.853, metrics: ["signal"] },
    ],
    control: { type: "SLIDER", title: "Brightness", pin: "brightness", value: 128, min: 0, max: 255 },
    event: "COMMAND",
  },
  {
    slug: "tank", name: "Arduino Water Tank Level", description: "Float-sensor tank level on an Arduino; auto-fill pump.",
    devices: [
      { name: "Arduino Mega + Float", board: "Arduino Mega", deviceId: "mega-tank", protocol: Protocol.HTTP, location: "Utility", lat: 1.28, lng: 103.85, metrics: ["level"] },
      { name: "ESP8266 Flow Meter", board: "ESP8266", deviceId: "esp8266-flow", protocol: Protocol.MQTT, location: "Pump Room", lat: 1.281, lng: 103.851, metrics: ["level"], online: false },
    ],
    control: { type: "SWITCH", title: "Fill Pump", pin: "pump", value: 0 },
    event: "TELEMETRY", metric: "level",
    alert: { metric: "level", op: "LT", threshold: 20, name: "Tank low" },
  },
];

async function main() {
  const admin = await prisma.user.findUnique({ where: { email: "admin@demo.io" } });
  if (!admin) throw new Error("admin@demo.io not found — run `npm run db:seed` first.");

  // Re-runnable: remove any existing demo projects by name (cascades).
  const names = PROJECTS.map((p) => p.name);
  await prisma.project.deleteMany({ where: { ownerId: admin.id, name: { in: names } } });

  const now = Date.now();
  const windowMs = 24 * 60 * 60 * 1000;
  const stepMs = 30 * 60 * 1000;
  const points = Math.floor(windowMs / stepMs);

  for (let idx = 0; idx < PROJECTS.length; idx++) {
    const def = PROJECTS[idx];
    const project = await prisma.project.create({
      data: { name: def.name, description: def.description, ownerId: admin.id },
    });

    const devices = [];
    for (let i = 0; i < def.devices.length; i++) {
      const d = def.devices[i];
      const online = d.online !== false;
      const device = await prisma.device.create({
        data: {
          name: d.name, type: d.board, deviceId: d.deviceId, location: d.location,
          latitude: d.lat, longitude: d.lng, protocol: d.protocol,
          status: online ? DeviceStatus.ONLINE : DeviceStatus.OFFLINE,
          lastSeen: new Date(now - 30 * 1000),
          ownerId: admin.id, projectId: project.id,
        },
      });
      devices.push(device);

      const token = generateDeviceToken();
      await prisma.deviceToken.create({
        data: { deviceId: device.id, tokenHash: token.hash, prefix: token.prefix },
      });

      const rows = [];
      for (let p = 0; p < points; p++) {
        const ts = new Date(now - windowMs + p * stepMs);
        const t = p / points;
        const payload: Record<string, number> = {};
        for (const metric of d.metrics) {
          const jitter = Math.sin((idx + i) * 7.3 + p * 0.13) * 0.5 + (Math.random() - 0.5);
          const value = metricValue(metric, t, jitter);
          payload[metric] = value;
          rows.push({ deviceId: device.id, ts, metric, value, payload: {} as object });
        }
        for (const r of rows.slice(-d.metrics.length)) r.payload = payload;
      }
      await prisma.telemetry.createMany({ data: rows });
    }

    const first = devices[0];
    const firstMetric = def.devices[0].metrics[0];

    // Seed the control pin state so the control widget reflects a value.
    if (def.control) {
      await prisma.deviceCommand.create({
        data: { deviceId: first.id, pin: def.control.pin, value: def.control.value },
      });
    }

    // Dashboard + widgets (display + control).
    const dashboard = await prisma.dashboard.create({
      data: { name: `${def.name} Overview`, ownerId: admin.id, projectId: project.id, isDefault: true },
    });
    const widgets: { type: WType; title: string; deviceId?: string; metric?: string; config?: object; position: number }[] = [];
    let pos = 0;
    const isNumeric = firstMetric !== "motion";
    if (firstMetric === "motion") {
      widgets.push({ type: "LED", title: "Motion", deviceId: first.id, metric: "motion", position: pos++ });
    } else {
      widgets.push({ type: "NUMBER", title: `${first.name}`, deviceId: first.id, metric: firstMetric, position: pos++ });
    }
    if (def.control) {
      const c = def.control;
      widgets.push({
        type: c.type, title: c.title, deviceId: first.id,
        config: c.type === "SLIDER" ? { pin: c.pin, min: c.min ?? 0, max: c.max ?? 100 } : { pin: c.pin },
        position: pos++,
      });
    }
    // A gauge for humidity/level/co2 if present.
    const gaugeMetric = def.devices[0].metrics.find((m) => ["humidity", "level"].includes(m));
    if (gaugeMetric) {
      widgets.push({ type: "GAUGE", title: gaugeMetric === "level" ? "Tank Level" : "Humidity", deviceId: first.id, metric: gaugeMetric, config: { min: 0, max: 100 }, position: pos++ });
    }
    widgets.push({ type: "STATUS", title: first.name, deviceId: first.id, position: pos++ });
    if (isNumeric) {
      widgets.push({ type: "LINE", title: `${firstMetric} (24h)`, deviceId: first.id, metric: firstMetric, position: pos++ });
    }
    widgets.push({ type: "ALERTS", title: "Active Alerts", position: pos++ });
    widgets.push({ type: "MAP", title: "Device Location", position: pos++ });
    await prisma.widget.createMany({ data: widgets.map((w) => ({ ...w, dashboardId: dashboard.id })) });

    // Alert rule (+ one active alert for the first project that has one).
    if (def.alert) {
      const rule = await prisma.alertRule.create({
        data: { name: def.alert.name, deviceId: first.id, metric: def.alert.metric, operator: def.alert.op, threshold: def.alert.threshold, enabled: true },
      });
      if (idx % 3 === 0) {
        await prisma.alert.create({
          data: { ruleId: rule.id, deviceId: first.id, status: "ACTIVE",
            message: `${first.name}: ${def.alert.metric} crossed ${def.alert.threshold}`, value: def.alert.threshold },
        });
      }
    }

    // Automation → matching n8n flow.
    await prisma.automation.create({
      data: {
        name: `${def.name} → n8n`, ownerId: admin.id, projectId: project.id,
        event: def.event, deviceId: first.id, metric: def.metric ?? null,
        n8nWebhookUrl: webhookUrl(def.slug), n8nWorkflowId: flowMap[def.slug]?.id ?? null,
        enabled: true,
      },
    });

    console.log(`  ✓ ${def.name} — ${devices.length} device(s), ${widgets.length} widgets, automation → ${webhookUrl(def.slug)}`);
  }

  console.log(`\nCreated ${PROJECTS.length} demo projects for admin@demo.io.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

import { PrismaClient, Protocol, DeviceStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateApiKey, generateDeviceToken } from "../lib/tokens";

const prisma = new PrismaClient();

const DEMO_EMAIL = "admin@demo.io";
const DEMO_PASSWORD = "password123";

// Spread of coordinates around Singapore for the map demo.
const DEVICE_SEED = [
  { name: "Warehouse Sensor A", type: "Environment", deviceId: "wh-sensor-a", protocol: Protocol.MQTT, location: "Warehouse 1", lat: 1.3521, lng: 103.8198 },
  { name: "Cold Room Monitor", type: "Temperature", deviceId: "cold-room-1", protocol: Protocol.HTTP, location: "Cold Room", lat: 1.2966, lng: 103.7764 },
  { name: "Rooftop Weather", type: "Weather", deviceId: "rooftop-wx", protocol: Protocol.MQTT, location: "Rooftop", lat: 1.3644, lng: 103.9915 },
  { name: "Pump Station 4", type: "Industrial", deviceId: "pump-04", protocol: Protocol.HTTP, location: "Plant Floor", lat: 1.2897, lng: 103.8501 },
  { name: "Fleet Tracker 12", type: "GPS Tracker", deviceId: "fleet-12", protocol: Protocol.MQTT, location: "In transit", lat: 1.3331, lng: 103.7437 },
];

const METRICS = ["temperature", "humidity", "voltage"] as const;

function metricValue(metric: string, t: number, jitter: number): number {
  // t in [0,1) across the 24h window; produce smooth, plausible curves.
  switch (metric) {
    case "temperature":
      return Math.round((24 + 8 * Math.sin(t * Math.PI * 2) + jitter * 2) * 10) / 10;
    case "humidity":
      return Math.round(Math.min(100, Math.max(20, 60 + 15 * Math.cos(t * Math.PI * 2) + jitter * 5)));
    case "voltage":
      return Math.round((3.7 + 0.2 * Math.sin(t * Math.PI * 4) + jitter * 0.05) * 100) / 100;
    default:
      return Math.round(jitter * 100) / 100;
  }
}

async function main() {
  console.log("Seeding database...");

  // Clean slate (respect FK order via cascades on User/Device).
  await prisma.alert.deleteMany();
  await prisma.alertRule.deleteMany();
  await prisma.widget.deleteMany();
  await prisma.dashboard.deleteMany();
  await prisma.telemetry.deleteMany();
  await prisma.deviceToken.deleteMany();
  await prisma.device.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.otpCode.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      email: DEMO_EMAIL,
      name: "Demo Admin",
      role: "ADMIN",
      orgName: "Acme IoT",
      notificationEmail: DEMO_EMAIL,
      hashedPassword: bcrypt.hashSync(DEMO_PASSWORD, 10),
      theme: "dark",
    },
  });
  console.log(`  user: ${admin.email} / ${DEMO_PASSWORD}`);

  // One account-level API key (raw shown once, here in the seed log).
  const apiKey = generateApiKey();
  await prisma.apiKey.create({
    data: { name: "Demo Key", keyHash: apiKey.hash, prefix: apiKey.prefix, ownerId: admin.id },
  });
  console.log(`  api key (save this): ${apiKey.token}`);

  const now = Date.now();
  const windowMs = 24 * 60 * 60 * 1000;
  const stepMs = 15 * 60 * 1000; // every 15 minutes
  const points = Math.floor(windowMs / stepMs);

  const devices = [];
  for (let i = 0; i < DEVICE_SEED.length; i++) {
    const d = DEVICE_SEED[i];
    const online = i !== 3; // pump-04 is offline for demo
    const device = await prisma.device.create({
      data: {
        name: d.name,
        type: d.type,
        deviceId: d.deviceId,
        location: d.location,
        latitude: d.lat,
        longitude: d.lng,
        protocol: d.protocol,
        status: online ? DeviceStatus.ONLINE : DeviceStatus.OFFLINE,
        lastSeen: online ? new Date(now - 30 * 1000) : new Date(now - 45 * 60 * 1000),
        ownerId: admin.id,
      },
    });
    devices.push(device);

    const token = generateDeviceToken();
    await prisma.deviceToken.create({
      data: { deviceId: device.id, tokenHash: token.hash, prefix: token.prefix },
    });

    // Telemetry history
    const rows = [];
    for (let p = 0; p < points; p++) {
      const ts = new Date(now - windowMs + p * stepMs);
      const t = p / points;
      const payload: Record<string, number> = {};
      for (const metric of METRICS) {
        const jitter = Math.sin(i * 7.3 + p * 0.13) * 0.5 + (Math.random() - 0.5);
        const value = metricValue(metric, t, jitter);
        payload[metric] = value;
        rows.push({ deviceId: device.id, ts, metric, value, payload: {} as object });
      }
      // attach the full payload to each metric row created above for this ts
      const justAdded = rows.slice(-METRICS.length);
      for (const r of justAdded) r.payload = payload;
    }
    await prisma.telemetry.createMany({ data: rows });
    console.log(`  device: ${device.name} (${rows.length} telemetry rows)`);
  }

  // Alert rule: temperature > 40 on the first device, with one active alert.
  const rule = await prisma.alertRule.create({
    data: {
      name: "High temperature",
      deviceId: devices[0].id,
      metric: "temperature",
      operator: "GT",
      threshold: 40,
      enabled: true,
    },
  });
  await prisma.alert.create({
    data: {
      ruleId: rule.id,
      deviceId: devices[0].id,
      message: `${devices[0].name}: temperature 42.3°C exceeded threshold 40`,
      value: 42.3,
      status: "ACTIVE",
    },
  });

  // Offline rule on the pump (already offline)
  await prisma.alertRule.create({
    data: {
      name: "Pump offline",
      deviceId: devices[3].id,
      operator: "OFFLINE",
      durationSecs: 600,
      enabled: true,
    },
  });
  console.log("  alert rules + 1 active alert created");

  // Default dashboard with one of every widget type.
  const dashboard = await prisma.dashboard.create({
    data: { name: "Overview", ownerId: admin.id, isDefault: true },
  });
  await prisma.widget.createMany({
    data: [
      { dashboardId: dashboard.id, type: "NUMBER", title: "Warehouse Temp", deviceId: devices[0].id, metric: "temperature", position: 0 },
      { dashboardId: dashboard.id, type: "GAUGE", title: "Warehouse Humidity", deviceId: devices[0].id, metric: "humidity", config: { min: 0, max: 100 }, position: 1 },
      { dashboardId: dashboard.id, type: "NUMBER", title: "Cold Room Temp", deviceId: devices[1].id, metric: "temperature", position: 2 },
      { dashboardId: dashboard.id, type: "LINE", title: "Warehouse Temperature (24h)", deviceId: devices[0].id, metric: "temperature", position: 3 },
      { dashboardId: dashboard.id, type: "BAR", title: "Rooftop Voltage", deviceId: devices[2].id, metric: "voltage", position: 4 },
      { dashboardId: dashboard.id, type: "STATUS", title: "Pump Station", deviceId: devices[3].id, position: 5 },
      { dashboardId: dashboard.id, type: "ALERTS", title: "Active Alerts", position: 6 },
      { dashboardId: dashboard.id, type: "MAP", title: "Device Locations", position: 7 },
    ],
  });
  console.log("  default dashboard with 8 widgets created");

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

import { PrismaClient, Protocol, DeviceStatus, type User } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateApiKey, generateDeviceToken } from "../lib/tokens";

const prisma = new PrismaClient();

const METRICS = ["temperature", "humidity", "voltage"] as const;

type DeviceDef = {
  name: string;
  type: string;
  deviceId: string;
  protocol: Protocol;
  location: string;
  lat: number;
  lng: number;
  online?: boolean;
};

type ProjectDef = {
  name: string;
  description: string;
  devices: DeviceDef[];
};

function metricValue(metric: string, t: number, jitter: number): number {
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

async function createWorkspace(owner: User, def: ProjectDef, seedIndex: number) {
  const project = await prisma.project.create({
    data: { name: def.name, description: def.description, ownerId: owner.id },
  });

  const now = Date.now();
  const windowMs = 24 * 60 * 60 * 1000;
  const stepMs = 15 * 60 * 1000;
  const points = Math.floor(windowMs / stepMs);

  const devices = [];
  for (let i = 0; i < def.devices.length; i++) {
    const d = def.devices[i];
    const online = d.online !== false;
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
        ownerId: owner.id,
        projectId: project.id,
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
      for (const metric of METRICS) {
        const jitter = Math.sin((seedIndex + i) * 7.3 + p * 0.13) * 0.5 + (Math.random() - 0.5);
        const value = metricValue(metric, t, jitter);
        payload[metric] = value;
        rows.push({ deviceId: device.id, ts, metric, value, payload: {} as object });
      }
      const justAdded = rows.slice(-METRICS.length);
      for (const r of justAdded) r.payload = payload;
    }
    await prisma.telemetry.createMany({ data: rows });
  }

  // Default dashboard for the project
  const dashboard = await prisma.dashboard.create({
    data: { name: `${def.name} Overview`, ownerId: owner.id, projectId: project.id, isDefault: true },
  });
  const first = devices[0];
  const widgets: {
    type: "NUMBER" | "GAUGE" | "LINE" | "BAR" | "STATUS" | "ALERTS" | "MAP";
    title: string;
    deviceId?: string;
    metric?: string;
    config?: object;
    position: number;
  }[] = [
    { type: "NUMBER", title: `${first.name} Temp`, deviceId: first.id, metric: "temperature", position: 0 },
    { type: "GAUGE", title: `${first.name} Humidity`, deviceId: first.id, metric: "humidity", config: { min: 0, max: 100 }, position: 1 },
    { type: "STATUS", title: first.name, deviceId: first.id, position: 2 },
    { type: "LINE", title: `${first.name} Temperature (24h)`, deviceId: first.id, metric: "temperature", position: 3 },
    { type: "ALERTS", title: "Active Alerts", position: 4 },
    { type: "MAP", title: "Device Locations", position: 5 },
  ];
  if (devices[1]) {
    widgets.splice(4, 0, {
      type: "BAR",
      title: `${devices[1].name} Voltage`,
      deviceId: devices[1].id,
      metric: "voltage",
      position: 6,
    });
  }
  await prisma.widget.createMany({
    data: widgets.map((w) => ({ ...w, dashboardId: dashboard.id })),
  });

  console.log(`  project: ${def.name} (${devices.length} devices)`);
  return devices;
}

async function main() {
  console.log("Seeding database...");

  // Clean slate
  await prisma.alert.deleteMany();
  await prisma.alertRule.deleteMany();
  await prisma.widget.deleteMany();
  await prisma.dashboard.deleteMany();
  await prisma.telemetry.deleteMany();
  await prisma.deviceToken.deleteMany();
  await prisma.device.deleteMany();
  await prisma.project.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.otpCode.deleteMany();
  await prisma.user.deleteMany();
  await prisma.appConfig.deleteMany();

  const password = bcrypt.hashSync("password123", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@demo.io",
      name: "Demo Admin",
      role: "ADMIN",
      orgName: "Acme IoT",
      notificationEmail: "admin@demo.io",
      hashedPassword: password,
    },
  });
  console.log("  user: admin@demo.io / password123 (ADMIN)");

  const user = await prisma.user.create({
    data: {
      email: "user@demo.io",
      name: "Demo User",
      role: "USER",
      orgName: "Acme IoT",
      notificationEmail: "user@demo.io",
      hashedPassword: password,
    },
  });
  console.log("  user: user@demo.io / password123 (USER)");

  // An extra (deactivated) user to demonstrate admin user management.
  await prisma.user.create({
    data: {
      email: "guest@demo.io",
      name: "Guest (deactivated)",
      role: "USER",
      hashedPassword: password,
      disabled: true,
    },
  });

  const apiKey = generateApiKey();
  await prisma.apiKey.create({
    data: { name: "Demo Key", keyHash: apiKey.hash, prefix: apiKey.prefix, ownerId: admin.id },
  });
  console.log(`  api key (save this): ${apiKey.token}`);

  // Admin workspaces
  const wh = await createWorkspace(
    admin,
    {
      name: "Warehouse Monitoring",
      description: "Environmental sensors across the main warehouse.",
      devices: [
        { name: "Warehouse Sensor A", type: "Environment", deviceId: "wh-sensor-a", protocol: Protocol.MQTT, location: "Warehouse 1", lat: 1.3521, lng: 103.8198 },
        { name: "Cold Room Monitor", type: "Temperature", deviceId: "cold-room-1", protocol: Protocol.HTTP, location: "Cold Room", lat: 1.2966, lng: 103.7764 },
        { name: "Pump Station 4", type: "Industrial", deviceId: "pump-04", protocol: Protocol.HTTP, location: "Plant Floor", lat: 1.2897, lng: 103.8501, online: false },
      ],
    },
    0,
  );

  await createWorkspace(
    admin,
    {
      name: "Fleet & Weather",
      description: "Outdoor weather and vehicle tracking devices.",
      devices: [
        { name: "Rooftop Weather", type: "Weather", deviceId: "rooftop-wx", protocol: Protocol.MQTT, location: "Rooftop", lat: 1.3644, lng: 103.9915 },
        { name: "Fleet Tracker 12", type: "GPS Tracker", deviceId: "fleet-12", protocol: Protocol.MQTT, location: "In transit", lat: 1.3331, lng: 103.7437 },
      ],
    },
    2,
  );

  // Regular user's workspace
  await createWorkspace(
    user,
    {
      name: "Home Lab",
      description: "Personal sensors at home.",
      devices: [
        { name: "Living Room Sensor", type: "Environment", deviceId: "home-living", protocol: Protocol.HTTP, location: "Living Room", lat: 1.3000, lng: 103.8500 },
      ],
    },
    4,
  );

  // Alert rules + one active alert on the warehouse sensor
  const rule = await prisma.alertRule.create({
    data: {
      name: "High temperature",
      deviceId: wh[0].id,
      metric: "temperature",
      operator: "GT",
      threshold: 40,
      enabled: true,
    },
  });
  await prisma.alert.create({
    data: {
      ruleId: rule.id,
      deviceId: wh[0].id,
      message: `${wh[0].name}: temperature 42.3°C > threshold 40°C`,
      value: 42.3,
      status: "ACTIVE",
    },
  });
  await prisma.alertRule.create({
    data: { name: "Pump offline", deviceId: wh[2].id, operator: "OFFLINE", durationSecs: 600, enabled: true },
  });
  console.log("  alert rules + 1 active alert created");

  // Global app config (email alerts off by default)
  await prisma.appConfig.create({
    data: { id: 1, alertEmail: "admin@demo.io", smtpPort: 587, emailAlertsEnabled: false },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

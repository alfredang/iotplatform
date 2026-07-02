import type { Device } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { hashToken } from "@/lib/tokens";
import { evaluateMetric } from "@/lib/alerts/evaluate";
import { dispatchEvent } from "@/lib/automations/dispatch";
import { normalizePayload } from "./normalize";

export type IngestResult = {
  deviceId: string;
  stored: number;
  alerts: number;
};

/** Resolve a device from a `dev_...` device token. Returns null if invalid. */
export async function resolveDeviceToken(token: string): Promise<Device | null> {
  const hash = hashToken(token);
  const record = await prisma.deviceToken.findFirst({
    where: { tokenHash: hash, revoked: false },
    include: { device: true },
  });
  if (!record) return null;
  await prisma.deviceToken.update({
    where: { id: record.id },
    data: { lastUsed: new Date() },
  });
  return record.device;
}

/** Resolve the owning user id from an `iot_...` account API key. */
export async function resolveApiKey(key: string): Promise<string | null> {
  const hash = hashToken(key);
  const record = await prisma.apiKey.findFirst({
    where: { keyHash: hash, revoked: false },
  });
  if (!record) return null;
  await prisma.apiKey.update({
    where: { id: record.id },
    data: { lastUsed: new Date() },
  });
  return record.ownerId;
}

/**
 * Store a telemetry payload for a known device, update its status/coordinates,
 * and evaluate alert rules. This is the single shared ingestion path used by
 * both the HTTP route and the MQTT worker.
 */
export async function ingestForDevice(
  device: Device,
  payload: unknown,
  receivedAt = new Date(),
): Promise<IngestResult> {
  const { readings, latitude, longitude } = normalizePayload(payload);

  if (readings.length > 0) {
    await prisma.telemetry.createMany({
      data: readings.map((r) => ({
        deviceId: device.id,
        ts: receivedAt,
        metric: r.metric,
        value: r.value,
        payload: payload as object,
      })),
    });
  }

  const cameOnline = device.status !== "ONLINE";
  await prisma.device.update({
    where: { id: device.id },
    data: {
      lastSeen: receivedAt,
      status: "ONLINE",
      ...(latitude !== undefined ? { latitude } : {}),
      ...(longitude !== undefined ? { longitude } : {}),
    },
  });

  let alerts = 0;
  for (const r of readings) {
    alerts += await evaluateMetric(device.id, r.metric, r.value);
  }

  // Low-code hooks (fire-and-forget → n8n flows).
  if (cameOnline) void dispatchEvent("DEVICE_ONLINE", device, {});
  if (readings.length > 0) {
    const readingMap: Record<string, number | null> = {};
    for (const r of readings) readingMap[r.metric] = r.value;
    // One event per metric so metric-filtered automations match cleanly.
    for (const r of readings) {
      void dispatchEvent("TELEMETRY", device, {
        metric: r.metric,
        value: r.value,
        readings: readingMap,
      });
    }
  }

  return { deviceId: device.deviceId, stored: readings.length, alerts };
}

/**
 * Resolve a device from an account API key plus a public deviceId in the body,
 * ensuring the device belongs to the key's owner.
 */
export async function resolveDeviceForApiKey(
  ownerId: string,
  publicDeviceId: string,
): Promise<Device | null> {
  return prisma.device.findFirst({
    where: { deviceId: publicDeviceId, ownerId },
  });
}

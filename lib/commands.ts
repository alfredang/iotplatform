import type { Device } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { publishCommand } from "@/lib/mqtt/publish";
import { dispatchEvent } from "@/lib/automations/dispatch";

/**
 * Set a device virtual-pin value (downlink control, Blynk-style).
 *
 * 1. Upserts the latest desired value into `DeviceCommand` (survives restarts
 *    and is what HTTP-only devices read via `GET /api/device/state`).
 * 2. Publishes it to the device's MQTT downlink topic `devices/<id>/down`.
 * 3. Fires the COMMAND automation event so n8n flows can react.
 */
export async function setCommand(
  device: Device,
  pin: string,
  value: number | null,
  strValue?: string | null,
  source = "dashboard",
) {
  const command = await prisma.deviceCommand.upsert({
    where: { deviceId_pin: { deviceId: device.id, pin } },
    create: { deviceId: device.id, pin, value, strValue: strValue ?? null, source },
    update: { value, strValue: strValue ?? null, source },
  });

  // Best-effort MQTT downlink (persisted above regardless of broker state).
  await publishCommand(device.deviceId, { pin, value, strValue });

  // Low-code hook: let n8n flows react to control changes.
  void dispatchEvent("COMMAND", device, { pin, value, strValue });

  return command;
}

/** Return the current pin states for a device as `{ V1: 1, relay: 0, ... }`. */
export async function getPinStates(
  deviceInternalId: string,
): Promise<Record<string, number | string | null>> {
  const rows = await prisma.deviceCommand.findMany({
    where: { deviceId: deviceInternalId },
    orderBy: { pin: "asc" },
  });
  const state: Record<string, number | string | null> = {};
  for (const r of rows) {
    state[r.pin] = r.strValue ?? r.value ?? null;
  }
  return state;
}

import type { AutomationEvent, Device } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { deliverToWebhook } from "@/lib/n8n";

/**
 * Event dispatch — the heart of the low-code layer.
 *
 * Whenever something happens on the platform (telemetry stored, alert raised,
 * device online/offline, command sent) we look up matching Automations for the
 * device's owner + project and POST a normalized envelope to each linked n8n
 * webhook. n8n flows then do the no-code work (notify, control, log, AI, …).
 *
 * Delivery is fire-and-forget and fully isolated: a failing or slow flow never
 * affects telemetry ingestion. Every automation runs the same envelope shape so
 * flows are easy to build.
 */

export type EventPayload = {
  // TELEMETRY
  metric?: string;
  value?: number | null;
  readings?: Record<string, number | null>;
  // ALERT
  message?: string;
  ruleName?: string;
  // COMMAND
  pin?: string;
  strValue?: string | null;
};

function buildEnvelope(
  event: AutomationEvent,
  device: Device,
  payload: EventPayload,
) {
  return {
    event,
    firedAt: new Date().toISOString(),
    device: {
      id: device.id,
      deviceId: device.deviceId,
      name: device.name,
      type: device.type,
      status: device.status,
      projectId: device.projectId,
      location: device.location,
      latitude: device.latitude,
      longitude: device.longitude,
    },
    payload,
    // Handy callbacks so flows can immediately control the device / read data.
    api: {
      base: (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, ""),
      command: `/api/devices/${device.id}/command`,
      telemetry: "/api/telemetry",
    },
  };
}

/** Does an automation's optional device/metric filters match this event? */
function matches(
  a: { deviceId: string | null; metric: string | null },
  device: Device,
  payload: EventPayload,
): boolean {
  if (a.deviceId && a.deviceId !== device.id) return false;
  if (a.metric && payload.metric && a.metric !== payload.metric) return false;
  return true;
}

/**
 * Dispatch an event to all matching enabled automations for the device owner.
 * Non-blocking: callers use `void dispatchEvent(...)`.
 */
export async function dispatchEvent(
  event: AutomationEvent,
  device: Device,
  payload: EventPayload = {},
): Promise<void> {
  try {
    const automations = await prisma.automation.findMany({
      where: {
        event,
        enabled: true,
        ownerId: device.ownerId,
        projectId: device.projectId,
      },
    });
    if (automations.length === 0) return;

    const envelope = buildEnvelope(event, device, payload);

    await Promise.all(
      automations
        .filter((a) => matches(a, device, payload))
        .map(async (a) => {
          const { ok, status } = await deliverToWebhook(a.n8nWebhookUrl, envelope);
          await prisma.automation
            .update({
              where: { id: a.id },
              data: { lastFiredAt: new Date(), lastStatus: status },
            })
            .catch(() => {});
          if (!ok) {
            // eslint-disable-next-line no-console
            console.error(`[automation ${a.name}] ${status}`);
          }
        }),
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[dispatchEvent] error", err);
  }
}

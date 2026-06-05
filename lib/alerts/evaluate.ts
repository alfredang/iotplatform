import type { AlertOperator } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { metricUnit } from "@/lib/utils";
import { getMailConfig, sendEmail } from "@/lib/email";

/**
 * Email a triggered alert to the configured recipient when email alerts are
 * enabled (Admin → Email settings). Failures never block ingestion.
 */
async function notifyAlert(
  device: { name: string; ownerId: string },
  message: string,
): Promise<void> {
  try {
    const cfg = await getMailConfig();
    if (!cfg.emailAlertsEnabled) return;
    let to = cfg.alertEmail;
    if (!to) {
      const owner = await prisma.user.findUnique({
        where: { id: device.ownerId },
        select: { notificationEmail: true, email: true },
      });
      to = owner?.notificationEmail || owner?.email || null;
    }
    if (!to) return;
    await sendEmail({ to, subject: `IoT alert: ${device.name}`, text: message });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("alert email failed:", e);
  }
}

function compare(op: AlertOperator, value: number, threshold: number): boolean {
  switch (op) {
    case "GT":
      return value > threshold;
    case "LT":
      return value < threshold;
    case "GTE":
      return value >= threshold;
    case "LTE":
      return value <= threshold;
    case "EQ":
      return value === threshold;
    default:
      return false;
  }
}

const OP_TEXT: Record<AlertOperator, string> = {
  GT: ">",
  LT: "<",
  GTE: "≥",
  LTE: "≤",
  EQ: "=",
  OFFLINE: "offline",
};

/**
 * Evaluate all enabled threshold rules for a device/metric against a new value.
 * Creates an Alert when a rule trips and there isn't already an ACTIVE alert
 * for that rule (dedupe). Returns the number of new alerts raised.
 */
export async function evaluateMetric(
  deviceId: string,
  metric: string,
  value: number,
): Promise<number> {
  const rules = await prisma.alertRule.findMany({
    where: { deviceId, metric, enabled: true, operator: { not: "OFFLINE" } },
  });

  let raised = 0;
  for (const rule of rules) {
    if (rule.threshold === null) continue;
    if (!compare(rule.operator, value, rule.threshold)) continue;

    const existing = await prisma.alert.findFirst({
      where: { ruleId: rule.id, status: "ACTIVE" },
    });
    if (existing) continue;

    const device = await prisma.device.findUnique({ where: { id: deviceId } });
    const unit = metricUnit(metric);
    const message = `${device?.name ?? "Device"}: ${metric} ${value}${unit} ${OP_TEXT[rule.operator]} threshold ${rule.threshold}${unit}`;
    await prisma.alert.create({
      data: { ruleId: rule.id, deviceId, value, message },
    });
    if (device) await notifyAlert(device, message);
    raised++;
  }
  return raised;
}

/**
 * Sweep for offline devices: mark devices OFFLINE when they haven't reported
 * within the threshold, and raise alerts for matching OFFLINE rules. Intended
 * to run periodically from the worker. Returns counts for logging.
 */
export async function evaluateOffline(offlineSeconds = 120): Promise<{
  markedOffline: number;
  raised: number;
}> {
  const cutoff = new Date(Date.now() - offlineSeconds * 1000);

  const goneOffline = await prisma.device.findMany({
    where: {
      status: "ONLINE",
      OR: [{ lastSeen: { lt: cutoff } }, { lastSeen: null }],
    },
  });

  let raised = 0;
  for (const device of goneOffline) {
    await prisma.device.update({
      where: { id: device.id },
      data: { status: "OFFLINE" },
    });

    const rules = await prisma.alertRule.findMany({
      where: { deviceId: device.id, operator: "OFFLINE", enabled: true },
    });
    for (const rule of rules) {
      const downForMs = device.lastSeen
        ? Date.now() - device.lastSeen.getTime()
        : Number.MAX_SAFE_INTEGER;
      if (downForMs < rule.durationSecs * 1000) continue;

      const existing = await prisma.alert.findFirst({
        where: { ruleId: rule.id, status: "ACTIVE" },
      });
      if (existing) continue;

      const message = `${device.name}: offline for more than ${rule.durationSecs}s`;
      await prisma.alert.create({
        data: { ruleId: rule.id, deviceId: device.id, message },
      });
      await notifyAlert(device, message);
      raised++;
    }
  }

  return { markedOffline: goneOffline.length, raised };
}

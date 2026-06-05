import { prisma } from "@/lib/db/prisma";
import { requireApiUser } from "@/lib/auth/rbac";
import { alertRuleSchema } from "@/lib/validation";
import { handleApiError, parseBody } from "@/lib/api";
import { getOwnedDevice } from "@/lib/devices";

export const dynamic = "force-dynamic";

/** GET /api/alerts — active + recent alerts and the user's alert rules. */
export async function GET(req: Request) {
  try {
    const user = await requireApiUser("VIEWER");
    const url = new URL(req.url);
    const status = url.searchParams.get("status"); // ACTIVE | RESOLVED | null

    const deviceIds = (
      await prisma.device.findMany({
        where: { ownerId: user.id },
        select: { id: true },
      })
    ).map((d) => d.id);

    const alerts = await prisma.alert.findMany({
      where: {
        deviceId: { in: deviceIds },
        ...(status === "ACTIVE" || status === "RESOLVED" ? { status } : {}),
      },
      orderBy: { triggeredAt: "desc" },
      take: 200,
      include: {
        device: { select: { name: true, deviceId: true } },
        rule: { select: { name: true } },
      },
    });

    const rules = await prisma.alertRule.findMany({
      where: { deviceId: { in: deviceIds } },
      orderBy: { createdAt: "desc" },
      include: { device: { select: { name: true, deviceId: true } } },
    });

    return Response.json({ alerts, rules });
  } catch (err) {
    return handleApiError(err);
  }
}

/** POST /api/alerts — create an alert rule. */
export async function POST(req: Request) {
  try {
    const user = await requireApiUser("USER");
    const data = await parseBody(req, alertRuleSchema);
    await getOwnedDevice(data.deviceId, user.id);

    const rule = await prisma.alertRule.create({
      data: {
        name: data.name,
        deviceId: data.deviceId,
        metric: data.operator === "OFFLINE" ? null : data.metric || null,
        operator: data.operator,
        threshold: data.operator === "OFFLINE" ? null : data.threshold,
        durationSecs: data.durationSecs,
        enabled: data.enabled,
      },
    });
    return Response.json({ rule }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

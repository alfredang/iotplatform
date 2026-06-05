import { prisma } from "@/lib/db/prisma";
import { requireApiUser } from "@/lib/auth/rbac";
import { handleApiError } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/summary
 * Counts, latest telemetry and recent activity for the signed-in user.
 */
export async function GET() {
  try {
    const user = await requireApiUser("VIEWER");

    const devices = await prisma.device.findMany({
      where: { ownerId: user.id },
      select: { id: true, name: true, deviceId: true, status: true, lastSeen: true },
    });
    const deviceIds = devices.map((d) => d.id);

    const online = devices.filter((d) => d.status === "ONLINE").length;
    const activeAlerts = await prisma.alert.count({
      where: { deviceId: { in: deviceIds }, status: "ACTIVE" },
    });

    const latestTelemetry = await prisma.telemetry.findMany({
      where: { deviceId: { in: deviceIds } },
      orderBy: { ts: "desc" },
      take: 8,
      include: { device: { select: { name: true, deviceId: true } } },
    });

    const recentAlerts = await prisma.alert.findMany({
      where: { deviceId: { in: deviceIds } },
      orderBy: { triggeredAt: "desc" },
      take: 6,
      include: { device: { select: { name: true } } },
    });

    return Response.json({
      counts: {
        total: devices.length,
        online,
        offline: devices.length - online,
        activeAlerts,
      },
      latestTelemetry,
      recentAlerts,
      devices,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

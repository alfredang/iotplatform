import { prisma } from "@/lib/db/prisma";
import { requireApiUser } from "@/lib/auth/rbac";
import { getOwnedDevice } from "@/lib/devices";
import { handleApiError } from "@/lib/api";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/devices/:id/telemetry?metric=&limit=&since=
 * Returns telemetry rows for one device (newest first).
 */
export async function GET(req: Request, { params }: Ctx) {
  try {
    const user = await requireApiUser("VIEWER");
    const { id } = await params;
    await getOwnedDevice(id, user.id);

    const url = new URL(req.url);
    const metric = url.searchParams.get("metric");
    const limit = Math.min(Number(url.searchParams.get("limit") || 200), 2000);
    const since = url.searchParams.get("since");

    const rows = await prisma.telemetry.findMany({
      where: {
        deviceId: id,
        ...(metric ? { metric } : {}),
        ...(since ? { ts: { gte: new Date(since) } } : {}),
      },
      orderBy: { ts: "desc" },
      take: limit,
    });

    // Distinct metric names for this device (for chart/metric pickers).
    const metrics = await prisma.telemetry.findMany({
      where: { deviceId: id },
      distinct: ["metric"],
      select: { metric: true },
    });

    return Response.json({
      telemetry: rows,
      metrics: metrics.map((m) => m.metric),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

import { prisma } from "@/lib/db/prisma";
import { requireApiUser, AuthError } from "@/lib/auth/rbac";
import { widgetSchema } from "@/lib/validation";
import { handleApiError, parseBody } from "@/lib/api";
import { getOrCreateDefaultDashboard } from "@/lib/dashboard";
import { resolveProject } from "@/lib/projects";

export const dynamic = "force-dynamic";

/** GET /api/dashboard/widgets — the current project's dashboard with its widgets. */
export async function GET(req: Request) {
  try {
    const user = await requireApiUser();
    const url = new URL(req.url);
    const project = await resolveProject(user.id, url.searchParams.get("projectId"));
    const dashboard = await getOrCreateDefaultDashboard(user.id, project.id);
    const widgets = await prisma.widget.findMany({
      where: { dashboardId: dashboard.id },
      orderBy: { position: "asc" },
      include: {
        device: { select: { id: true, name: true, deviceId: true, status: true } },
      },
    });
    return Response.json({ dashboard, widgets });
  } catch (err) {
    return handleApiError(err);
  }
}

/** POST /api/dashboard/widgets — add a widget to the default dashboard. */
export async function POST(req: Request) {
  try {
    const user = await requireApiUser("USER");
    const url = new URL(req.url);
    const project = await resolveProject(user.id, url.searchParams.get("projectId"));
    const data = await parseBody(req, widgetSchema);
    const dashboard = await getOrCreateDefaultDashboard(user.id, project.id);

    // If a device is referenced, ensure it belongs to the user.
    if (data.deviceId) {
      const owned = await prisma.device.findFirst({
        where: { id: data.deviceId, ownerId: user.id },
      });
      if (!owned) throw new AuthError("Device not found", 404);
    }

    const count = await prisma.widget.count({ where: { dashboardId: dashboard.id } });
    const widget = await prisma.widget.create({
      data: {
        dashboardId: dashboard.id,
        type: data.type,
        title: data.title || "",
        deviceId: data.deviceId || null,
        metric: data.metric || null,
        config: data.config ?? undefined,
        position: count,
      },
      include: {
        device: { select: { id: true, name: true, deviceId: true, status: true } },
      },
    });
    return Response.json({ widget }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

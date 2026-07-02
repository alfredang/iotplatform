import { prisma } from "@/lib/db/prisma";
import { requireApiUser, AuthError } from "@/lib/auth/rbac";
import { automationSchema } from "@/lib/validation";
import { handleApiError, parseBody } from "@/lib/api";
import { resolveProject } from "@/lib/projects";

export const dynamic = "force-dynamic";

/** GET /api/automations — automations for the current project. */
export async function GET(req: Request) {
  try {
    const user = await requireApiUser();
    const url = new URL(req.url);
    const project = await resolveProject(user.id, url.searchParams.get("projectId"));
    const automations = await prisma.automation.findMany({
      where: { ownerId: user.id, projectId: project.id },
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ automations });
  } catch (err) {
    return handleApiError(err);
  }
}

/** POST /api/automations — link a platform event to an n8n webhook. */
export async function POST(req: Request) {
  try {
    const user = await requireApiUser("USER");
    const url = new URL(req.url);
    const project = await resolveProject(user.id, url.searchParams.get("projectId"));
    const data = await parseBody(req, automationSchema);

    if (data.deviceId) {
      const owned = await prisma.device.findFirst({
        where: { id: data.deviceId, ownerId: user.id },
      });
      if (!owned) throw new AuthError("Device not found", 404);
    }

    const automation = await prisma.automation.create({
      data: {
        name: data.name,
        ownerId: user.id,
        projectId: project.id,
        event: data.event,
        deviceId: data.deviceId || null,
        metric: data.metric || null,
        n8nWebhookUrl: data.n8nWebhookUrl,
        n8nWorkflowId: data.n8nWorkflowId || null,
        enabled: data.enabled,
      },
    });
    return Response.json({ automation }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

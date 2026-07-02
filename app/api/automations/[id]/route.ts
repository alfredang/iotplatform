import { prisma } from "@/lib/db/prisma";
import { requireApiUser, AuthError } from "@/lib/auth/rbac";
import { automationUpdateSchema } from "@/lib/validation";
import { handleApiError, parseBody } from "@/lib/api";
import { deliverToWebhook } from "@/lib/n8n";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function getOwned(id: string, ownerId: string) {
  const automation = await prisma.automation.findFirst({ where: { id, ownerId } });
  if (!automation) throw new AuthError("Automation not found", 404);
  return automation;
}

/** PATCH /api/automations/:id — update (toggle enabled, edit fields). */
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const user = await requireApiUser("USER");
    const { id } = await params;
    await getOwned(id, user.id);
    const data = await parseBody(req, automationUpdateSchema);
    const automation = await prisma.automation.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.event !== undefined ? { event: data.event } : {}),
        ...(data.deviceId !== undefined ? { deviceId: data.deviceId || null } : {}),
        ...(data.metric !== undefined ? { metric: data.metric || null } : {}),
        ...(data.n8nWebhookUrl !== undefined ? { n8nWebhookUrl: data.n8nWebhookUrl } : {}),
        ...(data.n8nWorkflowId !== undefined ? { n8nWorkflowId: data.n8nWorkflowId || null } : {}),
        ...(data.enabled !== undefined ? { enabled: data.enabled } : {}),
      },
    });
    return Response.json({ automation });
  } catch (err) {
    return handleApiError(err);
  }
}

/** DELETE /api/automations/:id */
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const user = await requireApiUser("USER");
    const { id } = await params;
    await getOwned(id, user.id);
    await prisma.automation.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}

/** POST /api/automations/:id/test lives here as ?action=test for simplicity. */
export async function POST(req: Request, { params }: Ctx) {
  try {
    const user = await requireApiUser("USER");
    const { id } = await params;
    const automation = await getOwned(id, user.id);
    // Send a sample envelope so users can confirm their n8n flow fires.
    const { ok, status } = await deliverToWebhook(automation.n8nWebhookUrl, {
      event: automation.event,
      test: true,
      firedAt: new Date().toISOString(),
      device: { deviceId: "test-device", name: "Test Device", status: "ONLINE" },
      payload: { metric: "temperature", value: 42, message: "Test event from IoTFlow" },
    });
    await prisma.automation.update({
      where: { id },
      data: { lastFiredAt: new Date(), lastStatus: status },
    });
    return Response.json({ ok, status });
  } catch (err) {
    return handleApiError(err);
  }
}

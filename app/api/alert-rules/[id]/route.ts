import { prisma } from "@/lib/db/prisma";
import { requireApiUser, AuthError } from "@/lib/auth/rbac";
import { handleApiError } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

async function ownedRule(id: string, ownerId: string) {
  const rule = await prisma.alertRule.findFirst({
    where: { id, device: { ownerId } },
  });
  if (!rule) throw new AuthError("Rule not found", 404);
  return rule;
}

/** PATCH /api/alert-rules/:id — toggle enabled or edit threshold. */
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const user = await requireApiUser("USER");
    const { id } = await params;
    await ownedRule(id, user.id);
    const body = (await req.json()) as {
      enabled?: boolean;
      threshold?: number;
      durationSecs?: number;
    };

    const rule = await prisma.alertRule.update({
      where: { id },
      data: {
        ...(typeof body.enabled === "boolean" ? { enabled: body.enabled } : {}),
        ...(typeof body.threshold === "number" ? { threshold: body.threshold } : {}),
        ...(typeof body.durationSecs === "number"
          ? { durationSecs: body.durationSecs }
          : {}),
      },
    });
    return Response.json({ rule });
  } catch (err) {
    return handleApiError(err);
  }
}

/** DELETE /api/alert-rules/:id */
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const user = await requireApiUser("USER");
    const { id } = await params;
    await ownedRule(id, user.id);
    await prisma.alertRule.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}

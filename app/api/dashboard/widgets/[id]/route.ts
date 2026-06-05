import { prisma } from "@/lib/db/prisma";
import { requireApiUser, AuthError } from "@/lib/auth/rbac";
import { handleApiError } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

/** DELETE /api/dashboard/widgets/:id */
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const user = await requireApiUser("USER");
    const { id } = await params;
    const widget = await prisma.widget.findFirst({
      where: { id, dashboard: { ownerId: user.id } },
    });
    if (!widget) throw new AuthError("Widget not found", 404);
    await prisma.widget.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}

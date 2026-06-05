import { prisma } from "@/lib/db/prisma";
import { requireApiUser } from "@/lib/auth/rbac";
import { handleApiError } from "@/lib/api";
import { AuthError } from "@/lib/auth/rbac";

type Ctx = { params: Promise<{ id: string }> };

/** PUT /api/alerts/:id/resolve — mark an alert resolved. */
export async function PUT(_req: Request, { params }: Ctx) {
  try {
    const user = await requireApiUser("USER");
    const { id } = await params;

    const alert = await prisma.alert.findFirst({
      where: { id, device: { ownerId: user.id } },
    });
    if (!alert) throw new AuthError("Alert not found", 404);

    const updated = await prisma.alert.update({
      where: { id },
      data: { status: "RESOLVED", resolvedAt: new Date() },
    });
    return Response.json({ alert: updated });
  } catch (err) {
    return handleApiError(err);
  }
}

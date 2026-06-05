import { prisma } from "@/lib/db/prisma";
import { requireAdminApi, AuthError } from "@/lib/auth/rbac";
import { handleApiError } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/admin/users/:id — change role and/or activation (admin only). */
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const admin = await requireAdminApi();
    const { id } = await params;
    const body = (await req.json()) as { role?: "ADMIN" | "USER"; disabled?: boolean };

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) throw new AuthError("User not found", 404);

    // Prevent admins from locking themselves out.
    if (id === admin.id && (body.disabled === true || body.role === "USER")) {
      return Response.json(
        { error: "You can't deactivate or demote your own account" },
        { status: 400 },
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(body.role ? { role: body.role } : {}),
        ...(typeof body.disabled === "boolean" ? { disabled: body.disabled } : {}),
      },
      select: { id: true, role: true, disabled: true },
    });
    return Response.json({ user });
  } catch (err) {
    return handleApiError(err);
  }
}

/** DELETE /api/admin/users/:id — remove a user (admin only). */
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const admin = await requireAdminApi();
    const { id } = await params;
    if (id === admin.id) {
      return Response.json({ error: "You can't delete your own account" }, { status: 400 });
    }
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) throw new AuthError("User not found", 404);

    await prisma.user.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}

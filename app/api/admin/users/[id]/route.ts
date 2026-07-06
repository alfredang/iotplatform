import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { bustRoleCache } from "@/lib/auth/auth";
import { requireAdminApi, AuthError } from "@/lib/auth/rbac";
import { handleApiError, parseBody } from "@/lib/api";
import { adminUserUpdateSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/admin/users/:id — edit profile, credentials, role or activation (admin only). */
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const admin = await requireAdminApi();
    const { id } = await params;
    const body = await parseBody(req, adminUserUpdateSchema);

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) throw new AuthError("User not found", 404);

    // Prevent admins from locking themselves out.
    if (id === admin.id && (body.disabled === true || body.role === "USER")) {
      return Response.json(
        { error: "You can't deactivate or demote your own account" },
        { status: 400 },
      );
    }

    if (body.email && body.email !== target.email) {
      const existing = await prisma.user.findUnique({ where: { email: body.email } });
      if (existing) {
        return Response.json(
          { error: "An account with that email already exists" },
          { status: 409 },
        );
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(body.name ? { name: body.name } : {}),
        ...(body.email ? { email: body.email } : {}),
        ...(body.password ? { hashedPassword: bcrypt.hashSync(body.password, 10) } : {}),
        ...(body.role ? { role: body.role } : {}),
        ...(typeof body.disabled === "boolean" ? { disabled: body.disabled } : {}),
      },
      select: { id: true, name: true, email: true, role: true, disabled: true },
    });
    bustRoleCache(id);
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
    bustRoleCache(id);
    return Response.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}

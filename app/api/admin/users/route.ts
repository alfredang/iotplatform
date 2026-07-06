import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { requireAdminApi } from "@/lib/auth/rbac";
import { handleApiError, parseBody } from "@/lib/api";
import { adminUserCreateSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** GET /api/admin/users — list all users (admin only). */
export async function GET() {
  try {
    await requireAdminApi();
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        disabled: true,
        createdAt: true,
        _count: { select: { devices: true, projects: true } },
      },
    });
    return Response.json({ users });
  } catch (err) {
    return handleApiError(err);
  }
}

/** POST /api/admin/users — create an account with a chosen role (admin only). */
export async function POST(req: Request) {
  try {
    await requireAdminApi();
    const { name, email, password, role } = await parseBody(req, adminUserCreateSchema);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return Response.json(
        { error: "An account with that email already exists" },
        { status: 409 },
      );
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword: bcrypt.hashSync(password, 10),
        role,
        notificationEmail: email,
        // Admin-created accounts skip the self-service email verification.
        emailVerified: new Date(),
      },
      select: { id: true, name: true, email: true, role: true, disabled: true },
    });
    return Response.json({ user }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

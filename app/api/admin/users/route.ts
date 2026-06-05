import { prisma } from "@/lib/db/prisma";
import { requireAdminApi } from "@/lib/auth/rbac";
import { handleApiError } from "@/lib/api";

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

import { prisma } from "@/lib/db/prisma";
import { requireApiUser, AuthError } from "@/lib/auth/rbac";
import { handleApiError } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

/** DELETE /api/api-keys/:id — revoke (soft) an API key. */
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const user = await requireApiUser("USER");
    const { id } = await params;
    const key = await prisma.apiKey.findFirst({ where: { id, ownerId: user.id } });
    if (!key) throw new AuthError("Key not found", 404);

    await prisma.apiKey.update({ where: { id }, data: { revoked: true } });
    return Response.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}

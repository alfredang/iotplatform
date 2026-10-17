import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { requireApiUser } from "@/lib/auth/rbac";
import { bustRoleCache } from "@/lib/auth/auth";
import { changePasswordSchema } from "@/lib/validation";
import { handleApiError, parseBody } from "@/lib/api";

/**
 * POST /api/account/password — set the signed-in user's password.
 *
 * Accounts still on their emailed default password (mustChangePassword) may
 * have signed in with a one-time code, so they aren't asked for the current
 * password; everyone else who has one must confirm it.
 */
export async function POST(req: Request) {
  try {
    const me = await requireApiUser();
    const { currentPassword, password } = await parseBody(req, changePasswordSchema);

    const user = await prisma.user.findUnique({
      where: { id: me.id },
      select: { hashedPassword: true, mustChangePassword: true },
    });
    if (!user) return Response.json({ error: "Account not found" }, { status: 404 });

    if (user.hashedPassword && !user.mustChangePassword) {
      const ok = await bcrypt.compare(currentPassword ?? "", user.hashedPassword);
      if (!ok) {
        return Response.json({ error: "Current password is incorrect" }, { status: 400 });
      }
    }
    if (user.hashedPassword && (await bcrypt.compare(password, user.hashedPassword))) {
      return Response.json(
        { error: "Choose a password different from your current one" },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { id: me.id },
      data: { hashedPassword: bcrypt.hashSync(password, 10), mustChangePassword: false },
    });
    bustRoleCache(me.id);

    return Response.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}

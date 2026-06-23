import { prisma } from "@/lib/db/prisma";
import { requireApiUser } from "@/lib/auth/rbac";
import { handleApiError } from "@/lib/api";

/**
 * DELETE /api/account — permanently delete the signed-in user's own account.
 *
 * Required by App Store Review Guideline 5.1.1(v): any app offering account
 * creation must let the user initiate deletion in-app. We deactivate and
 * anonymize the row (rather than hard-deleting) so legally-required device /
 * telemetry records stay linkable, while making the account unusable and
 * unrecoverable. The credentials provider already rejects `disabled` users, so
 * the deleted account can never sign back in.
 */
export async function DELETE() {
  try {
    const me = await requireApiUser();

    await prisma.user.update({
      where: { id: me.id },
      data: {
        disabled: true,
        email: `deleted+${me.id}@deleted.invalid`,
        hashedPassword: null,
        name: null,
        image: null,
        orgName: null,
        notificationEmail: null,
      },
    });

    // Drop federated logins so OAuth can't resurrect the session.
    await prisma.account.deleteMany({ where: { userId: me.id } });
    await prisma.session.deleteMany({ where: { userId: me.id } });

    return Response.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}

import { prisma } from "@/lib/db/prisma";
import { requireApiUser } from "@/lib/auth/rbac";
import { handleApiError } from "@/lib/api";
import { cancelRecurringBilling } from "@/lib/hitpay";

/**
 * POST /api/billing/cancel — stop renewing. The paid plan stays until the
 * period already paid for ends, then the account falls back to Free.
 */
export async function POST() {
  try {
    const me = await requireApiUser();
    const user = await prisma.user.findUnique({
      where: { id: me.id },
      select: { hitpayRecurringId: true },
    });
    if (!user?.hitpayRecurringId) {
      return Response.json({ error: "No subscription to cancel." }, { status: 400 });
    }
    await cancelRecurringBilling(user.hitpayRecurringId);
    await prisma.user.update({
      where: { id: me.id },
      data: { subscriptionStatus: "canceled" },
    });
    return Response.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}

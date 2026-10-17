import { prisma } from "@/lib/db/prisma";
import { requireApiUser } from "@/lib/auth/rbac";
import { handleApiError } from "@/lib/api";
import { getUsageSummary } from "@/lib/usage";
import { hitpayConfigured } from "@/lib/hitpay";

export const dynamic = "force-dynamic";

/** GET /api/billing — the signed-in user's plan, limits, usage and subscription. */
export async function GET() {
  try {
    const me = await requireApiUser();
    const [usage, sub] = await Promise.all([
      getUsageSummary(me.id),
      prisma.user.findUnique({
        where: { id: me.id },
        select: { planExpiresAt: true, subscriptionStatus: true, hitpayRecurringId: true },
      }),
    ]);
    return Response.json({
      ...usage,
      // Infinity doesn't survive JSON; null means unlimited.
      limits: usage
        ? Object.fromEntries(
            Object.entries(usage.limits).map(([k, v]) => [k, Number.isFinite(v) ? v : null]),
          )
        : null,
      planExpiresAt: sub?.planExpiresAt ?? null,
      subscriptionStatus: sub?.subscriptionStatus ?? null,
      hasSubscription: Boolean(sub?.hitpayRecurringId),
      checkoutAvailable: hitpayConfigured(),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

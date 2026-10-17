import { prisma } from "@/lib/db/prisma";
import { requireApiUser } from "@/lib/auth/rbac";
import { handleApiError, parseBody } from "@/lib/api";
import { checkoutSchema } from "@/lib/validation";
import { createRecurringBilling, hitpayConfigured } from "@/lib/hitpay";

/**
 * POST /api/billing/checkout { plan } — start a HitPay monthly subscription and
 * return the hosted page where the customer attaches a card. The plan is only
 * granted once HitPay reports a successful charge (see the webhook).
 */
export async function POST(req: Request) {
  try {
    const me = await requireApiUser();
    const { plan } = await parseBody(req, checkoutSchema);

    if (me.role === "ADMIN") {
      return Response.json({ error: "Admin accounts are already unlimited." }, { status: 400 });
    }
    if (!hitpayConfigured()) {
      return Response.json(
        { error: "Online payment isn't set up yet — email enquiry@tertiaryinfotech.com to upgrade." },
        { status: 503 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: me.id },
      select: { email: true, name: true, subscriptionStatus: true, hitpayRecurringId: true },
    });
    if (!user) return Response.json({ error: "Account not found" }, { status: 404 });
    // One subscription at a time, so nobody is ever billed twice.
    if (user.hitpayRecurringId && ["active", "scheduled"].includes(user.subscriptionStatus ?? "")) {
      return Response.json(
        { error: "You already have an active subscription. Cancel it first, then choose a new plan." },
        { status: 409 },
      );
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin).replace(/\/$/, "");
    const { id, url } = await createRecurringBilling({
      userId: me.id,
      email: user.email,
      name: user.name,
      plan,
      appUrl,
    });
    await prisma.user.update({
      where: { id: me.id },
      data: { hitpayRecurringId: id, subscriptionStatus: "pending" },
    });
    return Response.json({ url });
  } catch (err) {
    return handleApiError(err);
  }
}

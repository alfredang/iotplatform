import { prisma } from "@/lib/db/prisma";
import { syncSubscription, verifyEventSignature, verifyLegacyHmac } from "@/lib/hitpay";

export const dynamic = "force-dynamic";

type Payload = Record<string, unknown>;

function str(v: unknown): string | undefined {
  return typeof v === "string" && v ? v : undefined;
}

/**
 * POST /api/billing/hitpay/webhook — HitPay subscription + charge events.
 *
 * Accepts both HitPay webhook styles: JSON events signed in the
 * `Hitpay-Signature` header, and legacy form posts carrying an `hmac` field.
 * Unsigned or mis-signed requests are rejected. The payload only identifies
 * the subscription; its state is re-read from the HitPay API.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("hitpay-signature");

  let body: Payload;
  if (signature) {
    if (!verifyEventSignature(raw, signature)) {
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }
    try {
      body = JSON.parse(raw) as Payload;
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }
  } else {
    const fields = Object.fromEntries(new URLSearchParams(raw));
    if (!verifyLegacyHmac(fields)) {
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }
    body = fields;
  }

  const nested = (body.recurring_billing ?? {}) as Payload;
  const objectType = req.headers.get("hitpay-event-object") ?? "";
  let recurringId =
    str(body.recurring_billing_id) ??
    str(nested.id) ??
    (objectType.includes("recurring") ? str(body.id) : undefined);

  // Charge events may only carry the customer; map them to the user's subscription.
  if (!recurringId) {
    const email = str((body.customer as Payload | undefined)?.email) ?? str(body.customer_email);
    if (email) {
      const user = await prisma.user.findFirst({
        where: { email: email.toLowerCase(), hitpayRecurringId: { not: null } },
        select: { hitpayRecurringId: true },
      });
      recurringId = user?.hitpayRecurringId ?? undefined;
    }
  }
  if (!recurringId) return Response.json({ ok: true, ignored: "no subscription in event" });

  const status = (str(body.status) ?? "").toLowerCase();
  const paid = ["succeeded", "completed", "paid"].includes(status);
  try {
    const result = await syncSubscription(recurringId, paid);
    return Response.json({ ok: true, ...result });
  } catch (err) {
    console.error("[hitpay webhook]", err);
    // 5xx so HitPay retries later.
    return Response.json({ error: "Sync failed" }, { status: 502 });
  }
}

import { createHmac, timingSafeEqual } from "crypto";
import type { Plan, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { PLANS } from "@/lib/plans";
import { bustPlanCache } from "@/lib/usage";

/**
 * HitPay recurring billing (https://docs.hitpayapp.com/apis/guide/recurring-billing).
 *
 *   HITPAY_API_KEY        business API key (Developers → API Keys)
 *   HITPAY_SALT           API-key salt — signs legacy form webhooks (`hmac` field)
 *   HITPAY_WEBHOOK_SALT   webhook-endpoint salt — signs `Hitpay-Signature` events
 *   HITPAY_SANDBOX=true   use api.sandbox.hit-pay.com
 *
 * Webhook payloads are only used to find *which* subscription changed; its
 * state is always re-read from the HitPay API before a plan is granted.
 */

/** Paid period plus grace: a monthly charge must land before this runs out. */
const PERIOD_MS = 33 * 24 * 3600 * 1000;

function baseUrl() {
  return process.env.HITPAY_SANDBOX === "true"
    ? "https://api.sandbox.hit-pay.com/v1"
    : "https://api.hit-pay.com/v1";
}

export function hitpayConfigured(): boolean {
  return Boolean(process.env.HITPAY_API_KEY);
}

async function hitpay<T>(path: string, init: { method: string; form?: Record<string, string> }): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: init.method,
    headers: {
      "X-BUSINESS-API-KEY": process.env.HITPAY_API_KEY ?? "",
      "X-Requested-With": "XMLHttpRequest",
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: init.form ? new URLSearchParams(init.form).toString() : undefined,
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HitPay ${init.method} ${path} failed (${res.status}): ${text.slice(0, 300)}`);
  return (text ? JSON.parse(text) : {}) as T;
}

type RecurringBilling = {
  id: string;
  status?: string;
  url?: string;
  reference?: string | null;
  customer_email?: string | null;
};

/** Today's date in Singapore time — HitPay's start_date is SGT. */
function todaySgt(): string {
  return new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
}

/** Creates the subscription and returns HitPay's hosted page to attach a card. */
export async function createRecurringBilling(opts: {
  userId: string;
  email: string;
  name: string | null;
  plan: Plan;
  appUrl: string;
}): Promise<{ id: string; url: string }> {
  const info = PLANS[opts.plan];
  const rb = await hitpay<RecurringBilling>("/recurring-billing", {
    method: "POST",
    form: {
      name: `IoTFlow ${info.name}`,
      description: `IoTFlow ${info.name} plan — monthly`,
      cycle: "monthly",
      amount: info.priceSgd.toFixed(2),
      currency: "SGD",
      customer_email: opts.email,
      customer_name: opts.name || opts.email,
      start_date: todaySgt(),
      redirect_url: `${opts.appUrl}/billing?checkout=done`,
      reference: `${opts.userId}:${opts.plan}`,
      webhook: `${opts.appUrl}/api/billing/hitpay/webhook`,
      send_email: "true",
    },
  });
  if (!rb.id || !rb.url) throw new Error("HitPay did not return a checkout URL");
  return { id: rb.id, url: rb.url };
}

export function getRecurringBilling(id: string) {
  return hitpay<RecurringBilling>(`/recurring-billing/${encodeURIComponent(id)}`, { method: "GET" });
}

export function cancelRecurringBilling(id: string) {
  return hitpay<RecurringBilling>(`/recurring-billing/${encodeURIComponent(id)}`, { method: "DELETE" });
}

function safeEqualHex(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Webhook-event signature: HMAC-SHA256 of the raw body with the endpoint salt. */
export function verifyEventSignature(rawBody: string, signature: string): boolean {
  const salt = process.env.HITPAY_WEBHOOK_SALT || process.env.HITPAY_SALT;
  if (!salt || !signature) return false;
  const expected = createHmac("sha256", salt).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature.trim().toLowerCase());
}

/**
 * Legacy form webhook: `hmac` = HMAC-SHA256 over every other field, sorted by
 * key and concatenated as key+value, with the API-key salt.
 */
export function verifyLegacyHmac(fields: Record<string, string>): boolean {
  const salt = process.env.HITPAY_SALT;
  const given = fields.hmac;
  if (!salt || !given) return false;
  const source = Object.keys(fields)
    .filter((k) => k !== "hmac")
    .sort()
    .map((k) => `${k}${fields[k] ?? ""}`)
    .join("");
  const expected = createHmac("sha256", salt).update(source).digest("hex");
  return safeEqualHex(expected, given.toLowerCase());
}

function parseReference(ref: string | null | undefined): { userId: string; plan: Plan } | null {
  const [userId, plan] = (ref ?? "").split(":");
  if (!userId || !plan || !(plan in PLANS) || plan === "FREE") return null;
  return { userId, plan: plan as Plan };
}

const LIVE_STATUSES = new Set(["active", "scheduled"]);

/**
 * Re-reads a subscription from HitPay and applies it to its user. A
 * successful charge (`paid`) extends the paid period; a cancelled or expired
 * subscription keeps the plan until the period already paid for runs out.
 */
export async function syncSubscription(recurringId: string, paid: boolean) {
  const rb = await getRecurringBilling(recurringId);
  const ref = parseReference(rb.reference);
  const user =
    (await prisma.user.findUnique({ where: { hitpayRecurringId: recurringId } })) ??
    (ref ? await prisma.user.findUnique({ where: { id: ref.userId } }) : null);
  if (!user) return { updated: false, reason: "no matching user" };

  const status = (rb.status ?? "").toLowerCase();
  const live = LIVE_STATUSES.has(status);
  const data: Prisma.UserUpdateInput = {
    hitpayRecurringId: recurringId,
    subscriptionStatus: status || null,
  };
  if (live && paid && ref) {
    // Each successful monthly charge covers the next period from now.
    data.plan = ref.plan;
    data.planExpiresAt = new Date(Date.now() + PERIOD_MS);
  }
  await prisma.user.update({ where: { id: user.id }, data });
  bustPlanCache(user.id);
  return { updated: true, status, granted: Boolean(data.plan) };
}

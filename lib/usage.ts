import type { Plan, Role } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  PLANS,
  QuotaError,
  RateLimitError,
  effectivePlan,
  formatLimit,
  limitsFor,
  type PlanLimits,
} from "@/lib/plans";

// Kept free of Next.js imports: the MQTT worker meters messages through here too.

type AccountPlan = { role: Role; plan: Plan; planExpiresAt: Date | null; ts: number };

// Plan lookups run on every device message, so they're cached briefly. Lives on
// globalThis so a bust from an API route reaches every bundle (see lib/auth).
const PLAN_CACHE_TTL_MS = 30_000;
const holder = globalThis as typeof globalThis & {
  __iotflowPlanCache?: Map<string, AccountPlan>;
  __iotflowUsagePrunedAt?: number;
};
const planCache = (holder.__iotflowPlanCache ??= new Map());

async function getAccountPlan(ownerId: string): Promise<AccountPlan | null> {
  const hit = planCache.get(ownerId);
  if (hit && Date.now() - hit.ts < PLAN_CACHE_TTL_MS) return hit;
  const user = await prisma.user.findUnique({
    where: { id: ownerId },
    select: { role: true, plan: true, planExpiresAt: true },
  });
  if (!user) return null;
  const entry = { ...user, ts: Date.now() };
  if (planCache.size >= 10_000) planCache.clear();
  planCache.set(ownerId, entry);
  return entry;
}

/** Call after changing a user's role or plan so limits apply immediately. */
export function bustPlanCache(ownerId?: string) {
  if (ownerId) planCache.delete(ownerId);
  else planCache.clear();
}

function buckets(now = new Date()) {
  const iso = now.toISOString();
  return { minute: `m:${iso.slice(0, 16)}`, day: `d:${iso.slice(0, 10)}` };
}

async function pruneOldCounters() {
  const last = holder.__iotflowUsagePrunedAt ?? 0;
  if (Date.now() - last < 60 * 60 * 1000) return;
  holder.__iotflowUsagePrunedAt = Date.now();
  await prisma.usageCounter
    .deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 2 * 24 * 3600 * 1000) } } })
    .catch(() => undefined);
}

/**
 * Meter `count` device messages (telemetry or commands) against the owner's
 * plan. Throws RateLimitError once the per-minute or per-day allowance is used
 * up. Admins and unlimited plans are never metered.
 */
export async function consumeMessages(ownerId: string, count = 1): Promise<void> {
  const account = await getAccountPlan(ownerId);
  if (!account) return;
  const limits = limitsFor(account);
  if (!Number.isFinite(limits.perMinute) && !Number.isFinite(limits.perDay)) return;

  const now = new Date();
  const { minute, day } = buckets(now);
  const rows = await prisma.$queryRaw<{ bucket: string; count: number }[]>`
    INSERT INTO "UsageCounter" ("ownerId", "bucket", "count")
    VALUES (${ownerId}, ${minute}, ${count}), (${ownerId}, ${day}, ${count})
    ON CONFLICT ("ownerId", "bucket")
    DO UPDATE SET "count" = "UsageCounter"."count" + EXCLUDED."count"
    RETURNING "bucket", "count"`;
  void pruneOldCounters();

  const used = Object.fromEntries(rows.map((r) => [r.bucket, Number(r.count)]));
  const planName = PLANS[effectivePlan(account)].name;
  if ((used[minute] ?? 0) > limits.perMinute) {
    throw new RateLimitError(
      `Rate limit reached: your ${planName} plan allows ${formatLimit(limits.perMinute)} messages per minute. Slow down or upgrade at /pricing.`,
      60 - now.getUTCSeconds(),
    );
  }
  if ((used[day] ?? 0) > limits.perDay) {
    const midnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
    throw new RateLimitError(
      `Daily limit reached: your ${planName} plan allows ${formatLimit(limits.perDay)} messages per day (resets 00:00 UTC). Upgrade at /pricing for more.`,
      Math.ceil((midnight - now.getTime()) / 1000),
    );
  }
}

export type QuotaKind = "devices" | "apiKeys" | "automations" | "alertRules";

const QUOTA_LABEL: Record<QuotaKind, string> = {
  devices: "devices",
  apiKeys: "API keys",
  automations: "automations",
  alertRules: "alert rules",
};

function countOwned(ownerId: string, kind: QuotaKind): Promise<number> {
  switch (kind) {
    case "devices":
      return prisma.device.count({ where: { ownerId } });
    case "apiKeys":
      return prisma.apiKey.count({ where: { ownerId, revoked: false } });
    case "automations":
      return prisma.automation.count({ where: { ownerId } });
    case "alertRules":
      return prisma.alertRule.count({ where: { device: { ownerId } } });
  }
}

/** Throws QuotaError if the owner already has as many `kind` as their plan allows. */
export async function assertQuota(ownerId: string, kind: QuotaKind): Promise<void> {
  const account = await getAccountPlan(ownerId);
  if (!account) return;
  const limit = limitsFor(account)[kind];
  if (!Number.isFinite(limit)) return;
  if ((await countOwned(ownerId, kind)) >= limit) {
    const planName = PLANS[effectivePlan(account)].name;
    throw new QuotaError(
      `Your ${planName} plan allows ${formatLimit(limit)} ${QUOTA_LABEL[kind]}. Delete one or upgrade at /pricing for more.`,
    );
  }
}

export type UsageSummary = {
  plan: Plan;
  isAdmin: boolean;
  limits: PlanLimits;
  used: { devices: number; apiKeys: number; automations: number; alertRules: number; today: number; thisMinute: number };
};

/** Current plan, limits and usage for the billing page. */
export async function getUsageSummary(ownerId: string): Promise<UsageSummary | null> {
  const account = await getAccountPlan(ownerId);
  if (!account) return null;
  const { minute, day } = buckets();
  const [devices, apiKeys, automations, alertRules, counters] = await Promise.all([
    countOwned(ownerId, "devices"),
    countOwned(ownerId, "apiKeys"),
    countOwned(ownerId, "automations"),
    countOwned(ownerId, "alertRules"),
    prisma.usageCounter.findMany({ where: { ownerId, bucket: { in: [minute, day] } } }),
  ]);
  const byBucket = Object.fromEntries(counters.map((c) => [c.bucket, c.count]));
  return {
    plan: effectivePlan(account),
    isAdmin: account.role === "ADMIN",
    limits: limitsFor(account),
    used: {
      devices,
      apiKeys,
      automations,
      alertRules,
      today: byBucket[day] ?? 0,
      thisMinute: byBucket[minute] ?? 0,
    },
  };
}

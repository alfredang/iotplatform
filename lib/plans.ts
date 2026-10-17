import type { Plan, Role } from "@prisma/client";

/**
 * Subscription tiers. The single source for limits and prices — the pricing
 * page, the billing page, quota checks and HitPay checkout all read this.
 * Admins are never limited (see limitsFor).
 */
export type PlanLimits = {
  devices: number;
  apiKeys: number;
  automations: number;
  alertRules: number;
  /** Device messages (telemetry + commands) per minute, per account. */
  perMinute: number;
  /** Device messages per day (UTC), per account. */
  perDay: number;
};

export type PlanInfo = {
  id: Plan;
  name: string;
  /** Monthly price in SGD; 0 = free. */
  priceSgd: number;
  tagline: string;
  limits: PlanLimits;
  highlight?: boolean;
};

const UNLIMITED = Number.POSITIVE_INFINITY;

export const PLANS: Record<Plan, PlanInfo> = {
  FREE: {
    id: "FREE",
    name: "Free",
    priceSgd: 0,
    tagline: "For learning, class projects and a sensor or two at home.",
    limits: { devices: 5, apiKeys: 2, automations: 3, alertRules: 5, perMinute: 60, perDay: 10_000 },
  },
  STARTER: {
    id: "STARTER",
    name: "Starter",
    priceSgd: 5,
    tagline: "For makers running a small fleet around the house or lab.",
    limits: { devices: 20, apiKeys: 5, automations: 10, alertRules: 25, perMinute: 300, perDay: 100_000 },
  },
  PRO: {
    id: "PRO",
    name: "Pro",
    priceSgd: 15,
    tagline: "For serious projects, pilots and classrooms.",
    limits: {
      devices: 100,
      apiKeys: 20,
      automations: UNLIMITED,
      alertRules: UNLIMITED,
      perMinute: 1_200,
      perDay: 1_000_000,
    },
    highlight: true,
  },
  BUSINESS: {
    id: "BUSINESS",
    name: "Business",
    priceSgd: 49,
    tagline: "For production deployments across sites.",
    limits: {
      devices: 500,
      apiKeys: 100,
      automations: UNLIMITED,
      alertRules: UNLIMITED,
      perMinute: 6_000,
      perDay: 10_000_000,
    },
  },
};

export const PLAN_ORDER: Plan[] = ["FREE", "STARTER", "PRO", "BUSINESS"];
export const PAID_PLANS: Plan[] = ["STARTER", "PRO", "BUSINESS"];

const ADMIN_LIMITS: PlanLimits = {
  devices: UNLIMITED,
  apiKeys: UNLIMITED,
  automations: UNLIMITED,
  alertRules: UNLIMITED,
  perMinute: UNLIMITED,
  perDay: UNLIMITED,
};

type PlanHolder = { role: Role; plan: Plan; planExpiresAt: Date | null };

/** The plan in force now: a paid plan past its expiry falls back to Free. */
export function effectivePlan(user: Pick<PlanHolder, "plan" | "planExpiresAt">): Plan {
  if (user.plan === "FREE") return "FREE";
  if (user.planExpiresAt && user.planExpiresAt.getTime() < Date.now()) return "FREE";
  return user.plan;
}

export function limitsFor(user: PlanHolder): PlanLimits {
  if (user.role === "ADMIN") return ADMIN_LIMITS;
  return PLANS[effectivePlan(user)].limits;
}

export function formatLimit(n: number): string {
  return Number.isFinite(n) ? n.toLocaleString("en-SG") : "Unlimited";
}

/** Thrown when an account is over its message rate; maps to HTTP 429. */
export class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfterSeconds: number,
  ) {
    super(message);
  }
}

/** Thrown when creating something would exceed the plan's quota; maps to 403. */
export class QuotaError extends Error {}

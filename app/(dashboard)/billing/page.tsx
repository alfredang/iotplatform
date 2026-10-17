"use client";

import { Suspense, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Plan } from "@prisma/client";
import { apiFetch, fetcher } from "@/lib/client";
import { PLANS, PAID_PLANS, PLAN_ORDER, formatLimit } from "@/lib/plans";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader, Spinner } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

type Limits = Record<"devices" | "apiKeys" | "automations" | "alertRules" | "perMinute" | "perDay", number | null>;

type Billing = {
  plan: Plan;
  isAdmin: boolean;
  limits: Limits;
  used: { devices: number; apiKeys: number; automations: number; alertRules: number; today: number; thisMinute: number };
  planExpiresAt: string | null;
  subscriptionStatus: string | null;
  hasSubscription: boolean;
  checkoutAvailable: boolean;
};

function Meter({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted">
          {used.toLocaleString("en-SG")} / {limit === null ? "Unlimited" : limit.toLocaleString("en-SG")}
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
        <div
          className={cn("h-full rounded-full", pct >= 90 ? "bg-danger" : pct >= 70 ? "bg-warning" : "bg-primary")}
          style={{ width: `${limit === null ? 0 : pct}%` }}
        />
      </div>
    </div>
  );
}

function BillingInner() {
  const params = useSearchParams();
  const wanted = params.get("plan");
  const returned = params.get("checkout") === "done";
  const { data, isLoading, mutate } = useSWR<Billing>("/api/billing", fetcher, { refreshInterval: 15000 });
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function upgrade(plan: Plan) {
    setError("");
    setBusy(plan);
    try {
      const { url } = await apiFetch<{ url: string }>("/api/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ plan }),
      });
      window.location.assign(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout");
      setBusy(null);
    }
  }

  async function cancel() {
    if (!confirm("Stop renewing? You keep your plan until the end of the period you paid for.")) return;
    setError("");
    setBusy("cancel");
    try {
      await apiFetch("/api/billing/cancel", { method: "POST" });
      await mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not cancel");
    } finally {
      setBusy(null);
    }
  }

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  const current = PLANS[data.plan];
  const renewing = data.hasSubscription && ["active", "scheduled"].includes(data.subscriptionStatus ?? "");

  return (
    <div className="space-y-6">
      {returned && (
        <p className="rounded-lg bg-success/15 p-3 text-sm text-success">
          Thanks! Your plan updates as soon as HitPay confirms the first payment — usually within a minute.
        </p>
      )}
      {error && <p className="rounded-lg bg-danger/15 p-3 text-sm text-danger">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Current plan</CardTitle>
        </CardHeader>
        <CardBody className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-2xl font-semibold">{data.isAdmin ? "Admin" : current.name}</span>
            {data.isAdmin ? (
              <Badge tone="info">Unlimited</Badge>
            ) : (
              <Badge tone="muted">{current.priceSgd ? `S$${current.priceSgd} / month` : "Free"}</Badge>
            )}
            {renewing && <Badge tone="success">Renews monthly</Badge>}
            {data.subscriptionStatus === "canceled" && data.planExpiresAt && (
              <Badge tone="warning">Ends {new Date(data.planExpiresAt).toLocaleDateString()}</Badge>
            )}
            {data.subscriptionStatus === "pending" && <Badge tone="warning">Awaiting payment</Badge>}
          </div>
          {!data.isAdmin && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Meter label="Messages today" used={data.used.today} limit={data.limits.perDay} />
              <Meter label="Messages this minute" used={data.used.thisMinute} limit={data.limits.perMinute} />
              <Meter label="Devices" used={data.used.devices} limit={data.limits.devices} />
              <Meter label="API keys" used={data.used.apiKeys} limit={data.limits.apiKeys} />
              <Meter label="Alert rules" used={data.used.alertRules} limit={data.limits.alertRules} />
              <Meter label="Automations" used={data.used.automations} limit={data.limits.automations} />
            </div>
          )}
          {renewing && (
            <Button variant="outline" size="sm" onClick={cancel} disabled={busy !== null}>
              {busy === "cancel" && <Spinner />} Cancel subscription
            </Button>
          )}
        </CardBody>
      </Card>

      {!data.isAdmin && (
        <div className="grid gap-4 md:grid-cols-3">
          {PAID_PLANS.map((id) => {
            const p = PLANS[id];
            const isCurrent = id === data.plan;
            const isLower = PLAN_ORDER.indexOf(id) < PLAN_ORDER.indexOf(data.plan);
            return (
              <Card key={id} className={cn(wanted === id && "border-primary shadow-lg shadow-primary/10")}>
                <CardBody className="flex h-full flex-col pt-5">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-lg font-semibold">{p.name}</h3>
                    <span className="text-lg font-semibold">
                      S${p.priceSgd}
                      <span className="text-sm font-normal text-muted">/mo</span>
                    </span>
                  </div>
                  <ul className="mt-3 flex-1 space-y-1 text-sm text-muted">
                    <li>{formatLimit(p.limits.devices)} devices</li>
                    <li>{formatLimit(p.limits.perMinute)} messages / minute</li>
                    <li>{formatLimit(p.limits.perDay)} messages / day</li>
                    <li>{formatLimit(p.limits.apiKeys)} API keys</li>
                    <li>
                      {formatLimit(p.limits.alertRules)} alert rules · {formatLimit(p.limits.automations)} automations
                    </li>
                  </ul>
                  {isCurrent ? (
                    <Button className="mt-4 w-full" variant="outline" disabled>
                      Current plan
                    </Button>
                  ) : !data.checkoutAvailable ? (
                    <a
                      href={`mailto:enquiry@tertiaryinfotech.com?subject=${encodeURIComponent(`Upgrade to IoTFlow ${p.name}`)}`}
                      className="mt-4"
                    >
                      <Button className="w-full" variant="outline">
                        Contact us to upgrade
                      </Button>
                    </a>
                  ) : (
                    <Button
                      className="mt-4 w-full"
                      variant={wanted === id || p.highlight ? "primary" : "outline"}
                      disabled={busy !== null || renewing}
                      onClick={() => upgrade(id)}
                    >
                      {busy === id && <Spinner />} {isLower ? `Switch to ${p.name}` : `Upgrade to ${p.name}`}
                    </Button>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
      {!data.isAdmin && renewing && (
        <p className="text-sm text-muted">To change plans, cancel your current subscription first, then choose a new plan.</p>
      )}
      <p className="text-sm text-muted">
        Compare everything on the <Link href="/pricing" className="text-primary hover:underline">pricing page</Link>. Prices
        in SGD, billed monthly via HitPay.
      </p>
    </div>
  );
}

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Plan & billing" description="Your plan, usage and subscription." />
      <Suspense>
        <BillingInner />
      </Suspense>
    </div>
  );
}

import Link from "next/link";
import { Check } from "lucide-react";
import { PLANS, PLAN_ORDER, formatLimit } from "@/lib/plans";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FEATURES_ALL = [
  "Dashboards, charts, gauges & maps",
  "Two-way device control",
  "MQTT & HTTP, Arduino & Python SDKs",
  "iOS & Android apps",
];

/** Plan cards for the public pricing page and the landing page. */
export function PricingTable() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {PLAN_ORDER.map((id) => {
        const p = PLANS[id];
        const l = p.limits;
        const rows = [
          `${formatLimit(l.devices)} devices`,
          `${formatLimit(l.perMinute)} messages / minute`,
          `${formatLimit(l.perDay)} messages / day`,
          `${formatLimit(l.apiKeys)} API keys`,
          `${formatLimit(l.alertRules)} alert rules`,
          `${formatLimit(l.automations)} n8n automations`,
        ];
        return (
          <div
            key={id}
            className={cn(
              "relative flex flex-col rounded-card border bg-surface p-6",
              p.highlight ? "border-primary shadow-lg shadow-primary/10" : "border-border",
            )}
          >
            {p.highlight && (
              <span className="absolute -top-3 left-6 rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
                Most popular
              </span>
            )}
            <h3 className="text-lg font-semibold">{p.name}</h3>
            <p className="mt-1 min-h-10 text-sm text-muted">{p.tagline}</p>
            <p className="mt-4">
              <span className="text-4xl font-bold">S${p.priceSgd}</span>
              <span className="text-sm text-muted"> / month</span>
            </p>
            <ul className="mt-5 flex-1 space-y-2 text-sm">
              {rows.map((r) => (
                <li key={r} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
            <Link
              href={id === "FREE" ? "/register" : `/billing?plan=${id}`}
              className={buttonClass({
                variant: p.highlight ? "primary" : "outline",
                className: "mt-6 w-full",
              })}
            >
              {id === "FREE" ? "Start free" : `Choose ${p.name}`}
            </Link>
          </div>
        );
      })}
    </div>
  );
}

export function PricingIncluded() {
  return (
    <p className="mt-6 text-center text-sm text-muted">
      Every plan includes: {FEATURES_ALL.join(" · ")}. Prices in SGD, billed monthly via HitPay —
      cancel anytime.
    </p>
  );
}

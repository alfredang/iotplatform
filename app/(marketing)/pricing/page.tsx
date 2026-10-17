import { SiteHeader } from "@/components/marketing/site-header";
import { PricingIncluded, PricingTable } from "@/components/marketing/pricing-table";

export const metadata = {
  title: "Pricing — IoTFlow",
  description:
    "Start free with 5 devices, then upgrade to Starter, Pro or Business for more devices and higher message limits. Prices in SGD, billed monthly.",
};

const FAQ = [
  {
    q: "Is there really a free plan?",
    a: "Yes — sign up with just your email and you get 5 devices, 10,000 messages a day, API keys, alerts and automations. No credit card.",
  },
  {
    q: "What counts as a message?",
    a: "Each telemetry upload a device sends (over MQTT or HTTP, with a device token or an API key) and each command sent to a device. A single upload can carry several readings — it still counts as one message.",
  },
  {
    q: "What happens if I hit a limit?",
    a: "Extra messages are refused with HTTP 429 (MQTT messages are dropped) until the next minute, or the next day for the daily limit — nothing already stored is touched. Device, API-key, alert and automation limits only stop you creating more.",
  },
  {
    q: "How do I pay, and can I cancel?",
    a: "Paid plans are billed monthly in SGD through HitPay (cards and other local methods). Cancel anytime from Plan & billing; you keep the plan until the end of the period you paid for.",
  },
  {
    q: "Can I self-host instead?",
    a: "Yes. IoTFlow is free to self-host with Docker or Coolify, with no quotas — these plans are for our hosted service at iot.tertiaryinfotech.com.",
  },
];

export default function PricingPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Simple, fair pricing</h1>
          <p className="mt-4 text-lg text-muted">
            Start free and build your IoT project today. Upgrade only when you need more devices or
            higher message rates.
          </p>
        </div>

        <div className="mt-12">
          <PricingTable />
          <PricingIncluded />
        </div>

        <div className="mx-auto mt-16 max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight">Questions</h2>
          <dl className="mt-6 divide-y divide-border">
            {FAQ.map((f) => (
              <div key={f.q} className="py-4">
                <dt className="font-medium">{f.q}</dt>
                <dd className="mt-1 text-sm text-muted">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </main>
      <footer className="border-t border-border bg-surface/50">
        <p className="mx-auto max-w-5xl px-4 py-6 text-center text-xs text-muted sm:px-6">
          © {new Date().getFullYear()} Tertiary Infotech Academy Pte Ltd. All rights reserved. · UEN 201200696W
          {" · "}Powered by{" "}
          <a href="https://www.tertiaryinfotech.com/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
            Tertiary Infotech Academy Pte Ltd
          </a>
        </p>
      </footer>
    </>
  );
}

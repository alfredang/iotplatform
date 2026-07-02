import Link from "next/link";
import {
  Rocket, Cpu, LayoutDashboard, SlidersHorizontal, Workflow,
  CheckCircle2, ArrowRight, type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Getting started · IoTFlow" };

type Tutorial = {
  icon: LucideIcon;
  title: string;
  time: string;
  intro: string;
  steps: string[];
  cta: { label: string; href: string };
};

const TUTORIALS: Tutorial[] = [
  {
    icon: Cpu,
    title: "1 · Add your first device",
    time: "2 min",
    intro: "Register a device and get the token it uses to talk to the platform.",
    steps: [
      "Pick (or create) a Project from the sidebar switcher.",
      "Go to Add Device and give it a name (e.g. “Living Room Sensor”).",
      "Choose HTTP (simplest) or MQTT, then create the device.",
      "Copy the device token (dev_…) — it is shown only once.",
    ],
    cta: { label: "Add a device", href: "/devices/new" },
  },
  {
    icon: Rocket,
    title: "2 · Send your first reading",
    time: "5 min",
    intro: "Push a sensor value from an ESP32, Arduino or Raspberry Pi and see it live.",
    steps: [
      "Open the Integrate guide and copy a quickstart snippet (cURL, Python or ESP32).",
      "Paste your device token and device id into the snippet.",
      "Run it on your board / Pi (or the cURL line from any terminal).",
      "Open the Dashboard — your reading appears under Latest Telemetry within seconds.",
    ],
    cta: { label: "Open the integration guide", href: "/integrate" },
  },
  {
    icon: LayoutDashboard,
    title: "3 · Build a dashboard",
    time: "3 min",
    intro: "Turn raw readings into number cards, gauges and charts.",
    steps: [
      "On the Dashboard, click Add widget.",
      "Choose a display type (Number, Gauge, Line chart, LED or Map).",
      "Pick your device and the metric to show (e.g. temperature).",
      "Add a few more widgets — the dashboard auto-refreshes every 5 seconds.",
    ],
    cta: { label: "Go to the dashboard", href: "/dashboard" },
  },
  {
    icon: SlidersHorizontal,
    title: "4 · Control a device (two-way)",
    time: "5 min",
    intro: "Flip a relay or LED from the dashboard using Blynk-style virtual pins.",
    steps: [
      "On the Dashboard, Add widget → choose a Control type (Switch, Button or Slider).",
      "Pick the device and a virtual pin name (e.g. V1 or relay).",
      "On the device, subscribe to devices/<id>/down (MQTT) or poll /api/device/state (HTTP) — the Integrate guide shows how.",
      "Toggle the widget — the command is delivered to your device instantly.",
    ],
    cta: { label: "See control examples", href: "/integrate" },
  },
  {
    icon: Workflow,
    title: "5 · Automate with n8n",
    time: "8 min",
    intro: "Run no-code logic when a device event happens — notify, control or log.",
    steps: [
      "In n8n, create a workflow with a Webhook node and copy its Production URL.",
      "Here, go to Automations → New automation.",
      "Choose the event (e.g. Telemetry received, metric temperature) and paste the webhook URL.",
      "Click Test to fire the flow, then let real device events trigger it automatically.",
    ],
    cta: { label: "Create an automation", href: "/automations" },
  },
];

export default function GettingStartedPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Getting started"
        description="Five short tutorials to go from zero to a live, automated IoT dashboard."
      />

      <div className="space-y-5">
        {TUTORIALS.map((t) => (
          <Card key={t.title}>
            <CardBody className="pt-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <t.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">{t.title}</h2>
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">~{t.time}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted">{t.intro}</p>

                  <ol className="mt-4 space-y-2">
                    {t.steps.map((s, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary/70" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ol>

                  <div className="mt-4">
                    <Link href={t.cta.href}>
                      <Button size="sm">
                        {t.cta.label} <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardBody className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-sm text-muted">
            That&apos;s the whole loop: connect → visualise → control → automate.
          </p>
          <Link href="/devices/new">
            <Button>Add your first device</Button>
          </Link>
        </CardBody>
      </Card>
    </div>
  );
}

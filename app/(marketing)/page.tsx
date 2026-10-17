// deploy test: verifying auto-deploy on push (harmless comment, renders nothing)
// deploy test #2: confirming GitHub webhook -> Coolify auto-deploy
import Link from "next/link";
import {
  KeyRound,
  UserPlus,
  Activity,
  ArrowRight,
  Bell,
  Cable,
  ChartSpline,
  Gauge,
  MessageSquare,
  MapPin,
  Radio,
  Server,
  ShieldCheck,
  Cpu,
  Workflow,
  SlidersHorizontal,
  Smartphone,
  Sprout,
  Factory,
  Home,
  Zap,
  HeartPulse,
  Building2,
  Truck,
  Droplets,
  Store,
  Phone,
  Mail,
  MessageCircle,
  UploadCloud,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { DashboardPreview } from "@/components/marketing/dashboard-preview";
import { EnquiryForm } from "@/components/marketing/enquiry-form";
import { WhatsAppButton } from "@/components/marketing/whatsapp-button";
import { AppStoreBadge } from "@/components/marketing/app-store-badge";
import { GithubIcon, LinkedinIcon } from "@/components/marketing/brand-icons";
import { SiteHeader } from "@/components/marketing/site-header";
import { PricingIncluded, PricingTable } from "@/components/marketing/pricing-table";
import { prisma } from "@/lib/db/prisma";
import { postCardSelect } from "@/lib/blog";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "IoTFlow — Low-code IoT platform powered by n8n",
  description:
    "Connect Arduino, ESP32 & Raspberry Pi over MQTT/HTTP, control them in real time from web & mobile, and automate everything visually with n8n. Free & self-hosted.",
};

const FEATURES = [
  { icon: Cable, title: "Connect any device", desc: "Guided wizard with copy-paste code for ESP32, Arduino, Raspberry Pi, C++ & Python over MQTT or HTTP." },
  { icon: SlidersHorizontal, title: "Two-way control", desc: "Buttons, switches & sliders write to virtual pins — control relays, motors & LEDs live, Blynk-style." },
  { icon: Workflow, title: "Low-code automations with n8n", desc: "Drag-and-drop flows react to device events — notify, control, log, or call AI with zero code." },
  { icon: Activity, title: "Real-time dashboard", desc: "Live telemetry with auto-refresh, number cards, charts, gauges, LED indicators & maps." },
  { icon: Radio, title: "MQTT & HTTP built in", desc: "A managed MQTT broker and a simple REST endpoint. Uplink telemetry and downlink commands." },
  { icon: Bell, title: "Alerts & rules", desc: "Trigger on thresholds or device-offline, then hand off to an n8n flow for any action you can imagine." },
  { icon: Smartphone, title: "Web & mobile app", desc: "Installable PWA — add IoTFlow to your phone's home screen and control devices on the go." },
  { icon: Server, title: "Self-hosted & open", desc: "Docker & Coolify-ready. Own your data and your automation engine, deploy anywhere in minutes." },
];

const INDUSTRIES = [
  { icon: Sprout, title: "Smart Agriculture", desc: "Soil moisture, greenhouse climate & irrigation valves — auto-water crops when soil dries out." },
  { icon: Factory, title: "Industrial IoT", desc: "Monitor motor vibration, temperature & pressure; trip a relay or raise a ticket on anomalies." },
  { icon: Home, title: "Smart Home", desc: "Lights, locks, thermostats & sensors controlled from your phone and automated by n8n routines." },
  { icon: Zap, title: "Energy & Utilities", desc: "Meter voltage, current & solar output; shed load and alert on faults automatically." },
  { icon: HeartPulse, title: "Healthcare & Cold Chain", desc: "Vaccine fridge & ward monitoring with instant escalation to staff via SMS, email or Slack." },
  { icon: Building2, title: "Smart Buildings", desc: "HVAC, occupancy & air quality across floors, tuned by schedules and comfort rules." },
  { icon: Truck, title: "Logistics & Fleet", desc: "GPS + temperature on trucks and containers; geofence alerts and route logging." },
  { icon: Droplets, title: "Water Management", desc: "Tank levels, pump control & leak detection — start/stop pumps on level thresholds." },
  { icon: Store, title: "Retail & Vending", desc: "Fridge temps, footfall & stock sensors feeding dashboards and restock automations." },
];

const USE_CASES = [
  { title: "Environmental monitoring", desc: "Temperature, humidity and air quality across rooms, warehouses or farms." },
  { title: "Cold chain & logistics", desc: "Track cold rooms and fleet sensors with offline + threshold alerts." },
  { title: "Industrial & energy", desc: "Monitor voltage, current and pressure on pumps, machines and panels." },
  { title: "Smart buildings", desc: "Bring building sensors into one clean dashboard your whole team can use." },
];

const STEPS = [
  { icon: Cpu, title: "1 · Connect", desc: "Flash the wizard snippet to your ESP32/Arduino/Pi. It streams data over MQTT or HTTP." },
  { icon: Gauge, title: "2 · Visualise & control", desc: "Compose a dashboard of charts, gauges, buttons & sliders — on web and mobile." },
  { icon: Workflow, title: "3 · Automate with n8n", desc: "Device events fire n8n flows that notify, control devices back, log data or call AI." },
];

const TUTORIALS = [
  {
    slug: "create-your-account",
    icon: UserPlus,
    title: "Create your free account",
    time: "2 min",
    steps: [
      "Sign up with your name and email.",
      "Get your password by email.",
      "Sign in with a code, password or Google.",
      "Set your own password — you're in.",
    ],
  },
  {
    slug: "add-your-first-device",
    icon: Cpu,
    title: "Add your first device",
    time: "2 min",
    steps: [
      "Pick (or create) a project.",
      "Open Add Device and name it.",
      "Choose HTTP or MQTT and create it.",
      "Copy the device token (shown once).",
    ],
  },
  {
    slug: "send-your-first-reading",
    icon: Radio,
    title: "Send your first reading",
    time: "5 min",
    steps: [
      "Copy a quickstart snippet (cURL, Python or ESP32).",
      "Paste your token + device id.",
      "Run it on your board or Pi.",
      "See it live on the dashboard.",
    ],
  },
  {
    slug: "build-a-dashboard",
    icon: Gauge,
    title: "Build a dashboard",
    time: "3 min",
    steps: [
      "Click Add widget on the dashboard.",
      "Pick Number, Gauge, Line, LED or Map.",
      "Bind it to a device + metric.",
      "Add more — it auto-refreshes.",
    ],
  },
  {
    slug: "control-a-device",
    icon: SlidersHorizontal,
    title: "Control a device",
    time: "5 min",
    steps: [
      "Add a Switch, Button or Slider widget.",
      "Choose a virtual pin (e.g. V1, relay).",
      "Have the device read devices/<id>/down.",
      "Toggle it — the command arrives instantly.",
    ],
  },
  {
    slug: "automate-with-n8n",
    icon: Workflow,
    title: "Automate with n8n",
    time: "8 min",
    steps: [
      "Add a Webhook node in n8n; copy its URL.",
      "Create an Automation for an event.",
      "Paste the webhook URL and save.",
      "Test it, then let devices trigger it.",
    ],
  },
  {
    slug: "esp8266-telemetry-upload",
    icon: UploadCloud,
    title: "Upload telemetry every 10 s",
    time: "10 min",
    steps: [
      "Create an MQTT device; copy id + token.",
      "ESP8266: flash the Telemetry_Upload sketch.",
      "Or Python: pip install \"iotflow[mqtt]\".",
      "Publish every 10 s; watch it live.",
    ],
  },
  {
    slug: "api-keys-and-alerts",
    icon: KeyRound,
    title: "API keys & alerts",
    time: "6 min",
    steps: [
      "Create an API key (iot_…) — copy it once.",
      "Send data for any device with it.",
      "Create an alert rule, e.g. temp > 30.",
      "Trigger it, then resolve it.",
    ],
  },
];

export default async function LandingPage() {
  const latestPosts = await prisma.blogPost
    .findMany({
      where: { published: true },
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
      take: 3,
      select: postCardSelect,
    })
    .catch(() => []);

  return (
    <>
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[-10%] h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute right-[10%] top-[20%] h-[280px] w-[280px] rounded-full bg-accent/20 blur-[120px]" />
        </div>
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:py-12">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Powered by n8n · Self-hosted · Open
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              The low-code IoT platform{" "}
              <span className="text-primary">powered by n8n</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted">
              Connect Arduino, ESP32 &amp; Raspberry Pi over MQTT or HTTP, control them
              in real time from web and mobile, and automate everything with
              drag-and-drop n8n flows — no heavy code required.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register">
                <Button size="lg">
                  Get started free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#preview">
                <Button size="lg" variant="outline">See the dashboard</Button>
              </a>
            </div>
          </div>
          <div className="lg:pl-6">
            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="border-y border-border bg-surface/50">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="grid gap-8 text-center sm:grid-cols-4">
            <div>
              <p className="text-3xl font-bold text-primary">5 min</p>
              <p className="mt-1 text-sm text-muted">From sign-up to first telemetry</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">MQTT + HTTP</p>
              <p className="mt-1 text-sm text-muted">Uplink data &amp; downlink control</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">400+ apps</p>
              <p className="mt-1 text-sm text-muted">n8n integrations for automations</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">100% yours</p>
              <p className="mt-1 text-sm text-muted">Self-hosted, no vendor lock-in</p>
            </div>
          </div>
        </div>
      </section>

      {/* The perfect IoT stack — 3 pillars */}
      <section id="stack" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">The perfect IoT stack</h2>
          <p className="mt-3 text-muted">
            Three parts, each doing what it does best — together, a complete low-code IoT solution.
          </p>
        </div>

        <div className="mt-12 grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
          {/* Pillar 1 */}
          <div className="rounded-card border border-border bg-surface p-6 text-center">
            <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Cpu className="h-6 w-6" />
            </span>
            <h3 className="mt-4 font-semibold">IoT Platform</h3>
            <p className="mt-1 text-sm font-medium text-primary">Connection &amp; Sensing</p>
            <p className="mt-2 text-sm text-muted">Connect Arduino/ESP/Pi over MQTT &amp; HTTP; capture and store telemetry reliably.</p>
          </div>

          <div className="flex items-center justify-center lg:px-1">
            <ArrowRight className="h-6 w-6 rotate-90 text-muted lg:rotate-0" />
          </div>

          {/* Pillar 2 */}
          <div className="rounded-card border border-primary/40 bg-primary/5 p-6 text-center shadow-lg shadow-primary/5">
            <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Workflow className="h-6 w-6" />
            </span>
            <h3 className="mt-4 font-semibold">n8n</h3>
            <p className="mt-1 text-sm font-medium text-primary">Actions &amp; Alerts</p>
            <p className="mt-2 text-sm text-muted">Triggers → actions: notify, escalate, log, call AI and control devices back — no code.</p>
          </div>

          <div className="flex items-center justify-center lg:px-1">
            <ArrowRight className="h-6 w-6 rotate-90 text-muted lg:rotate-0" />
          </div>

          {/* Pillar 3 */}
          <div className="rounded-card border border-border bg-surface p-6 text-center">
            <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Smartphone className="h-6 w-6" />
            </span>
            <h3 className="mt-4 font-semibold">Mobile Apps</h3>
            <p className="mt-1 text-sm font-medium text-accent">Dashboard &amp; Control</p>
            <p className="mt-2 text-sm text-muted">Live dashboards, two-way control and push alerts on iOS &amp; Android — from anywhere.</p>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-muted">
          <span className="font-semibold text-foreground">Sense → Automate → Control.</span>{" "}
          The platform senses, n8n decides and acts, and the apps keep you in control.
        </p>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need, nothing you don&apos;t
          </h2>
          <p className="mt-3 text-muted">
            A focused feature set designed for makers, teams and beginners.
          </p>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-card border border-border bg-surface p-5 transition hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-border bg-surface/50">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              From sensor to automation in three steps
            </h2>
            <p className="mt-3 text-muted">
              Devices talk to the platform over MQTT/HTTP. The platform streams to your
              dashboard and forwards every event to n8n, where you build the logic.
            </p>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.title} className="rounded-card border border-border bg-background p-6">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <s.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-sm text-muted">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mx-auto mt-10 max-w-4xl overflow-x-auto">
            <div className="flex min-w-max items-center justify-center gap-3 rounded-card border border-dashed border-border bg-background/60 p-5 text-sm text-muted">
              <span className="rounded-lg bg-surface-2 px-3 py-1.5 font-medium text-foreground">Arduino / ESP32 / Pi</span>
              <ArrowRight className="h-4 w-4 text-primary" />
              <span className="rounded-lg bg-surface-2 px-3 py-1.5 font-medium text-foreground">MQTT / HTTP</span>
              <ArrowRight className="h-4 w-4 text-primary" />
              <span className="rounded-lg bg-surface-2 px-3 py-1.5 font-medium text-foreground">IoTFlow dashboard</span>
              <ArrowRight className="h-4 w-4 text-primary" />
              <span className="rounded-lg bg-primary/10 px-3 py-1.5 font-medium text-primary">n8n flows → any action</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tutorials */}
      <section id="tutorials" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Get started in 8 short tutorials
          </h2>
          <p className="mt-3 text-muted">
            From zero to a live, automated IoT dashboard — no heavy code required.
          </p>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TUTORIALS.map((t, i) => (
            <Link
              key={t.slug}
              href={`/tutorials/${t.slug}`}
              className="group flex flex-col rounded-card border border-border bg-surface p-6 transition hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <t.icon className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">~{t.time}</span>
              </div>
              <h3 className="mt-4 font-semibold">
                <span className="text-primary">{i + 1}.</span> {t.title}
              </h3>
              <ol className="mt-3 space-y-1.5">
                {t.steps.map((s, j) => (
                  <li key={j} className="flex gap-2 text-sm text-muted">
                    <span className="text-primary/70">{j + 1}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                Read the full guide <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
          <div className="flex flex-col items-start justify-center rounded-card border border-dashed border-border bg-surface/50 p-6">
            <h3 className="font-semibold">Ready to try?</h3>
            <p className="mt-1 text-sm text-muted">Browse all tutorials or create a free account and follow along.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/tutorials"><Button variant="outline">All tutorials</Button></Link>
              <Link href="/register"><Button>Get started free <ArrowRight className="h-4 w-4" /></Button></Link>
            </div>
          </div>
        </div>
      </section>

      {/* Industries */}
      <section id="industries" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Built for every industry
          </h2>
          <p className="mt-3 text-muted">
            One platform, endless applications — connect, control and automate across sectors.
          </p>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {INDUSTRIES.map((ind) => (
            <div
              key={ind.title}
              className="rounded-card border border-border bg-surface p-6 transition hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <ind.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold">{ind.title}</h3>
              <p className="mt-1.5 text-sm text-muted">{ind.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Dashboard preview */}
      <section id="preview" className="border-y border-border bg-surface/50">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:py-12">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              A clean dashboard your whole team will get
            </h2>
            <p className="mt-4 text-muted">
              See total, online and offline devices at a glance. Watch live
              telemetry stream in, review recent activity and act on alerts —
              all from one fast, mobile-friendly interface with a built-in dark
              theme.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Auto-refreshing real-time data",
                "Number cards, charts, gauges & maps",
                "Per-device telemetry history",
                "Active alerts with one-click resolve",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-primary" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <DashboardPreview />
        </div>
      </section>

      {/* Use cases */}
      <section id="use-cases" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Built for real use cases</h2>
          <p className="mt-3 text-muted">From a single sensor to a whole fleet.</p>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {USE_CASES.map((u) => (
            <div key={u.title} className="rounded-card border border-border bg-surface p-6">
              <h3 className="font-semibold">{u.title}</h3>
              <p className="mt-2 text-sm text-muted">{u.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Latest from the blog */}
      {latestPosts.length > 0 && (
        <section className="border-y border-border bg-surface/50">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">From the blog</h2>
                <p className="mt-3 text-muted">Hands-on IoT projects and n8n workflow automations.</p>
              </div>
              <Link href="/blog" className="hidden shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex">
                View all posts <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {latestPosts.map((p) => (
                <Link
                  key={p.id}
                  href={`/blog/${p.slug}`}
                  className="group flex flex-col overflow-hidden rounded-card border border-border bg-surface transition hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
                >
                  {p.coverImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.coverImage} alt={p.title} className="h-40 w-full border-b border-border bg-white object-cover" />
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-center gap-2 text-xs text-muted">
                      {p.category && <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">{p.category.name}</span>}
                      <span>{new Date(p.publishedAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="mt-2 font-semibold leading-snug group-hover:text-primary">{p.title}</h3>
                    <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted">{p.excerpt}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
                      Read more <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-8 text-center sm:hidden">
              <Link href="/blog"><Button variant="outline">View all posts</Button></Link>
            </div>
          </div>
        </section>
      )}

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Start free, upgrade when you grow</h2>
          <p className="mt-3 text-muted">
            Every account gets the full platform. Paid plans add devices and higher message limits.
          </p>
        </div>
        <div className="mt-10">
          <PricingTable />
          <PricingIncluded />
        </div>
      </section>

      {/* Community / free */}
      <section className="border-y border-border bg-gradient-to-br from-primary/10 via-surface to-accent/10">
        <div className="mx-auto max-w-4xl px-4 py-8 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Free &amp; open for the community
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted">
            IoTFlow is free to self-host — deploy with Docker or Coolify, own your
            data, and adapt it to your needs, with no quotas. Prefer not to run
            servers? Use our hosted cloud and start on the free plan.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register">
              <Button size="lg">Create your free account</Button>
            </Link>
            <a href="#contact">
              <Button size="lg" variant="outline">
                <MessageSquare className="h-4 w-4" /> Talk to us
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Enquiry */}
      <section id="contact" className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Get in touch</h2>
          <p className="mt-3 text-muted">
            Questions, ideas or want help getting started? Send us a note.
          </p>
        </div>
        <EnquiryForm />
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface/50">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)_minmax(0,1fr)_auto_12rem]">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <Logo href="/" size="sm" />
            <p className="mt-4 text-sm text-muted">
              A low-code, self-hosted IoT platform powered by n8n — connect,
              control and automate devices over MQTT &amp; HTTP.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a
                href="https://github.com/alfredang"
                target="_blank" rel="noopener noreferrer"
                aria-label="GitHub"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-muted transition hover:text-foreground"
              >
                <GithubIcon className="h-4.5 w-4.5" />
              </a>
              <a
                href="https://www.linkedin.com/in/angchewhoe/"
                target="_blank" rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-muted transition hover:text-[#0a66c2]"
              >
                <LinkedinIcon className="h-4.5 w-4.5" />
              </a>
            </div>
          </div>

          {/* About */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">About</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted">
              <li><a href="#features" className="hover:text-foreground">Features</a></li>
              <li><a href="#how" className="hover:text-foreground">How it works</a></li>
              <li><a href="#industries" className="hover:text-foreground">Industries</a></li>
              <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
              <li>
                <a href="https://www.tertiaryinfotech.com/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
                  Tertiary Infotech
                </a>
              </li>
            </ul>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Links</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted">
              <li><Link href="/login" className="hover:text-foreground">Log in</Link></li>
              <li><Link href="/register" className="hover:text-foreground">Sign up</Link></li>
              <li><Link href="/tutorials" className="hover:text-foreground">Tutorials</Link></li>
              <li><Link href="/pricing" className="hover:text-foreground">Pricing</Link></li>
              <li><Link href="/privacy" className="hover:text-foreground">Privacy</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-2 lg:col-span-1">
            <h3 className="text-sm font-semibold text-foreground">Contact</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span><span className="whitespace-nowrap">12 Woodlands Square #07-85/86/87</span><br /><span className="whitespace-nowrap">Woods Square Tower 1, Singapore 737715</span></span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <a href="tel:+6561000613" className="hover:text-foreground">+65 6100 0613</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <a href="mailto:enquiry@tertiaryinfotech.com" className="hover:text-foreground">enquiry@tertiaryinfotech.com</a>
              </li>
              <li className="flex items-center gap-2.5">
                <MessageCircle className="h-4 w-4 shrink-0 text-primary" />
                <a href="https://wa.me/6588666375" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
                  WhatsApp +65 8866 6375
                </a>
              </li>
            </ul>
          </div>

          {/* Get the app */}
          <div className="col-span-2 lg:col-span-1">
            <h3 className="text-sm font-semibold text-foreground">Get the app</h3>
            <p className="mt-4 text-sm text-muted">Monitor &amp; control your devices on the go.</p>
            <AppStoreBadge className="mt-3" />
          </div>
        </div>

        <div className="border-t border-border">
          <p className="mx-auto max-w-6xl px-4 py-5 text-center text-xs text-muted sm:px-6">
            © {new Date().getFullYear()} Tertiary Infotech Academy Pte Ltd. All rights reserved. · UEN 201200696W
            {" · "}Powered by{" "}
            <a href="https://www.tertiaryinfotech.com/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
              Tertiary Infotech Academy Pte Ltd
            </a>
          </p>
        </div>
      </footer>

      <WhatsAppButton />
    </>
  );
}

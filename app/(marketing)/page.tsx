// deploy test: verifying auto-deploy on push (harmless comment, renders nothing)
// deploy test #2: confirming GitHub webhook -> Coolify auto-deploy
import Link from "next/link";
import {
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
} from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { DashboardPreview } from "@/components/marketing/dashboard-preview";
import { EnquiryForm } from "@/components/marketing/enquiry-form";
import { WhatsAppButton } from "@/components/marketing/whatsapp-button";

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

function NavBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo href="/" />
        <nav className="hidden items-center gap-7 text-sm text-muted md:flex">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#how" className="hover:text-foreground">How it works</a>
          <a href="#industries" className="hover:text-foreground">Industries</a>
          <a href="#preview" className="hover:text-foreground">Dashboard</a>
          <a href="#contact" className="hover:text-foreground">Contact</a>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login" className="hidden sm:block">
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Sign up</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function LandingPage() {
  return (
    <>
      <NavBar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[-10%] h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute right-[10%] top-[20%] h-[280px] w-[280px] rounded-full bg-accent/20 blur-[120px]" />
        </div>
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
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
            <p className="mt-4 text-sm text-muted">
              Try the demo: <span className="font-mono text-foreground">admin@demo.io</span> /{" "}
              <span className="font-mono text-foreground">password123</span>
            </p>
          </div>
          <div className="lg:pl-6">
            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="border-y border-border bg-surface/50">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
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

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need, nothing you don&apos;t
          </h2>
          <p className="mt-3 text-muted">
            A focused feature set designed for makers, teams and beginners.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              From sensor to automation in three steps
            </h2>
            <p className="mt-3 text-muted">
              Devices talk to the platform over MQTT/HTTP. The platform streams to your
              dashboard and forwards every event to n8n, where you build the logic.
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
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

      {/* Industries */}
      <section id="industries" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Built for every industry
          </h2>
          <p className="mt-3 text-muted">
            One platform, endless applications — connect, control and automate across sectors.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
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
      <section id="use-cases" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Built for real use cases</h2>
          <p className="mt-3 text-muted">From a single sensor to a whole fleet.</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {USE_CASES.map((u) => (
            <div key={u.title} className="rounded-card border border-border bg-surface p-6">
              <h3 className="font-semibold">{u.title}</h3>
              <p className="mt-2 text-sm text-muted">{u.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Community / free */}
      <section className="border-y border-border bg-gradient-to-br from-primary/10 via-surface to-accent/10">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Free &amp; open for the community
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted">
            IoTFlow is free to self-host. Deploy with Docker or Coolify, own your
            data, and adapt it to your needs. No seats, no quotas, no lock-in.
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
      <section id="contact" className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:py-24">
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
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Logo href="/" size="sm" />
            <p className="mt-4 max-w-xs text-sm text-muted">
              A low-code, self-hosted IoT platform powered by n8n — connect,
              control and automate devices over MQTT &amp; HTTP.
            </p>
          </div>

          {/* About */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">About</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted">
              <li><a href="#features" className="hover:text-foreground">Features</a></li>
              <li><a href="#how" className="hover:text-foreground">How it works</a></li>
              <li><a href="#industries" className="hover:text-foreground">Industries</a></li>
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
              <li><a href="#preview" className="hover:text-foreground">Dashboard</a></li>
              <li><Link href="/privacy" className="hover:text-foreground">Privacy</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Contact</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted">
              <li>
                <a href="mailto:enquiry@tertiaryinfotech.com" className="hover:text-foreground">
                  enquiry@tertiaryinfotech.com
                </a>
              </li>
              <li>
                <a href="https://wa.me/6588666375" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
                  WhatsApp: +65 8866 6375
                </a>
              </li>
              <li><a href="#contact" className="hover:text-foreground">Send an enquiry</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border">
          <p className="mx-auto max-w-6xl px-4 py-5 text-center text-xs text-muted sm:px-6">
            © {new Date().getFullYear()} Tertiary Infotech Academy Pte Ltd. All rights reserved. · UEN 201200696W
          </p>
        </div>
      </footer>

      <WhatsAppButton />
    </>
  );
}

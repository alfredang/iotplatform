// deploy test: verifying auto-deploy on push (harmless comment, renders nothing)
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
} from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { DashboardPreview } from "@/components/marketing/dashboard-preview";
import { EnquiryForm } from "@/components/marketing/enquiry-form";

export const metadata = {
  title: "IoTFlow — Lightweight, self-hosted IoT platform",
  description:
    "Connect devices, view real-time data, build dashboards and get alerts. Free, self-hosted and beginner-friendly.",
};

const FEATURES = [
  { icon: Cable, title: "Connect devices easily", desc: "A guided wizard with copy-paste code for ESP32, Arduino, Raspberry Pi and more." },
  { icon: Activity, title: "Real-time dashboard", desc: "Live telemetry with auto-refresh, status cards and recent activity." },
  { icon: Radio, title: "MQTT & HTTP support", desc: "Push data over MQTT or a simple HTTP REST endpoint. WebSocket-ready." },
  { icon: Bell, title: "Simple alert rules", desc: "Trigger alerts when a metric crosses a threshold or a device goes offline." },
  { icon: Cpu, title: "Device monitoring", desc: "Track online/offline status, last-seen time and per-device telemetry." },
  { icon: ChartSpline, title: "Charts & gauges", desc: "Line, bar, number and gauge widgets you can compose into dashboards." },
  { icon: MapPin, title: "Map location view", desc: "See GPS-enabled devices on an OpenStreetMap map with live status." },
  { icon: Server, title: "Self-hosted", desc: "Docker & Coolify-ready. Own your data, deploy anywhere in minutes." },
];

const USE_CASES = [
  { title: "Environmental monitoring", desc: "Temperature, humidity and air quality across rooms, warehouses or farms." },
  { title: "Cold chain & logistics", desc: "Track cold rooms and fleet sensors with offline + threshold alerts." },
  { title: "Industrial & energy", desc: "Monitor voltage, current and pressure on pumps, machines and panels." },
  { title: "Smart buildings", desc: "Bring building sensors into one clean dashboard your whole team can use." },
];

function NavBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo href="/" />
        <nav className="hidden items-center gap-7 text-sm text-muted md:flex">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#preview" className="hover:text-foreground">Dashboard</a>
          <a href="#use-cases" className="hover:text-foreground">Use cases</a>
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
              <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Free · Self-hosted · Open
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              The lightweight IoT platform that&apos;s{" "}
              <span className="text-primary">ready in minutes</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted">
              Connect your devices, stream real-time data, build simple dashboards
              and get alerts — without the heavyweight complexity.
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
          <div className="grid gap-8 text-center sm:grid-cols-3">
            <div>
              <p className="text-3xl font-bold text-primary">5 min</p>
              <p className="mt-1 text-sm text-muted">From sign-up to first telemetry</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">MQTT + HTTP</p>
              <p className="mt-1 text-sm text-muted">Connect almost any device</p>
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
      <section id="contact" className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
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
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <Logo href="/" size="sm" />
          <p className="text-sm text-muted">
            © {new Date().getFullYear()} IoTFlow · Self-hosted IoT platform
          </p>
          <div className="flex gap-4 text-sm text-muted">
            <Link href="/login" className="hover:text-foreground">Log in</Link>
            <Link href="/register" className="hover:text-foreground">Sign up</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
          </div>
        </div>
        <div className="border-t border-border">
          <p className="mx-auto max-w-6xl px-4 py-4 text-center text-xs text-muted sm:px-6">
            Powered by{" "}
            <a
              href="https://www.tertiarycourses.com.sg/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              Tertiary Infotech Academy Pte Ltd
            </a>
          </p>
        </div>
      </footer>
    </>
  );
}

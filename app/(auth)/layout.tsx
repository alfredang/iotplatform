import type { ReactNode } from "react";
import { Activity, Smartphone, ToggleRight, Workflow } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

const FEATURES = [
  { icon: Activity, text: "Live telemetry over MQTT or HTTP" },
  { icon: ToggleRight, text: "Two-way device control from any dashboard" },
  { icon: Workflow, text: "Low-code automations and alerts with n8n" },
  { icon: Smartphone, text: "Native iOS and Android apps included" },
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1.1fr_1fr]">
      <section className="auth-band hidden flex-col justify-between p-10 text-white lg:flex">
        <Logo href="/" className="relative" />
        <div className="relative max-w-lg">
          <p className="text-xs font-medium uppercase tracking-wider text-teal-300">
            Welcome to IoTFlow
          </p>
          <h1 className="mt-3 text-[44px] font-semibold leading-[1.05]">
            Every sensor.
            <br />
            Every switch.
            <br />
            One live dashboard.
          </h1>
          <p className="mt-5 text-base font-light leading-relaxed text-white/80">
            Connect devices, watch their data stream in, and control them from the web or your
            phone — then automate the routine work without writing code.
          </p>
          <ul className="mt-8 space-y-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-white/85">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-teal-300">
                  <Icon className="h-4 w-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/60">
          © {new Date().getFullYear()}{" "}Tertiary Infotech · Free &amp; self-hosted IoT platform
        </p>
      </section>

      <section className="relative flex items-center justify-center px-4 py-16 sm:px-6">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-[400px]">
          <Logo href="/" className="mb-8 lg:hidden" />
          {children}
        </div>
      </section>
    </div>
  );
}

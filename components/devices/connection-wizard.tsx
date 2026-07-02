"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Check, Cpu, Radio, Globe, ArrowRight, ArrowLeft, PartyPopper } from "lucide-react";
import { apiFetch, fetcher } from "@/lib/client";
import { useProject, withProject } from "@/components/project/project-context";
import { buildSnippets } from "@/lib/sample-code";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { CopyButton } from "@/components/ui/copy";
import { Spinner } from "@/components/ui/misc";
import { SnippetTabs } from "./snippet-tabs";
import { TelemetryChart } from "@/components/charts/telemetry-chart";
import { cn } from "@/lib/utils";

type Protocol = "MQTT" | "HTTP";
type CreatedDevice = { id: string; deviceId: string; name: string };

const STEPS = ["Name", "Protocol", "Token", "Code", "Test", "Live"];

export function ConnectionWizard() {
  const router = useRouter();
  const { projectId } = useProject();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [protocol, setProtocol] = useState<Protocol>("HTTP");
  const [device, setDevice] = useState<CreatedDevice | null>(null);
  const [token, setToken] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  const mqttHost = process.env.NEXT_PUBLIC_MQTT_HOST || "localhost:1883";

  const snippets = useMemo(
    () =>
      device
        ? buildSnippets({ deviceId: device.deviceId, token, appUrl, mqttHost })
        : null,
    [device, token, appUrl, mqttHost],
  );

  // Poll for the first telemetry once we reach the Test step.
  const { data: telemetry } = useSWR<{ telemetry: unknown[]; metrics: string[] }>(
    device && step >= 4 ? `/api/devices/${device.id}/telemetry?limit=1` : null,
    fetcher,
    { refreshInterval: 3000 },
  );
  const received = (telemetry?.telemetry?.length ?? 0) > 0;
  const firstMetric = telemetry?.metrics?.[0];

  async function createDevice() {
    setCreating(true);
    setError("");
    try {
      const res = await apiFetch<{ device: CreatedDevice; token: string }>(
        withProject("/api/devices", projectId),
        {
          method: "POST",
          body: JSON.stringify({ name, protocol }),
        },
      );
      setDevice(res.device);
      setToken(res.token);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create device");
    } finally {
      setCreating(false);
    }
  }

  function next() {
    if (step === 0) {
      if (!name.trim()) {
        setError("Enter a device name");
        return;
      }
      setError("");
      setStep(1);
    } else if (step === 1) {
      createDevice();
    } else {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Stepper */}
      <ol className="mb-8 flex items-center">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-medium",
                  i < step && "border-primary bg-primary text-primary-foreground",
                  i === step && "border-primary text-primary",
                  i > step && "border-border text-muted",
                )}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className={cn("mt-1.5 hidden text-xs sm:block", i === step ? "text-foreground" : "text-muted")}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span className={cn("mx-2 h-px flex-1", i < step ? "bg-primary" : "bg-border")} />
            )}
          </li>
        ))}
      </ol>

      <Card>
        <CardBody className="pt-5">
          {/* Step 0: Name */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Name your device</h2>
              <p className="text-sm text-muted">Give it a friendly name you&apos;ll recognise.</p>
              <Field label="Device name">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Warehouse Sensor A"
                  autoFocus
                />
              </Field>
            </div>
          )}

          {/* Step 1: Protocol */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Choose a protocol</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {([
                  { v: "HTTP", icon: Globe, title: "HTTP REST", desc: "Simplest — POST JSON to an endpoint. Great for most devices." },
                  { v: "MQTT", icon: Radio, title: "MQTT", desc: "Lightweight pub/sub. Ideal for constrained or many devices." },
                ] as const).map((opt) => (
                  <button
                    key={opt.v}
                    onClick={() => setProtocol(opt.v)}
                    className={cn(
                      "rounded-card border p-5 text-left transition",
                      protocol === opt.v ? "border-primary bg-primary/5" : "border-border hover:bg-surface-2",
                    )}
                  >
                    <opt.icon className={cn("h-6 w-6", protocol === opt.v ? "text-primary" : "text-muted")} />
                    <p className="mt-3 font-semibold">{opt.title}</p>
                    <p className="mt-1 text-sm text-muted">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Token */}
          {step === 2 && device && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Your device token</h2>
              <p className="text-sm text-muted">
                Copy this now — it&apos;s shown only once. Use it to authenticate telemetry.
              </p>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 p-3">
                <code className="flex-1 break-all font-mono text-sm">{token}</code>
                <CopyButton value={token} />
              </div>
              <div className="rounded-lg bg-surface-2 p-3 text-sm">
                <p className="text-muted">Device ID</p>
                <code className="font-mono">{device.deviceId}</code>
              </div>
            </div>
          )}

          {/* Step 3: Code */}
          {step === 3 && device && snippets && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">Send data (uplink)</h2>
                <p className="text-sm text-muted">
                  Paste this into your device firmware or a terminal to stream telemetry.
                </p>
                <SnippetTabs snippets={protocol === "MQTT" ? snippets.mqtt : snippets.http} />
              </div>
              <div className="space-y-3 border-t border-border pt-5">
                <h2 className="text-lg font-semibold">Control your device (downlink)</h2>
                <p className="text-sm text-muted">
                  Receive commands from dashboard buttons, sliders &amp; n8n flows — the
                  equivalent of Blynk&apos;s <code className="font-mono">BLYNK_WRITE()</code>.
                  Add a Button, Switch or Slider widget bound to a virtual pin (e.g.{" "}
                  <code className="font-mono">V1</code>).
                </p>
                <SnippetTabs snippets={snippets.control} />
              </div>
            </div>
          )}

          {/* Step 4: Test */}
          {step === 4 && device && (
            <div className="space-y-4 text-center">
              <h2 className="text-lg font-semibold">Send test data</h2>
              {received ? (
                <div className="flex flex-col items-center gap-2 py-6 text-success">
                  <PartyPopper className="h-10 w-10" />
                  <p className="font-medium">First message received!</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-6 text-muted">
                  <Spinner className="h-6 w-6" />
                  <p>Waiting for the first message from your device…</p>
                  <p className="text-xs">Run the snippet from the previous step.</p>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Live */}
          {step === 5 && device && (
            <div className="space-y-4 text-center">
              <Cpu className="mx-auto h-10 w-10 text-primary" />
              <h2 className="text-lg font-semibold">You&apos;re live! 🎉</h2>
              <p className="text-sm text-muted">{device.name} is sending data.</p>
              {firstMetric && (
                <div className="text-left">
                  <TelemetryChart deviceId={device.id} metric={firstMetric} type="LINE" height={200} />
                </div>
              )}
              <div className="flex justify-center gap-2">
                <Button variant="outline" onClick={() => router.push(`/devices/${device.id}`)}>
                  View device
                </Button>
                <Button onClick={() => router.push("/dashboard")}>Go to dashboard</Button>
              </div>
            </div>
          )}

          {error && <p className="mt-4 text-sm text-danger">{error}</p>}

          {/* Nav */}
          {step < 5 && (
            <div className="mt-6 flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0 || step === 2}
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button onClick={next} disabled={creating}>
                {creating && <Spinner />}
                {step === 1 ? "Create device" : step === 4 ? "Continue" : "Next"}
                {!creating && <ArrowRight className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

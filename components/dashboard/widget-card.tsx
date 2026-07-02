"use client";

import { useState } from "react";
import useSWR from "swr";
import { Trash2, Cpu } from "lucide-react";
import { apiFetch, fetcher } from "@/lib/client";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, StatusDot } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { TelemetryChart } from "@/components/charts/telemetry-chart";
import { Gauge } from "@/components/charts/gauge";
import { DeviceMap, type MapDevice } from "@/components/maps/device-map";
import { formatNumber, humanize, metricUnit, timeAgo, cn } from "@/lib/utils";

export type Widget = {
  id: string;
  type:
    | "NUMBER"
    | "LINE"
    | "BAR"
    | "GAUGE"
    | "STATUS"
    | "ALERTS"
    | "MAP"
    | "BUTTON"
    | "SWITCH"
    | "SLIDER"
    | "TERMINAL"
    | "LED";
  title: string;
  metric: string | null;
  config: { min?: number; max?: number; pin?: string } | null;
  device: { id: string; name: string; deviceId: string; status: string } | null;
};

function LatestValue({ deviceId, metric }: { deviceId: string; metric: string }) {
  const { data } = useSWR<{ telemetry: { value: number | null }[] }>(
    `/api/devices/${deviceId}/telemetry?metric=${encodeURIComponent(metric)}&limit=1`,
    fetcher,
    { refreshInterval: 5000 },
  );
  const value = data?.telemetry?.[0]?.value ?? null;
  return (
    <p className="text-4xl font-semibold">
      {formatNumber(value)}
      <span className="ml-1 text-lg text-muted">{metricUnit(metric)}</span>
    </p>
  );
}

function GaugeValue({ deviceId, metric, config }: { deviceId: string; metric: string; config: Widget["config"] }) {
  const { data } = useSWR<{ telemetry: { value: number | null }[] }>(
    `/api/devices/${deviceId}/telemetry?metric=${encodeURIComponent(metric)}&limit=1`,
    fetcher,
    { refreshInterval: 5000 },
  );
  const value = data?.telemetry?.[0]?.value ?? null;
  return <Gauge value={value} min={config?.min ?? 0} max={config?.max ?? 100} unit={metricUnit(metric)} />;
}

function ActiveAlerts() {
  const { data } = useSWR<{ alerts: { id: string; message: string; triggeredAt: string }[] }>(
    "/api/alerts?status=ACTIVE",
    fetcher,
    { refreshInterval: 5000 },
  );
  const alerts = data?.alerts ?? [];
  if (alerts.length === 0) return <p className="text-sm text-muted">No active alerts 🎉</p>;
  return (
    <ul className="space-y-2">
      {alerts.slice(0, 5).map((a) => (
        <li key={a.id} className="rounded-lg border border-danger/30 bg-danger/10 p-2 text-sm">
          {a.message}
          <span className="block text-xs text-muted">{timeAgo(a.triggeredAt)}</span>
        </li>
      ))}
    </ul>
  );
}

function MapWidget() {
  const { data } = useSWR<{ devices: Array<MapDevice & { latitude: number | null; longitude: number | null }> }>(
    "/api/devices",
    fetcher,
    { refreshInterval: 15000 },
  );
  const located = (data?.devices ?? [])
    .filter((d) => d.latitude != null && d.longitude != null)
    .map((d) => ({ ...d, latitude: d.latitude as number, longitude: d.longitude as number }));
  if (located.length === 0) return <p className="text-sm text-muted">No located devices.</p>;
  return <DeviceMap devices={located} height={260} />;
}

// ---------------------------------------------------------------------------
// Control widgets — write a virtual-pin value to the device (downlink).
// Reads the current pin state so the control reflects reality after reload.
// ---------------------------------------------------------------------------

function usePinState(deviceId: string, pin: string) {
  const { data, mutate } = useSWR<{ state: Record<string, number | string | null> }>(
    `/api/devices/${deviceId}/command`,
    fetcher,
    { refreshInterval: 5000 },
  );
  return { value: data?.state?.[pin] ?? null, mutate };
}

async function sendCommand(
  deviceId: string,
  pin: string,
  body: { value?: number; strValue?: string },
) {
  await apiFetch(`/api/devices/${deviceId}/command`, {
    method: "POST",
    body: JSON.stringify({ pin, ...body }),
  });
}

function SwitchControl({ deviceId, pin }: { deviceId: string; pin: string }) {
  const { value, mutate } = usePinState(deviceId, pin);
  const on = Number(value) === 1;
  const [busy, setBusy] = useState(false);
  async function toggle() {
    setBusy(true);
    try {
      await sendCommand(deviceId, pin, { value: on ? 0 : 1 });
      await mutate();
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted">
        Pin <code className="font-mono">{pin}</code> · {on ? "ON" : "OFF"}
      </span>
      <button
        onClick={toggle}
        disabled={busy}
        aria-pressed={on}
        className={cn(
          "relative inline-flex h-7 w-12 items-center rounded-full transition",
          on ? "bg-primary" : "bg-surface-2 border border-border",
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 transform rounded-full bg-white transition",
            on ? "translate-x-6" : "translate-x-1",
          )}
        />
      </button>
    </div>
  );
}

function ButtonControl({ deviceId, pin }: { deviceId: string; pin: string }) {
  const [busy, setBusy] = useState(false);
  async function push(v: number) {
    setBusy(true);
    try {
      await sendCommand(deviceId, pin, { value: v });
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-2">
      <Button
        className="w-full"
        disabled={busy}
        onMouseDown={() => push(1)}
        onMouseUp={() => push(0)}
        onClick={() => push(1)}
      >
        Press
      </Button>
      <p className="text-xs text-muted">
        Sends <code className="font-mono">1</code> to pin{" "}
        <code className="font-mono">{pin}</code> (and <code className="font-mono">0</code> on release)
      </p>
    </div>
  );
}

function SliderControl({
  deviceId,
  pin,
  config,
}: {
  deviceId: string;
  pin: string;
  config: Widget["config"];
}) {
  const { value, mutate } = usePinState(deviceId, pin);
  const min = config?.min ?? 0;
  const max = config?.max ?? 100;
  const [local, setLocal] = useState<number | null>(null);
  const current = local ?? (value != null ? Number(value) : min);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted">
          Pin <code className="font-mono">{pin}</code>
        </span>
        <span className="text-2xl font-semibold">{formatNumber(current)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={current}
        onChange={(e) => setLocal(Number(e.target.value))}
        onMouseUp={async () => {
          await sendCommand(deviceId, pin, { value: current });
          await mutate();
        }}
        onTouchEnd={async () => {
          await sendCommand(deviceId, pin, { value: current });
          await mutate();
        }}
        className="w-full accent-[var(--color-primary)]"
      />
      <div className="flex justify-between text-xs text-muted">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

function TerminalControl({ deviceId, pin }: { deviceId: string; pin: string }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string[]>([]);
  async function send() {
    if (!text.trim()) return;
    setBusy(true);
    try {
      await sendCommand(deviceId, pin, { strValue: text });
      setSent((s) => [text, ...s].slice(0, 5));
      setText("");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={`Send text to ${pin}…`}
          className="flex-1 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm outline-none focus:border-primary"
        />
        <Button size="sm" onClick={send} disabled={busy}>Send</Button>
      </div>
      {sent.length > 0 && (
        <ul className="rounded-lg bg-surface-2 p-2 font-mono text-xs text-muted">
          {sent.map((s, i) => (
            <li key={i}>→ {s}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LedIndicator({ deviceId, metric }: { deviceId: string; metric: string }) {
  const { data } = useSWR<{ telemetry: { value: number | null }[] }>(
    `/api/devices/${deviceId}/telemetry?metric=${encodeURIComponent(metric)}&limit=1`,
    fetcher,
    { refreshInterval: 5000 },
  );
  const on = Number(data?.telemetry?.[0]?.value) > 0;
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "inline-block h-8 w-8 rounded-full transition",
          on ? "bg-success shadow-[0_0_16px_var(--color-success)]" : "bg-surface-2 border border-border",
        )}
      />
      <div>
        <p className="font-medium">{on ? "ON" : "OFF"}</p>
        <p className="text-xs text-muted">{humanize(metric)}</p>
      </div>
    </div>
  );
}

const spanForType: Record<Widget["type"], string> = {
  NUMBER: "",
  GAUGE: "",
  STATUS: "",
  BUTTON: "",
  SWITCH: "",
  SLIDER: "",
  LED: "",
  TERMINAL: "sm:col-span-2",
  LINE: "sm:col-span-2",
  BAR: "sm:col-span-2",
  ALERTS: "sm:col-span-2",
  MAP: "sm:col-span-2 lg:col-span-3",
};

export function WidgetCard({ widget, onRemove }: { widget: Widget; onRemove: (id: string) => void }) {
  const title = widget.title || widget.device?.name || humanize(widget.type);

  return (
    <Card className={spanForType[widget.type]}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <button
          onClick={() => onRemove(widget.id)}
          aria-label="Remove widget"
          className="text-muted hover:text-danger"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </CardHeader>
      <CardBody>
        {widget.type === "NUMBER" && widget.device && widget.metric && (
          <>
            <LatestValue deviceId={widget.device.id} metric={widget.metric} />
            <p className="mt-1 text-xs text-muted">
              {humanize(widget.metric)} · {widget.device.name}
            </p>
          </>
        )}
        {widget.type === "GAUGE" && widget.device && widget.metric && (
          <GaugeValue deviceId={widget.device.id} metric={widget.metric} config={widget.config} />
        )}
        {(widget.type === "LINE" || widget.type === "BAR") && widget.device && widget.metric && (
          <TelemetryChart deviceId={widget.device.id} metric={widget.metric} type={widget.type} />
        )}
        {widget.type === "STATUS" && widget.device && (
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2">
              <Cpu className="h-5 w-5 text-muted" />
            </span>
            <div>
              <p className="font-medium">{widget.device.name}</p>
              <Badge tone={widget.device.status === "ONLINE" ? "success" : "muted"}>
                <StatusDot online={widget.device.status === "ONLINE"} />
                {widget.device.status}
              </Badge>
            </div>
          </div>
        )}
        {widget.type === "ALERTS" && <ActiveAlerts />}
        {widget.type === "MAP" && <MapWidget />}

        {widget.type === "LED" && widget.device && widget.metric && (
          <LedIndicator deviceId={widget.device.id} metric={widget.metric} />
        )}

        {/* Control widgets (downlink) */}
        {widget.type === "SWITCH" && widget.device && (
          <SwitchControl deviceId={widget.device.id} pin={widget.config?.pin || "V1"} />
        )}
        {widget.type === "BUTTON" && widget.device && (
          <ButtonControl deviceId={widget.device.id} pin={widget.config?.pin || "V1"} />
        )}
        {widget.type === "SLIDER" && widget.device && (
          <SliderControl deviceId={widget.device.id} pin={widget.config?.pin || "V1"} config={widget.config} />
        )}
        {widget.type === "TERMINAL" && widget.device && (
          <TerminalControl deviceId={widget.device.id} pin={widget.config?.pin || "V1"} />
        )}

        {/* Missing-config fallback */}
        {["NUMBER", "GAUGE", "LINE", "BAR", "LED"].includes(widget.type) &&
          (!widget.device || !widget.metric) && (
            <p className="flex items-center gap-2 py-4 text-sm text-muted">
              <Spinner /> Configure a device and metric for this widget.
            </p>
          )}
        {["BUTTON", "SWITCH", "SLIDER", "TERMINAL"].includes(widget.type) &&
          !widget.device && (
            <p className="flex items-center gap-2 py-4 text-sm text-muted">
              <Spinner /> Select a device for this control.
            </p>
          )}
      </CardBody>
    </Card>
  );
}

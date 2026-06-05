"use client";

import useSWR from "swr";
import { Trash2, Cpu } from "lucide-react";
import { fetcher } from "@/lib/client";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, StatusDot } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/misc";
import { TelemetryChart } from "@/components/charts/telemetry-chart";
import { Gauge } from "@/components/charts/gauge";
import { DeviceMap, type MapDevice } from "@/components/maps/device-map";
import { formatNumber, humanize, metricUnit, timeAgo } from "@/lib/utils";

export type Widget = {
  id: string;
  type: "NUMBER" | "LINE" | "BAR" | "GAUGE" | "STATUS" | "ALERTS" | "MAP";
  title: string;
  metric: string | null;
  config: { min?: number; max?: number } | null;
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

const spanForType: Record<Widget["type"], string> = {
  NUMBER: "",
  GAUGE: "",
  STATUS: "",
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

        {/* Missing-config fallback */}
        {["NUMBER", "GAUGE", "LINE", "BAR"].includes(widget.type) &&
          (!widget.device || !widget.metric) && (
            <p className="flex items-center gap-2 py-4 text-sm text-muted">
              <Spinner /> Configure a device and metric for this widget.
            </p>
          )}
      </CardBody>
    </Card>
  );
}

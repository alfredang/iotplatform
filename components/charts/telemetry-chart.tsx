"use client";

import useSWR from "swr";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetcher } from "@/lib/client";
import { Spinner } from "@/components/ui/misc";
import { metricUnit } from "@/lib/utils";

type Row = { ts: string; value: number | null };

function useSeries(deviceId: string, metric: string, limit = 60) {
  return useSWR<{ telemetry: Row[] }>(
    `/api/devices/${deviceId}/telemetry?metric=${encodeURIComponent(metric)}&limit=${limit}`,
    fetcher,
    { refreshInterval: 5000 },
  );
}

function fmtTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function TelemetryChart({
  deviceId,
  metric,
  type = "LINE",
  height = 220,
}: {
  deviceId: string;
  metric: string;
  type?: "LINE" | "BAR";
  height?: number;
}) {
  const { data, isLoading } = useSeries(deviceId, metric);
  const unit = metricUnit(metric);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center text-muted" style={{ height }}>
        <Spinner />
      </div>
    );
  }
  const series = (data?.telemetry ?? [])
    .slice()
    .reverse()
    .map((r) => ({ t: fmtTime(r.ts), value: r.value }));

  if (series.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-muted" style={{ height }}>
        Waiting for data…
      </div>
    );
  }

  const common = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
      <XAxis dataKey="t" tick={{ fontSize: 11, fill: "var(--color-muted)" }} minTickGap={24} stroke="var(--color-border)" />
      <YAxis tick={{ fontSize: 11, fill: "var(--color-muted)" }} width={36} stroke="var(--color-border)" />
      <Tooltip
        contentStyle={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 8,
          fontSize: 12,
          color: "var(--color-foreground)",
        }}
        labelStyle={{ color: "var(--color-muted)" }}
        formatter={(value) => [`${value}${unit}`, metric]}
      />
    </>
  );

  return (
    <ResponsiveContainer width="100%" height={height}>
      {type === "BAR" ? (
        <BarChart data={series}>
          {common}
          <Bar dataKey="value" fill="var(--color-primary)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
        </BarChart>
      ) : (
        <AreaChart data={series}>
          <defs>
            <linearGradient id={`area-${metric}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          {common}
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--color-primary)"
            strokeWidth={2}
            fill={`url(#area-${metric})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      )}
    </ResponsiveContainer>
  );
}

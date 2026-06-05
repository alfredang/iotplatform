"use client";

import { RadialBar, RadialBarChart, ResponsiveContainer, PolarAngleAxis } from "recharts";

/** A simple radial gauge for a single value within [min, max]. */
export function Gauge({
  value,
  min = 0,
  max = 100,
  unit = "",
  height = 180,
}: {
  value: number | null;
  min?: number;
  max?: number;
  unit?: string;
  height?: number;
}) {
  const v = value ?? 0;
  const clamped = Math.max(min, Math.min(max, v));
  const pct = max > min ? ((clamped - min) / (max - min)) * 100 : 0;
  const data = [{ name: "value", value: pct, fill: "var(--color-primary)" }];

  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="72%"
          outerRadius="100%"
          data={data}
          startAngle={220}
          endAngle={-40}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar
            dataKey="value"
            background={{ fill: "var(--color-surface-2)" }}
            cornerRadius={8}
            isAnimationActive={false}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold">
          {value === null ? "—" : Math.round(v * 10) / 10}
          <span className="text-base text-muted">{unit}</span>
        </span>
        <span className="text-xs text-muted">
          {min}–{max}
          {unit}
        </span>
      </div>
    </div>
  );
}

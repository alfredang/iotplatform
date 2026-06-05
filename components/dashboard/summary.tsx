"use client";

import useSWR from "swr";
import Link from "next/link";
import { Cpu, Wifi, WifiOff, TriangleAlert } from "lucide-react";
import { fetcher } from "@/lib/client";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, StatusDot } from "@/components/ui/badge";
import { EmptyState, Spinner } from "@/components/ui/misc";
import { formatNumber, metricUnit, timeAgo, humanize } from "@/lib/utils";

type Summary = {
  counts: { total: number; online: number; offline: number; activeAlerts: number };
  latestTelemetry: Array<{
    id: string;
    metric: string;
    value: number | null;
    ts: string;
    device: { name: string; deviceId: string };
  }>;
  recentAlerts: Array<{
    id: string;
    message: string;
    status: string;
    triggeredAt: string;
    device: { name: string };
  }>;
};

const STAT_DEFS = [
  { key: "total", label: "Total devices", icon: Cpu, tone: "text-accent" },
  { key: "online", label: "Online", icon: Wifi, tone: "text-success" },
  { key: "offline", label: "Offline", icon: WifiOff, tone: "text-muted" },
  { key: "activeAlerts", label: "Active alerts", icon: TriangleAlert, tone: "text-warning" },
] as const;

export function DashboardSummary() {
  const { data, isLoading } = useSWR<Summary>("/api/dashboard/summary", fetcher, {
    refreshInterval: 5000,
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STAT_DEFS.map((s) => (
          <Card key={s.key}>
            <CardBody className="pt-4 sm:pt-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted">{s.label}</p>
                <s.icon className={`h-4 w-4 ${s.tone}`} />
              </div>
              <p className="mt-2 text-3xl font-semibold">
                {data ? data.counts[s.key] : <span className="text-muted">—</span>}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Latest telemetry</CardTitle>
            {isLoading && <Spinner className="text-muted" />}
          </CardHeader>
          <CardBody>
            {data && data.latestTelemetry.length > 0 ? (
              <ul className="divide-y divide-border">
                {data.latestTelemetry.map((t) => (
                  <li key={t.id} className="flex items-center justify-between py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{t.device.name}</p>
                      <p className="text-xs text-muted">
                        {humanize(t.metric)} · {timeAgo(t.ts)}
                      </p>
                    </div>
                    <span className="font-mono text-sm">
                      {formatNumber(t.value)}
                      <span className="text-muted">{metricUnit(t.metric)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No telemetry yet" description="Connect a device to see live readings." />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <Link href="/alerts" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardBody>
            {data && data.recentAlerts.length > 0 ? (
              <ul className="divide-y divide-border">
                {data.recentAlerts.map((a) => (
                  <li key={a.id} className="flex items-start justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm">{a.message}</p>
                      <p className="text-xs text-muted">{timeAgo(a.triggeredAt)}</p>
                    </div>
                    <Badge tone={a.status === "ACTIVE" ? "danger" : "muted"}>
                      <StatusDot online={a.status !== "ACTIVE"} />
                      {a.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No alerts" description="You're all clear — no alerts triggered." />
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

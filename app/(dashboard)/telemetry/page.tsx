"use client";

import { useState } from "react";
import useSWR from "swr";
import { Activity } from "lucide-react";
import { fetcher } from "@/lib/client";
import { useProject, withProject } from "@/components/project/project-context";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Select } from "@/components/ui/input";
import { EmptyState, PageHeader, Spinner } from "@/components/ui/misc";
import { TelemetryChart } from "@/components/charts/telemetry-chart";
import { formatNumber, humanize, metricUnit, timeAgo } from "@/lib/utils";

type Device = { id: string; name: string };
type Row = {
  id: string;
  metric: string;
  value: number | null;
  ts: string;
  device: { name: string; deviceId: string };
};

export default function TelemetryPage() {
  const { projectId } = useProject();
  const [deviceId, setDeviceId] = useState("");
  const [metric, setMetric] = useState("");

  const { data: devData } = useSWR<{ devices: Device[] }>(
    withProject("/api/devices", projectId),
    fetcher,
  );
  const { data: metricData } = useSWR<{ metrics: string[] }>(
    deviceId ? `/api/devices/${deviceId}/telemetry?limit=1` : null,
    fetcher,
  );

  const { data, isLoading } = useSWR<{ telemetry: Row[] }>(
    buildListUrl(deviceId, metric, devData?.devices, projectId),
    fetcher,
    { refreshInterval: 5000 },
  );

  const rows = (data?.telemetry ?? []).filter((r) => !metric || r.metric === metric);
  const metrics = metricData?.metrics ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Telemetry"
        description="Live and historical readings from your devices."
      />

      <Card>
        <CardBody className="pt-4 sm:pt-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:max-w-lg">
            <Field label="Device">
              <Select
                value={deviceId}
                onChange={(e) => {
                  setDeviceId(e.target.value);
                  setMetric("");
                }}
              >
                <option value="">All devices</option>
                {(devData?.devices ?? []).map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Metric">
              <Select
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
                disabled={!deviceId}
              >
                <option value="">{deviceId ? "All metrics" : "Select a device first"}</option>
                {metrics.map((m) => (
                  <option key={m} value={m}>{humanize(m)}</option>
                ))}
              </Select>
            </Field>
          </div>
        </CardBody>
      </Card>

      {deviceId && metric && (
        <Card>
          <CardHeader>
            <CardTitle>{humanize(metric)} trend</CardTitle>
          </CardHeader>
          <CardBody>
            <TelemetryChart deviceId={deviceId} metric={metric} type="LINE" height={260} />
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent readings</CardTitle>
          {isLoading && <Spinner className="text-muted" />}
        </CardHeader>
        <CardBody className="p-0 sm:p-0">
          {rows.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={<Activity className="h-8 w-8" />}
                title="No telemetry"
                description="Send data from a device to see readings here."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border text-left text-xs uppercase text-muted">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Device</th>
                    <th className="px-4 py-2.5 font-medium">Metric</th>
                    <th className="px-4 py-2.5 text-right font-medium">Value</th>
                    <th className="px-4 py-2.5 text-right font-medium">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((r) => (
                    <tr key={r.id} className="hover:bg-surface-2">
                      <td className="px-4 py-2.5">{r.device.name}</td>
                      <td className="px-4 py-2.5">{humanize(r.metric)}</td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        {formatNumber(r.value)}
                        <span className="text-muted">{metricUnit(r.metric)}</span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-muted">{timeAgo(r.ts)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function buildListUrl(
  deviceId: string,
  metric: string,
  devices: Device[] | undefined,
  projectId: string,
): string {
  const params = new URLSearchParams({ limit: "100", projectId });
  if (deviceId && devices) {
    const dev = devices.find((d) => d.id === deviceId) as
      | (Device & { deviceId?: string })
      | undefined;
    // The /api/telemetry endpoint expects the public deviceId.
    if (dev?.deviceId) params.set("deviceId", dev.deviceId);
  }
  if (metric) params.set("metric", metric);
  return `/api/telemetry?${params.toString()}`;
}

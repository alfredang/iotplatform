"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { apiFetch, fetcher } from "@/lib/client";
import { useProject, withProject } from "@/components/project/project-context";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Spinner } from "@/components/ui/misc";
import { humanize } from "@/lib/utils";

type Device = { id: string; name: string };

const TYPES = [
  { value: "NUMBER", label: "Number card" },
  { value: "LINE", label: "Line chart" },
  { value: "BAR", label: "Bar chart" },
  { value: "GAUGE", label: "Gauge" },
  { value: "STATUS", label: "Device status" },
  { value: "ALERTS", label: "Alert list" },
  { value: "MAP", label: "Map" },
] as const;

const NEEDS_DEVICE = ["NUMBER", "LINE", "BAR", "GAUGE", "STATUS"];
const NEEDS_METRIC = ["NUMBER", "LINE", "BAR", "GAUGE"];

export function AddWidget({ onAdded }: { onAdded: () => void }) {
  const { projectId } = useProject();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>("NUMBER");
  const [deviceId, setDeviceId] = useState("");
  const [metric, setMetric] = useState("");
  const [title, setTitle] = useState("");
  const [min, setMin] = useState("0");
  const [max, setMax] = useState("100");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: devData } = useSWR<{ devices: Device[] }>(
    open ? withProject("/api/devices", projectId) : null,
    fetcher,
  );
  const { data: telData } = useSWR<{ metrics: string[] }>(
    open && deviceId ? `/api/devices/${deviceId}/telemetry?limit=1` : null,
    fetcher,
  );
  const metrics = telData?.metrics ?? [];

  useEffect(() => {
    if (metrics.length && !metrics.includes(metric)) setMetric(metrics[0]);
  }, [metrics, metric]);

  async function submit() {
    setError("");
    if (NEEDS_DEVICE.includes(type) && !deviceId) {
      setError("Select a device");
      return;
    }
    if (NEEDS_METRIC.includes(type) && !metric) {
      setError("Select a metric");
      return;
    }
    setSaving(true);
    try {
      await apiFetch(withProject("/api/dashboard/widgets", projectId), {
        method: "POST",
        body: JSON.stringify({
          type,
          title,
          deviceId: NEEDS_DEVICE.includes(type) ? deviceId : null,
          metric: NEEDS_METRIC.includes(type) ? metric : null,
          config: type === "GAUGE" ? { min: Number(min), max: Number(max) } : undefined,
        }),
      });
      setOpen(false);
      setTitle("");
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add widget");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Add widget</Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add widget"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={saving}>
              {saving && <Spinner />} Add widget
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Widget type">
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Select>
          </Field>

          <Field label="Title (optional)">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Warehouse Temp" />
          </Field>

          {NEEDS_DEVICE.includes(type) && (
            <Field label="Device">
              <Select value={deviceId} onChange={(e) => setDeviceId(e.target.value)}>
                <option value="">Select a device…</option>
                {(devData?.devices ?? []).map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </Select>
            </Field>
          )}

          {NEEDS_METRIC.includes(type) && deviceId && (
            <Field label="Metric" hint={metrics.length ? undefined : "No telemetry yet for this device"}>
              <Select value={metric} onChange={(e) => setMetric(e.target.value)}>
                {metrics.map((m) => (
                  <option key={m} value={m}>{humanize(m)}</option>
                ))}
              </Select>
            </Field>
          )}

          {type === "GAUGE" && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Min"><Input type="number" value={min} onChange={(e) => setMin(e.target.value)} /></Field>
              <Field label="Max"><Input type="number" value={max} onChange={(e) => setMax(e.target.value)} /></Field>
            </div>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}
        </div>
      </Modal>
    </>
  );
}

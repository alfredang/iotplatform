"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { Bell, CheckCircle2, Trash2 } from "lucide-react";
import { apiFetch, fetcher } from "@/lib/client";
import { useProject, withProject } from "@/components/project/project-context";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select } from "@/components/ui/input";
import { EmptyState, PageHeader, Spinner } from "@/components/ui/misc";
import { humanize, timeAgo } from "@/lib/utils";

type Device = { id: string; name: string };
type Alert = {
  id: string;
  message: string;
  status: string;
  triggeredAt: string;
  device: { name: string };
  rule: { name: string };
};
type Rule = {
  id: string;
  name: string;
  metric: string | null;
  operator: string;
  threshold: number | null;
  durationSecs: number;
  enabled: boolean;
  device: { name: string };
};

const OPERATORS = [
  { value: "GT", label: "greater than (>)" },
  { value: "LT", label: "less than (<)" },
  { value: "GTE", label: "greater or equal (≥)" },
  { value: "LTE", label: "less or equal (≤)" },
  { value: "EQ", label: "equals (=)" },
  { value: "OFFLINE", label: "device offline" },
];

export default function AlertsPage() {
  const { projectId } = useProject();
  const { data, isLoading, mutate } = useSWR<{ alerts: Alert[]; rules: Rule[] }>(
    withProject("/api/alerts", projectId),
    fetcher,
    { refreshInterval: 5000 },
  );
  const [showCreate, setShowCreate] = useState(false);

  const active = (data?.alerts ?? []).filter((a) => a.status === "ACTIVE");
  const resolved = (data?.alerts ?? []).filter((a) => a.status === "RESOLVED").slice(0, 20);
  const rules = data?.rules ?? [];

  async function resolve(id: string) {
    await apiFetch(`/api/alerts/${id}/resolve`, { method: "PUT" });
    mutate();
  }
  async function toggleRule(id: string, enabled: boolean) {
    await apiFetch(`/api/alert-rules/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ enabled }),
    });
    mutate();
  }
  async function deleteRule(id: string) {
    if (!confirm("Delete this rule?")) return;
    await apiFetch(`/api/alert-rules/${id}`, { method: "DELETE" });
    mutate();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alerts"
        description="Create rules and respond to triggered alerts."
        action={<Button onClick={() => setShowCreate(true)}>Create rule</Button>}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted"><Spinner /></div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Active alerts</CardTitle>
              {active.length > 0 && <Badge tone="danger">{active.length}</Badge>}
            </CardHeader>
            <CardBody>
              {active.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle2 className="h-8 w-8 text-success" />}
                  title="All clear"
                  description="No active alerts right now."
                />
              ) : (
                <ul className="space-y-2">
                  {active.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-danger/30 bg-danger/10 p-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{a.message}</p>
                        <p className="text-xs text-muted">
                          {a.rule.name} · {a.device.name} · {timeAgo(a.triggeredAt)}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => resolve(a.id)}>
                        Resolve
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alert rules</CardTitle>
            </CardHeader>
            <CardBody className="p-0 sm:p-0">
              {rules.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    icon={<Bell className="h-8 w-8" />}
                    title="No rules yet"
                    description="Create a rule to get notified when a metric crosses a threshold."
                  />
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {rules.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="font-medium">{r.name}</p>
                        <p className="text-xs text-muted">
                          {r.device.name} ·{" "}
                          {r.operator === "OFFLINE"
                            ? `offline > ${r.durationSecs}s`
                            : `${humanize(r.metric || "")} ${opSymbol(r.operator)} ${r.threshold}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
                          <input
                            type="checkbox"
                            checked={r.enabled}
                            onChange={(e) => toggleRule(r.id, e.target.checked)}
                            className="h-4 w-4 accent-[var(--color-primary)]"
                          />
                          {r.enabled ? "Enabled" : "Disabled"}
                        </label>
                        <button
                          onClick={() => deleteRule(r.id)}
                          aria-label="Delete rule"
                          className="text-muted hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          {resolved.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recently resolved</CardTitle>
              </CardHeader>
              <CardBody>
                <ul className="divide-y divide-border">
                  {resolved.map((a) => (
                    <li key={a.id} className="flex items-center justify-between py-2.5 text-sm">
                      <span className="truncate text-muted">{a.message}</span>
                      <Badge tone="muted">resolved</Badge>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}
        </>
      )}

      {showCreate && (
        <CreateRuleModal
          onClose={() => setShowCreate(false)}
          onSaved={() => {
            setShowCreate(false);
            mutate();
          }}
        />
      )}
    </div>
  );
}

function opSymbol(op: string) {
  return { GT: ">", LT: "<", GTE: "≥", LTE: "≤", EQ: "=", OFFLINE: "offline" }[op] ?? op;
}

function CreateRuleModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const { projectId } = useProject();
  const { data: devData } = useSWR<{ devices: Device[] }>(
    withProject("/api/devices", projectId),
    fetcher,
  );
  const [name, setName] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [operator, setOperator] = useState("GT");
  const [metric, setMetric] = useState("");
  const [threshold, setThreshold] = useState("");
  const [durationSecs, setDurationSecs] = useState("600");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: telData } = useSWR<{ metrics: string[] }>(
    deviceId ? `/api/devices/${deviceId}/telemetry?limit=1` : null,
    fetcher,
  );
  const metrics = telData?.metrics ?? [];
  const isOffline = operator === "OFFLINE";

  useEffect(() => {
    if (metrics.length && !metrics.includes(metric)) setMetric(metrics[0]);
  }, [metrics, metric]);

  async function save() {
    setError("");
    if (!deviceId) return setError("Select a device");
    if (!name) return setError("Enter a rule name");
    setSaving(true);
    try {
      await apiFetch("/api/alerts", {
        method: "POST",
        body: JSON.stringify({
          name,
          deviceId,
          operator,
          metric: isOffline ? undefined : metric,
          threshold: isOffline ? undefined : Number(threshold),
          durationSecs: isOffline ? Number(durationSecs) : 0,
          enabled: true,
        }),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create rule");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Create alert rule"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Spinner />} Create rule
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Rule name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. High temperature" />
        </Field>
        <Field label="Device">
          <Select value={deviceId} onChange={(e) => setDeviceId(e.target.value)}>
            <option value="">Select a device…</option>
            {(devData?.devices ?? []).map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Condition">
          <Select value={operator} onChange={(e) => setOperator(e.target.value)}>
            {OPERATORS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </Field>
        {!isOffline ? (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Metric">
              <Select value={metric} onChange={(e) => setMetric(e.target.value)}>
                {metrics.length === 0 && <option value="">No telemetry yet</option>}
                {metrics.map((m) => (
                  <option key={m} value={m}>{humanize(m)}</option>
                ))}
              </Select>
            </Field>
            <Field label="Threshold">
              <Input type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)} placeholder="40" />
            </Field>
          </div>
        ) : (
          <Field label="Offline for (seconds)">
            <Input type="number" value={durationSecs} onChange={(e) => setDurationSecs(e.target.value)} />
          </Field>
        )}
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </Modal>
  );
}

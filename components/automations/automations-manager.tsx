"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Workflow,
  ExternalLink,
  Trash2,
  Zap,
  CheckCircle2,
  XCircle,
  Plug,
} from "lucide-react";
import { apiFetch, fetcher } from "@/lib/client";
import { useProject, withProject } from "@/components/project/project-context";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select } from "@/components/ui/input";
import { EmptyState, Spinner } from "@/components/ui/misc";
import { humanize, timeAgo } from "@/lib/utils";

type Device = { id: string; name: string };
type Automation = {
  id: string;
  name: string;
  event: string;
  deviceId: string | null;
  metric: string | null;
  n8nWebhookUrl: string;
  n8nWorkflowId: string | null;
  enabled: boolean;
  lastFiredAt: string | null;
  lastStatus: string | null;
};
type N8nWorkflow = { id: string; name: string; active: boolean; editorUrl: string };

const EVENTS = [
  { value: "TELEMETRY", label: "Telemetry received" },
  { value: "ALERT", label: "Alert triggered" },
  { value: "DEVICE_ONLINE", label: "Device came online" },
  { value: "DEVICE_OFFLINE", label: "Device went offline" },
  { value: "COMMAND", label: "Control command sent" },
] as const;

export function AutomationsManager() {
  const { projectId } = useProject();
  const { data, mutate, isLoading } = useSWR<{ automations: Automation[] }>(
    withProject("/api/automations", projectId),
    fetcher,
    { refreshInterval: 10000 },
  );
  const { data: n8n } = useSWR<{
    configured: boolean;
    baseUrl: string | null;
    workflows: N8nWorkflow[];
  }>("/api/n8n/workflows", fetcher);

  const automations = data?.automations ?? [];

  async function toggle(a: Automation) {
    await apiFetch(`/api/automations/${a.id}`, {
      method: "PATCH",
      body: JSON.stringify({ enabled: !a.enabled }),
    });
    mutate();
  }
  async function remove(id: string) {
    await apiFetch(`/api/automations/${id}`, { method: "DELETE" });
    mutate();
  }
  async function test(id: string) {
    await apiFetch(`/api/automations/${id}`, { method: "POST" });
    mutate();
  }

  return (
    <div className="space-y-6">
      <N8nStatus n8n={n8n} />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your automations</h2>
        <AddAutomation onAdded={() => mutate()} workflows={n8n?.workflows ?? []} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12 text-muted">
          <Spinner />
        </div>
      ) : automations.length === 0 ? (
        <EmptyState
          icon={<Workflow className="h-8 w-8" />}
          title="No automations yet"
          description="Connect a device event to an n8n workflow to start building no-code logic."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {automations.map((a) => {
            const failed = a.lastStatus?.startsWith("error");
            return (
              <Card key={a.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" /> {a.name}
                  </CardTitle>
                  <button
                    onClick={() => remove(a.id)}
                    aria-label="Delete automation"
                    className="text-muted hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </CardHeader>
                <CardBody className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="info">{humanize(a.event)}</Badge>
                    {a.metric && <Badge tone="muted">metric: {a.metric}</Badge>}
                    <Badge tone={a.enabled ? "success" : "muted"}>
                      {a.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <p className="break-all font-mono text-xs text-muted">{a.n8nWebhookUrl}</p>
                  {a.lastFiredAt && (
                    <p className="flex items-center gap-1.5 text-xs text-muted">
                      {failed ? (
                        <XCircle className="h-3.5 w-3.5 text-danger" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                      )}
                      Last fired {timeAgo(a.lastFiredAt)} · {a.lastStatus}
                    </p>
                  )}
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="outline" onClick={() => test(a.id)}>
                      Test
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toggle(a)}>
                      {a.enabled ? "Disable" : "Enable"}
                    </Button>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function N8nStatus({
  n8n,
}: {
  n8n?: { configured: boolean; baseUrl: string | null; workflows: N8nWorkflow[] };
}) {
  if (!n8n) return null;
  return (
    <Card>
      <CardBody className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${
              n8n.configured ? "bg-success/15 text-success" : "bg-surface-2 text-muted"
            }`}
          >
            <Plug className="h-5 w-5" />
          </span>
          <div>
            <p className="font-medium">
              n8n {n8n.configured ? "connected" : "not configured"}
            </p>
            <p className="text-sm text-muted">
              {n8n.configured
                ? `${n8n.baseUrl} · ${n8n.workflows.length} workflow(s)`
                : "Set N8N_BASE_URL and N8N_API_KEY to enable low-code automations."}
            </p>
          </div>
        </div>
        {n8n.configured && n8n.baseUrl && (
          <a href={n8n.baseUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              Open n8n <ExternalLink className="h-4 w-4" />
            </Button>
          </a>
        )}
      </CardBody>
    </Card>
  );
}

function AddAutomation({
  onAdded,
  workflows,
}: {
  onAdded: () => void;
  workflows: N8nWorkflow[];
}) {
  const { projectId } = useProject();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [event, setEvent] = useState<string>("ALERT");
  const [deviceId, setDeviceId] = useState("");
  const [metric, setMetric] = useState("");
  const [url, setUrl] = useState("");
  const [workflowId, setWorkflowId] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: devData } = useSWR<{ devices: Device[] }>(
    open ? withProject("/api/devices", projectId) : null,
    fetcher,
  );

  function reset() {
    setName("");
    setEvent("ALERT");
    setDeviceId("");
    setMetric("");
    setUrl("");
    setWorkflowId("");
    setError("");
  }
  function close() {
    reset();
    setOpen(false);
  }

  async function submit() {
    setError("");
    if (!name.trim()) return setError("Enter a name");
    if (!url.trim()) return setError("Enter the n8n webhook URL");
    setSaving(true);
    try {
      await apiFetch(withProject("/api/automations", projectId), {
        method: "POST",
        body: JSON.stringify({
          name,
          event,
          deviceId: deviceId || null,
          metric: metric || null,
          n8nWebhookUrl: url,
          n8nWorkflowId: workflowId || null,
        }),
      });
      close();
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create automation");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button onClick={() => { reset(); setOpen(true); }}>
        <Workflow className="h-4 w-4" /> New automation
      </Button>
      <Modal
        open={open}
        onClose={close}
        title="New automation"
        footer={
          <>
            <Button variant="ghost" onClick={close}>Cancel</Button>
            <Button onClick={submit} disabled={saving}>
              {saving && <Spinner />} Create
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Notify on high temp" />
          </Field>
          <Field label="When this happens">
            <Select value={event} onChange={(e) => setEvent(e.target.value)}>
              {EVENTS.map((ev) => (
                <option key={ev.value} value={ev.value}>{ev.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Device filter (optional)">
            <Select value={deviceId} onChange={(e) => setDeviceId(e.target.value)}>
              <option value="">Any device</option>
              {(devData?.devices ?? []).map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </Field>
          {(event === "TELEMETRY" || event === "ALERT") && (
            <Field label="Metric filter (optional)" hint="e.g. temperature — leave blank for all">
              <Input value={metric} onChange={(e) => setMetric(e.target.value)} placeholder="temperature" />
            </Field>
          )}
          {workflows.length > 0 && (
            <Field label="Link an n8n workflow (optional)" hint="Just for status & deep-linking">
              <Select value={workflowId} onChange={(e) => setWorkflowId(e.target.value)}>
                <option value="">None</option>
                {workflows.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} {w.active ? "" : "(inactive)"}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field
            label="n8n Webhook URL"
            hint="Copy the Production URL from a Webhook node in your n8n flow"
          >
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://n8n.tertiarytraining.com/webhook/iot-alert"
            />
          </Field>
          {error && <p className="text-sm text-danger">{error}</p>}
        </div>
      </Modal>
    </>
  );
}

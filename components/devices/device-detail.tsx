"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  Cpu,
  KeyRound,
  RefreshCw,
  Trash2,
  Pencil,
  MapPin,
} from "lucide-react";
import { apiFetch, fetcher } from "@/lib/client";
import { buildSnippets } from "@/lib/sample-code";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, StatusDot } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select } from "@/components/ui/input";
import { CopyButton } from "@/components/ui/copy";
import { Spinner, PageHeader } from "@/components/ui/misc";
import { SnippetTabs } from "./snippet-tabs";
import { TelemetryChart } from "@/components/charts/telemetry-chart";
import { humanize, timeAgo } from "@/lib/utils";

type Device = {
  id: string;
  name: string;
  type: string;
  deviceId: string;
  protocol: "MQTT" | "HTTP" | "WEBSOCKET";
  status: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  lastSeen: string | null;
  createdAt: string;
  tokens: { id: string; prefix: string; lastUsed: string | null }[];
  _count: { telemetry: number };
};

export function DeviceDetail({ id }: { id: string }) {
  const router = useRouter();
  const { data, isLoading, mutate } = useSWR<{ device: Device }>(
    `/api/devices/${id}`,
    fetcher,
    { refreshInterval: 10000 },
  );
  const { data: tel } = useSWR<{ metrics: string[] }>(
    `/api/devices/${id}/telemetry?limit=1`,
    fetcher,
    { refreshInterval: 10000 },
  );

  const [newToken, setNewToken] = useState("");
  const [editing, setEditing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  const mqttHost = process.env.NEXT_PUBLIC_MQTT_HOST || "localhost:1883";

  const device = data?.device;
  const metrics = tel?.metrics ?? [];

  const snippets = useMemo(
    () =>
      device
        ? buildSnippets({ deviceId: device.deviceId, token: newToken, appUrl, mqttHost })
        : null,
    [device, newToken, appUrl, mqttHost],
  );

  if (isLoading || !device) {
    return (
      <div className="flex items-center justify-center py-16 text-muted">
        <Spinner />
      </div>
    );
  }

  async function regenerate() {
    if (!confirm("Regenerate token? The old token will stop working.")) return;
    setRegenerating(true);
    try {
      const res = await apiFetch<{ token: string }>(`/api/devices/${id}/token`, {
        method: "POST",
      });
      setNewToken(res.token);
      mutate();
    } finally {
      setRegenerating(false);
    }
  }

  async function remove() {
    if (!confirm(`Delete "${device!.name}"?`)) return;
    await apiFetch(`/api/devices/${id}`, { method: "DELETE" });
    router.push("/devices");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={device.name}
        description={`${device.type} · ${device.deviceId}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
            <Button variant="danger" onClick={remove}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info */}
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <Badge tone={device.status === "ONLINE" ? "success" : "muted"}>
              <StatusDot online={device.status === "ONLINE"} />
              {device.status}
            </Badge>
          </CardHeader>
          <CardBody className="space-y-3 text-sm">
            <Row label="Protocol" value={device.protocol} />
            <Row label="Device ID" value={device.deviceId} mono />
            <Row label="Location" value={device.location || "—"} />
            <Row
              label="Coordinates"
              value={
                device.latitude != null && device.longitude != null
                  ? `${device.latitude.toFixed(4)}, ${device.longitude.toFixed(4)}`
                  : "—"
              }
            />
            <Row label="Readings" value={String(device._count.telemetry)} />
            <Row label="Last seen" value={timeAgo(device.lastSeen)} />
            <Row label="Added" value={new Date(device.createdAt).toLocaleDateString()} />
          </CardBody>
        </Card>

        {/* Token */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              <span className="inline-flex items-center gap-2">
                <KeyRound className="h-4 w-4" /> Device token
              </span>
            </CardTitle>
            <Button variant="outline" size="sm" onClick={regenerate} disabled={regenerating}>
              {regenerating ? <Spinner /> : <RefreshCw className="h-4 w-4" />} Regenerate
            </Button>
          </CardHeader>
          <CardBody className="space-y-3">
            {newToken ? (
              <div className="flex items-center gap-2 rounded-lg border border-success/40 bg-success/10 p-3">
                <code className="flex-1 break-all font-mono text-sm">{newToken}</code>
                <CopyButton value={newToken} />
              </div>
            ) : (
              <p className="text-sm text-muted">
                Active token{device.tokens.length > 1 ? "s" : ""}:{" "}
                {device.tokens.length > 0
                  ? device.tokens.map((t) => (
                      <code key={t.id} className="mr-2 font-mono">{t.prefix}…</code>
                    ))
                  : "none"}
                . The full token is only shown once; regenerate to get a new one.
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Telemetry charts */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Telemetry</h2>
        {metrics.length === 0 ? (
          <Card>
            <CardBody className="flex items-center gap-2 py-8 text-sm text-muted">
              <Cpu className="h-5 w-5" /> No telemetry received yet for this device.
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {metrics.map((m) => (
              <Card key={m}>
                <CardHeader>
                  <CardTitle>{humanize(m)}</CardTitle>
                </CardHeader>
                <CardBody>
                  <TelemetryChart deviceId={device.id} metric={m} type="LINE" />
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Connection code */}
      {snippets && (
        <Card>
          <CardHeader>
            <CardTitle>Connect this device</CardTitle>
          </CardHeader>
          <CardBody>
            {!newToken && (
              <p className="mb-3 rounded-lg bg-surface-2 p-3 text-xs text-muted">
                Snippets use a <code>&lt;DEVICE_TOKEN&gt;</code> placeholder. Regenerate the token above to embed a real one.
              </p>
            )}
            <SnippetTabs
              snippets={device.protocol === "MQTT" ? snippets.mqtt : snippets.http}
            />
            <div className="mt-5 border-t border-border pt-4">
              <p className="mb-3 text-sm font-medium">
                Control (downlink) — react to dashboard &amp; n8n commands
              </p>
              <SnippetTabs snippets={snippets.control} />
            </div>
          </CardBody>
        </Card>
      )}

      {editing && (
        <EditDeviceModal
          device={device}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            mutate();
          }}
        />
      )}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className={mono ? "font-mono" : ""}>{value}</span>
    </div>
  );
}

function EditDeviceModal({
  device,
  onClose,
  onSaved,
}: {
  device: Device;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: device.name,
    type: device.type,
    location: device.location ?? "",
    latitude: device.latitude?.toString() ?? "",
    longitude: device.longitude?.toString() ?? "",
    protocol: device.protocol,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      await apiFetch(`/api/devices/${device.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: form.name,
          type: form.type,
          location: form.location,
          latitude: form.latitude ? Number(form.latitude) : undefined,
          longitude: form.longitude ? Number(form.longitude) : undefined,
          protocol: form.protocol,
        }),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Edit device"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Spinner />} Save
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Name"><Input value={form.name} onChange={set("name")} /></Field>
        <Field label="Type"><Input value={form.type} onChange={set("type")} /></Field>
        <Field label="Location">
          <Input value={form.location} onChange={set("location")} placeholder="e.g. Warehouse 1" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Latitude" hint="-90 to 90">
            <Input value={form.latitude} onChange={set("latitude")} placeholder="1.3521" />
          </Field>
          <Field label="Longitude" hint="-180 to 180">
            <Input value={form.longitude} onChange={set("longitude")} placeholder="103.8198" />
          </Field>
        </div>
        <Field label="Protocol">
          <Select value={form.protocol} onChange={set("protocol")}>
            <option value="HTTP">HTTP</option>
            <option value="MQTT">MQTT</option>
            <option value="WEBSOCKET">WebSocket</option>
          </Select>
        </Field>
        <p className="flex items-center gap-1.5 text-xs text-muted">
          <MapPin className="h-3.5 w-3.5" /> Coordinates place the device on the map.
        </p>
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </Modal>
  );
}

"use client";

import { useState } from "react";
import useSWR from "swr";
import { apiFetch, fetcher } from "@/lib/client";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/misc";

type Config = {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpFrom: string;
  alertEmail: string;
  emailAlertsEnabled: boolean;
  hasPassword: boolean;
  gmailUser: string;
  gmailClientId: string;
  hasGmailClientSecret: boolean;
  hasGmailRefreshToken: boolean;
  n8nBaseUrl: string;
  hasN8nApiKey: boolean;
  mqttBrokerUrl: string;
  mqttUsername: string;
  mqttPublicHost: string;
  hasMqttPassword: boolean;
};

type FormExtra = {
  smtpPassword?: string;
  gmailClientSecret?: string;
  gmailRefreshToken?: string;
  n8nApiKey?: string;
  mqttPassword?: string;
};

export function EmailSettings() {
  const { data, isLoading, mutate } = useSWR<{ config: Config }>("/api/admin/config", fetcher);
  const [form, setForm] = useState<Partial<Config> & FormExtra>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState("");

  const cfg = data?.config;
  // Controlled values fall back to the loaded config.
  const val = <K extends keyof Config>(k: K): Config[K] =>
    (form[k] ?? cfg?.[k]) as Config[K];

  function set(k: keyof Config | keyof FormExtra) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await apiFetch("/api/admin/config", { method: "PUT", body: JSON.stringify(form) });
      setForm((f) => ({
        ...f,
        smtpPassword: "",
        gmailClientSecret: "",
        gmailRefreshToken: "",
        n8nApiKey: "",
        mqttPassword: "",
      }));
      setSaved(true);
      mutate();
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function sendTest() {
    setTesting(true);
    setTestResult("");
    setError("");
    try {
      const res = await apiFetch<{ delivered: boolean; to: string }>(
        "/api/admin/config/test-email",
        { method: "POST", body: JSON.stringify({}) },
      );
      setTestResult(
        res.delivered
          ? `Test email sent to ${res.to}`
          : "No email transport configured — message was logged to the server console",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test email failed");
    } finally {
      setTesting(false);
    }
  }

  async function toggleAlerts(enabled: boolean) {
    setForm((f) => ({ ...f, emailAlertsEnabled: enabled }));
    await apiFetch("/api/admin/config", {
      method: "PUT",
      body: JSON.stringify({ emailAlertsEnabled: enabled }),
    });
    mutate();
  }

  if (isLoading || !cfg) {
    return <div className="flex items-center justify-center py-16 text-muted"><Spinner /></div>;
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email alerts</CardTitle>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={val("emailAlertsEnabled")}
              onChange={(e) => toggleAlerts(e.target.checked)}
              className="h-4 w-4 accent-[var(--color-primary)]"
            />
            {val("emailAlertsEnabled") ? "Enabled" : "Disabled"}
          </label>
        </CardHeader>
        <CardBody className="space-y-4">
          <p className="text-sm text-muted">
            When enabled, triggered alerts are emailed using the SMTP settings
            below. If no SMTP host is set, codes/alerts are logged to the server
            console instead (useful for local testing).
          </p>
          <Field label="Alert recipient email" hint="Where alert notifications are sent.">
            <Input
              type="email"
              value={val("alertEmail") || ""}
              onChange={set("alertEmail")}
              placeholder="alerts@acme.io"
            />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gmail (OAuth2)</CardTitle>
          {cfg.hasGmailRefreshToken && <Badge tone="success">Connected</Badge>}
        </CardHeader>
        <CardBody className="space-y-4">
          <p className="text-sm text-muted">
            Send email through a Gmail account using Google OAuth2 — used for
            verification codes, one-time login codes, password resets and
            alerts. Takes precedence over SMTP when fully configured. Get a
            refresh token with{" "}
            <code className="rounded bg-surface-2 px-1">node scripts/gmail-oauth.mjs</code>.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Gmail address">
              <Input value={val("gmailUser") || ""} onChange={set("gmailUser")} placeholder="you@gmail.com" />
            </Field>
            <Field label="Client ID">
              <Input value={val("gmailClientId") || ""} onChange={set("gmailClientId")} placeholder="xxxx.apps.googleusercontent.com" />
            </Field>
            <Field label="Client secret" hint={cfg.hasGmailClientSecret ? "Leave blank to keep current." : undefined}>
              <Input
                type="password"
                value={form.gmailClientSecret ?? ""}
                onChange={set("gmailClientSecret")}
                placeholder="••••••••"
              />
            </Field>
            <Field label="Refresh token" hint={cfg.hasGmailRefreshToken ? "Leave blank to keep current." : undefined}>
              <Input
                type="password"
                value={form.gmailRefreshToken ?? ""}
                onChange={set("gmailRefreshToken")}
                placeholder="••••••••"
              />
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SMTP credentials</CardTitle>
          {cfg.hasPassword && <Badge tone="success">Password set</Badge>}
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="SMTP host">
              <Input value={val("smtpHost") || ""} onChange={set("smtpHost")} placeholder="smtp.gmail.com" />
            </Field>
            <Field label="SMTP port">
              <Input type="number" value={val("smtpPort") ?? 587} onChange={set("smtpPort")} placeholder="587" />
            </Field>
            <Field label="SMTP username">
              <Input value={val("smtpUser") || ""} onChange={set("smtpUser")} placeholder="apikey or user@host" />
            </Field>
            <Field label="SMTP password" hint={cfg.hasPassword ? "Leave blank to keep current." : undefined}>
              <Input
                type="password"
                value={form.smtpPassword ?? ""}
                onChange={set("smtpPassword")}
                placeholder="••••••••"
              />
            </Field>
          </div>
          <Field label="From address">
            <Input value={val("smtpFrom") || ""} onChange={set("smtpFrom")} placeholder="IoT Platform <no-reply@acme.io>" />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>n8n integration</CardTitle>
          {cfg.hasN8nApiKey && <Badge tone="success">API key set</Badge>}
        </CardHeader>
        <CardBody className="space-y-4">
          <p className="text-sm text-muted">
            Connect the low-code automation engine. When set, the Automations page
            shows your workflows and events are forwarded to n8n. Overrides the
            <code className="mx-1 rounded bg-surface-2 px-1">N8N_*</code> env vars.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="n8n base URL">
              <Input value={val("n8nBaseUrl") || ""} onChange={set("n8nBaseUrl")} placeholder="https://n8n.example.com" />
            </Field>
            <Field label="n8n API key" hint={cfg.hasN8nApiKey ? "Leave blank to keep current." : "Settings → API in n8n"}>
              <Input type="password" value={form.n8nApiKey ?? ""} onChange={set("n8nApiKey")} placeholder="••••••••" />
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>MQTT broker</CardTitle>
          {cfg.hasMqttPassword && <Badge tone="success">Password set</Badge>}
        </CardHeader>
        <CardBody className="space-y-4">
          <p className="text-sm text-muted">
            The broker the server publishes control commands to. Overrides the
            <code className="mx-1 rounded bg-surface-2 px-1">MQTT_*</code> env vars.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Broker URL">
              <Input value={val("mqttBrokerUrl") || ""} onChange={set("mqttBrokerUrl")} placeholder="mqtt://broker:1883" />
            </Field>
            <Field label="Public host:port" hint="Shown in device sample code.">
              <Input value={val("mqttPublicHost") || ""} onChange={set("mqttPublicHost")} placeholder="broker.example.com:1883" />
            </Field>
            <Field label="Username">
              <Input value={val("mqttUsername") || ""} onChange={set("mqttUsername")} placeholder="(optional)" />
            </Field>
            <Field label="Password" hint={cfg.hasMqttPassword ? "Leave blank to keep current." : undefined}>
              <Input type="password" value={form.mqttPassword ?? ""} onChange={set("mqttPassword")} placeholder="••••••••" />
            </Field>
          </div>
        </CardBody>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving && <Spinner />} Save settings
        </Button>
        <Button type="button" variant="outline" onClick={sendTest} disabled={testing}>
          {testing && <Spinner />} Send test email
        </Button>
        {saved && <span className="text-sm text-success">Saved!</span>}
        {testResult && <span className="text-sm text-success">{testResult}</span>}
        {error && <span className="text-sm text-danger">{error}</span>}
      </div>
    </form>
  );
}

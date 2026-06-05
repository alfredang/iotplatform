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
};

export function EmailSettings() {
  const { data, isLoading, mutate } = useSWR<{ config: Config }>("/api/admin/config", fetcher);
  const [form, setForm] = useState<Partial<Config> & { smtpPassword?: string }>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const cfg = data?.config;
  // Controlled values fall back to the loaded config.
  const val = <K extends keyof Config>(k: K): Config[K] =>
    (form[k] ?? cfg?.[k]) as Config[K];

  function set(k: keyof Config | "smtpPassword") {
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
      setForm((f) => ({ ...f, smtpPassword: "" }));
      setSaved(true);
      mutate();
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
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

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving && <Spinner />} Save settings
        </Button>
        {saved && <span className="text-sm text-success">Saved!</span>}
        {error && <span className="text-sm text-danger">{error}</span>}
      </div>
    </form>
  );
}

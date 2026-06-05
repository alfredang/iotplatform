"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/client";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/misc";

type Initial = {
  name: string;
  email: string;
  role: string;
  orgName: string;
  notificationEmail: string;
  theme: string;
};

export function SettingsForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [form, setForm] = useState({
    name: initial.name,
    orgName: initial.orgName,
    notificationEmail: initial.notificationEmail,
    theme: initial.theme,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await apiFetch("/api/settings", { method: "PUT", body: JSON.stringify(form) });
      setTheme(form.theme);
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <Badge tone="info">{initial.role}</Badge>
        </CardHeader>
        <CardBody className="space-y-4">
          <Field label="Name">
            <Input value={form.name} onChange={set("name")} placeholder="Your name" />
          </Field>
          <Field label="Email" hint="Your sign-in email cannot be changed here.">
            <Input value={initial.email} disabled />
          </Field>
          <Field label="Organization name">
            <Input value={form.orgName} onChange={set("orgName")} placeholder="Acme IoT" />
          </Field>
          <Field label="Notification email" hint="Where alert notifications would be sent.">
            <Input
              type="email"
              value={form.notificationEmail}
              onChange={set("notificationEmail")}
              placeholder="alerts@acme.io"
            />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardBody>
          <Field label="Theme">
            <Select value={form.theme} onChange={set("theme")} className="max-w-xs">
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </Select>
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API access</CardTitle>
        </CardHeader>
        <CardBody className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted">Manage keys used to submit telemetry.</p>
          <Link href="/api-keys">
            <Button variant="outline" type="button">Manage API keys</Button>
          </Link>
        </CardBody>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving && <Spinner />} Save changes
        </Button>
        {saved && <span className="text-sm text-success">Saved!</span>}
        {error && <span className="text-sm text-danger">{error}</span>}
      </div>
    </form>
  );
}

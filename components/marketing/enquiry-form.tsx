"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Spinner } from "@/components/ui/misc";

export function EnquiryForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    message: "",
  });
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiFetch("/api/enquiry", { method: "POST", body: JSON.stringify(form) });
      setSent(true);
      setForm({ name: "", email: "", company: "", phone: "", message: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send enquiry");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-card border border-success/30 bg-success/10 p-8 text-center">
        <p className="text-lg font-semibold text-success">Thanks for reaching out!</p>
        <p className="mt-1 text-sm text-muted">
          We&apos;ve received your enquiry and will get back to you soon.
        </p>
        <Button variant="outline" className="mt-4" onClick={() => setSent(false)}>
          Send another
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-card border border-border bg-surface p-6 shadow-sm sm:p-8"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="q-name">
          <Input id="q-name" required value={form.name} onChange={set("name")} />
        </Field>
        <Field label="Email" htmlFor="q-email">
          <Input id="q-email" type="email" required value={form.email} onChange={set("email")} />
        </Field>
        <Field label="Company / Organization" htmlFor="q-company">
          <Input id="q-company" value={form.company} onChange={set("company")} />
        </Field>
        <Field label="Phone" htmlFor="q-phone">
          <Input id="q-phone" value={form.phone} onChange={set("phone")} />
        </Field>
      </div>
      <div className="mt-4">
        <Field label="Message" htmlFor="q-message">
          <Textarea id="q-message" required value={form.message} onChange={set("message")} placeholder="Tell us about your project or question…" />
        </Field>
      </div>
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      <Button type="submit" size="lg" className="mt-4 w-full sm:w-auto" disabled={loading}>
        {loading && <Spinner />} Send enquiry
      </Button>
    </form>
  );
}

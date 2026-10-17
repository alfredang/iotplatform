"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { apiFetch } from "@/lib/client";
import { Button, buttonClass } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/misc";
import { SocialButtons, OrDivider } from "./social-buttons";

export function RegisterForm({ google, github }: { google: boolean; github: boolean }) {
  const [form, setForm] = useState({ name: "", email: "" });
  const [sent, setSent] = useState(false);
  const [devPassword, setDevPassword] = useState<string | undefined>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch<{ devPassword?: string }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setDevPassword(res.devPassword);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not register");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    const email = encodeURIComponent(form.email);
    return (
      <div>
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <MailCheck className="h-5 w-5" />
        </span>
        <h1 className="mt-4 text-[28px] font-semibold leading-tight">Check your inbox</h1>
        <p className="mt-2 text-sm text-muted">
          We sent a welcome email to{" "}
          <span className="font-medium text-foreground">{form.email}</span>{" "}with your default
          password. Sign in with it — or with a one-time code — and you&apos;ll be asked to set
          your own password straight away.
        </p>

        {devPassword && (
          <p className="mt-4 rounded-lg bg-warning/15 p-3 text-center text-sm text-warning">
            Dev mode (no email configured) — your default password is{" "}
            <span className="font-mono font-semibold">{devPassword}</span>
          </p>
        )}

        <div className="mt-6 space-y-2">
          <Link
            href={`/login?method=password&email=${email}`}
            className={buttonClass({ className: "w-full" })}
          >
            Sign in with password
          </Link>
          <Link
            href={`/login?email=${email}`}
            className={buttonClass({ variant: "outline", className: "w-full" })}
          >
            Sign in with an email code
          </Link>
        </div>
        <p className="mt-6 text-center text-sm text-muted">
          No email after a few minutes? Check your spam folder.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-primary">Get started</p>
      <h1 className="mt-1 text-[28px] font-semibold leading-tight">Create your account</h1>
      <p className="mt-2 text-sm text-muted">
        We&apos;ll email you a default password to sign in with.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Field label="Name" htmlFor="name">
          <Input
            id="name"
            required
            autoComplete="name"
            autoFocus
            value={form.name}
            onChange={set("name")}
            placeholder="Jane Doe"
          />
        </Field>
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={set("email")}
            placeholder="you@example.com"
          />
        </Field>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Spinner />} Create account
        </Button>
      </form>

      {(google || github) && (
        <>
          <OrDivider label="or" />
          <SocialButtons google={google} github={github} />
        </>
      )}

      <p className="mt-8 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

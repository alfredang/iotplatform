"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { apiFetch } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/misc";
import { SocialButtons, OrDivider } from "./social-buttons";

export function RegisterForm({ google, github }: { google: boolean; github: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState<"details" | "verify">("details");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | undefined>();
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
      const res = await apiFetch<{ devCode?: string }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setDevCode(res.devCode);
      setStep("verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not register");
    } finally {
      setLoading(false);
    }
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiFetch("/api/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ email: form.email, code }),
      });
      // Auto sign-in after successful verification.
      const res = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (res?.error) {
        router.push("/login");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify");
      setLoading(false);
    }
  }

  async function resend() {
    setError("");
    try {
      const res = await apiFetch<{ devCode?: string }>("/api/auth/otp/request", {
        method: "POST",
        body: JSON.stringify({ email: form.email, purpose: "verify" }),
      });
      setDevCode(res.devCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend code");
    }
  }

  if (step === "verify") {
    return (
      <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Verify your email</h1>
        <p className="mt-1 text-sm text-muted">
          We emailed a 6-digit code to <span className="font-medium text-foreground">{form.email}</span>.
        </p>

        <form onSubmit={onVerify} className="mt-6 space-y-4">
          {devCode && (
            <p className="rounded-lg bg-warning/15 p-3 text-center text-sm text-warning">
              Dev mode (no email configured) — your code is{" "}
              <span className="font-mono font-semibold">{devCode}</span>
            </p>
          )}
          <Field label="6-digit code" htmlFor="code">
            <Input
              id="code"
              inputMode="numeric"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="000000"
              className="text-center font-mono text-lg tracking-[0.4em]"
            />
          </Field>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Spinner />} Verify &amp; sign in
          </Button>
          <button
            type="button"
            onClick={resend}
            className="w-full text-center text-sm text-muted hover:underline"
          >
            Resend code
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
      <h1 className="text-xl font-semibold">Create your account</h1>
      <p className="mt-1 text-sm text-muted">Start connecting devices in minutes.</p>

      <div className="mt-6">
        <SocialButtons google={google} github={github} />
        {(google || github) && <OrDivider label="or sign up with email" />}
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Name" htmlFor="name">
          <Input id="name" required value={form.name} onChange={set("name")} placeholder="Jane Doe" />
        </Field>
        <Field label="Email" htmlFor="email">
          <Input id="email" type="email" required value={form.email} onChange={set("email")} placeholder="you@example.com" />
        </Field>
        <Field label="Password" htmlFor="password" hint="At least 8 characters.">
          <Input id="password" type="password" required value={form.password} onChange={set("password")} placeholder="••••••••" />
        </Field>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Spinner />} Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

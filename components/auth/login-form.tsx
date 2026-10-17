"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { apiFetch } from "@/lib/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/misc";
import { SocialButtons, OrDivider } from "./social-buttons";

type Method = "code" | "password";

const METHODS: { id: Method; label: string }[] = [
  { id: "code", label: "Email code" },
  { id: "password", label: "Password" },
];

export function LoginForm({ google, github }: { google: boolean; github: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/dashboard";
  const justVerified = params.get("verified") === "1";
  // Auth.js bounces failed OAuth sign-ins (e.g. a deactivated account) back here.
  const oauthError = params.get("error");

  const [method, setMethod] = useState<Method>(
    params.get("method") === "password" ? "password" : "code",
  );
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [devCode, setDevCode] = useState<string | undefined>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function switchMethod(next: Method) {
    setMethod(next);
    setError("");
  }

  function done() {
    router.push(callbackUrl);
    router.refresh();
  }

  async function onPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      if (res.code === "email_not_verified") {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }
      setError("Invalid email or password");
      return;
    }
    done();
  }

  async function requestCode(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch<{ devCode?: string }>("/api/auth/otp/request", {
        method: "POST",
        body: JSON.stringify({ email, purpose: "login" }),
      });
      setDevCode(res.devCode);
      setCode("");
      setCodeSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send code");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("otp", { email, code, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Invalid or expired code");
      return;
    }
    done();
  }

  const emailField = (
    <Field label="Email" htmlFor="email">
      <Input
        id="email"
        type="email"
        required
        autoComplete="email"
        autoFocus={!email}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
      />
    </Field>
  );

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-primary">Welcome back</p>
      <h1 className="mt-1 text-[28px] font-semibold leading-tight">Sign in to IoTFlow</h1>

      {justVerified && (
        <p className="mt-4 rounded-lg bg-success/15 p-3 text-center text-sm text-success">
          Email verified — you can sign in now.
        </p>
      )}
      {oauthError && !error && (
        <p className="mt-4 rounded-lg bg-danger/15 p-3 text-center text-sm text-danger">
          That sign-in didn&apos;t work. Try another method or contact an administrator.
        </p>
      )}

      <div
        role="tablist"
        aria-label="Sign-in method"
        className="mt-6 grid grid-cols-2 gap-1 rounded-lg border border-border bg-surface-2 p-1"
      >
        {METHODS.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={method === m.id}
            onClick={() => switchMethod(m.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              method === m.id
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted hover:text-foreground",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {method === "password" ? (
          <form onSubmit={onPasswordSubmit} className="space-y-4">
            {emailField}
            <Field label="Password" htmlFor="password">
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                autoFocus={!!email}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </Field>
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm text-muted hover:underline">
                Forgot password?
              </Link>
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Spinner />} Sign in
            </Button>
          </form>
        ) : !codeSent ? (
          <form onSubmit={requestCode} className="space-y-4">
            {emailField}
            <p className="text-sm text-muted">
              We&apos;ll email you a 6-digit one-time code — no password needed.
            </p>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Spinner />} Email me a code
            </Button>
          </form>
        ) : (
          <form onSubmit={verifyCode} className="space-y-4">
            <p className="text-sm text-muted">
              Code sent to <span className="font-medium text-foreground">{email}</span>. It
              expires in a few minutes.
            </p>
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
                autoComplete="one-time-code"
                autoFocus
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
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => {
                  setCodeSent(false);
                  setError("");
                }}
                className="text-muted hover:underline"
              >
                Use a different email
              </button>
              <button
                type="button"
                onClick={() => requestCode()}
                disabled={loading}
                className="text-primary hover:underline"
              >
                Resend code
              </button>
            </div>
          </form>
        )}
      </div>

      {(google || github) && (
        <>
          <OrDivider label="or" />
          <SocialButtons google={google} github={github} callbackUrl={callbackUrl} />
        </>
      )}

      <p className="mt-8 text-center text-sm text-muted">
        New here?{" "}
        <Link href="/register" className="text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}

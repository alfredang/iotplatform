"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/misc";

/**
 * Standalone email verification for accounts that registered but never
 * confirmed the emailed code (they are blocked from password sign-in).
 */
export function VerifyEmailForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get("email") || "");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [devCode, setDevCode] = useState<string | undefined>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendCode() {
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch<{ devCode?: string }>("/api/auth/otp/request", {
        method: "POST",
        body: JSON.stringify({ email, purpose: "verify" }),
      });
      setDevCode(res.devCode);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send code");
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
        body: JSON.stringify({ email, code }),
      });
      router.push("/login?verified=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify");
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-[28px] font-semibold leading-tight">Verify your email</h1>
      <p className="mt-1 text-sm text-muted">
        Enter your email and we&apos;ll send you a 6-digit verification code.
      </p>

      <form onSubmit={onVerify} className="mt-6 space-y-4">
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </Field>
        {sent ? (
          <>
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
              {loading && <Spinner />} Verify email
            </Button>
            <button
              type="button"
              onClick={sendCode}
              className="w-full text-center text-sm text-muted hover:underline"
            >
              Resend code
            </button>
          </>
        ) : (
          <>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="button" className="w-full" disabled={loading || !email} onClick={sendCode}>
              {loading && <Spinner />} Send verification code
            </Button>
          </>
        )}
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/login" className="text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

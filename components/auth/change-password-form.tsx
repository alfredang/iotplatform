"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { apiFetch } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/misc";

export function ChangePasswordForm({
  email,
  forced,
  needsCurrent,
}: {
  email: string;
  forced: boolean;
  needsCurrent: boolean;
}) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/api/account/password", {
        method: "POST",
        body: JSON.stringify({
          password,
          currentPassword: needsCurrent ? currentPassword : undefined,
        }),
      });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change password");
      setLoading(false);
    }
  }

  return (
    <div>
      {forced && (
        <p className="text-xs font-medium uppercase tracking-wider text-primary">One more step</p>
      )}
      <h1 className="mt-1 text-[28px] font-semibold leading-tight">
        {forced ? "Set your own password" : "Change your password"}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {forced ? (
          <>
            You signed in as <span className="font-medium text-foreground">{email}</span>{" "}with the
            default password we emailed. Choose a new one to continue.
          </>
        ) : (
          <>
            Signed in as <span className="font-medium text-foreground">{email}</span>.
          </>
        )}
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {/* Lets password managers file the new password under the right account. */}
        <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
        {needsCurrent && (
          <Field label="Current password" htmlFor="current-password">
            <Input
              id="current-password"
              type="password"
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </Field>
        )}
        <Field label="New password" htmlFor="new-password" hint="At least 8 characters.">
          <Input
            id="new-password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Field label="Confirm new password" htmlFor="confirm-password">
          <Input
            id="confirm-password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </Field>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Spinner />} {forced ? "Save and continue" : "Change password"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="hover:underline"
        >
          {forced ? "Not now — sign out" : "Sign out"}
        </button>
      </p>
    </div>
  );
}

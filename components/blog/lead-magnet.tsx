"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, ArrowRight, CheckCircle2 } from "lucide-react";
import { apiFetch } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Content-upgrade lead magnet shown at the end of every blog post. Captures a
 * name + email in exchange for the "build pack", stored as an enquiry (Admin →
 * Enquiries) and emailed to the team — then funnels to a free account.
 */
export function LeadMagnet({ title }: { title: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim()) {
      setError("Please enter your name and email.");
      return;
    }
    setBusy(true);
    try {
      await apiFetch("/api/enquiry", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          message: `Requested the build pack for the blog post: "${title}" (wiring diagram, source code + n8n workflow).`,
        }),
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="mt-10 overflow-hidden rounded-card border border-primary/30 bg-gradient-to-br from-primary/10 via-surface to-accent/10 p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Download className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-bold tracking-tight">Get the complete build pack — free</h3>
          <p className="mt-1 text-sm text-muted">
            The wiring diagram, full device source code and the ready-to-import
            <strong> n8n workflow</strong> for this project, sent to your inbox.
          </p>
        </div>
      </div>

      {done ? (
        <div className="mt-5 flex flex-col items-start gap-3 rounded-lg border border-success/30 bg-success/10 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-success">
            <CheckCircle2 className="h-4 w-4" /> You&apos;re in! We&apos;ll email your build pack shortly.
          </p>
          <p className="text-sm text-muted">Want to try it live right now?</p>
          <Link href="/register">
            <Button size="sm">Create your free account <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-5 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={busy}>
              {busy ? "Sending…" : "Email me the build pack"}
            </Button>
            <Link href="/register" className="text-sm font-medium text-primary hover:underline">
              or create a free account →
            </Link>
          </div>
          <p className="text-xs text-muted">No spam — just the pack and the occasional IoT + n8n tip. Unsubscribe anytime.</p>
        </form>
      )}
    </aside>
  );
}

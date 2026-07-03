"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { apiFetch, fetcher } from "@/lib/client";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { timeAgo } from "@/lib/utils";

type Review = { id: string; rating: number; name: string | null; comment: string | null; createdAt: string };
type Data = { reviews: Review[]; avg: number; count: number };

function Stars({ value, size = 16, onPick }: { value: number; size?: number; onPick?: (n: number) => void }) {
  return (
    <span className="inline-flex">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          onClick={onPick ? () => onPick(n) : undefined}
          style={{ width: size, height: size }}
          className={`${onPick ? "cursor-pointer" : ""} ${n <= Math.round(value) ? "fill-warning text-warning" : "text-muted"}`}
        />
      ))}
    </span>
  );
}

export function Reviews({ slug }: { slug: string }) {
  const { data, mutate } = useSWR<Data>(`/api/blog/${slug}/reviews`, fetcher);
  const [rating, setRating] = useState(0);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { if (done) { const t = setTimeout(() => setDone(false), 3000); return () => clearTimeout(t); } }, [done]);

  async function submit() {
    setError("");
    if (rating < 1) { setError("Pick a star rating"); return; }
    setSaving(true);
    try {
      await apiFetch(`/api/blog/${slug}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating, name, comment }),
      });
      setRating(0); setName(""); setComment(""); setDone(true);
      mutate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit");
    } finally {
      setSaving(false);
    }
  }

  const reviews = data?.reviews ?? [];
  const avg = data?.avg ?? 0;
  const count = data?.count ?? 0;

  return (
    <section className="mt-12 border-t border-border pt-8">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">Reviews</h2>
        {count > 0 && (
          <span className="flex items-center gap-1.5 text-sm text-muted">
            <Stars value={avg} /> {avg.toFixed(1)} · {count}
          </span>
        )}
      </div>

      {/* Submit */}
      <div className="mt-4 rounded-card border border-border bg-surface p-4">
        <p className="text-sm font-medium">Leave a review</p>
        <div className="mt-2"><Stars value={rating} size={24} onPick={setRating} /></div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Input placeholder="Your name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your thoughts (optional)…"
          className="mt-2 min-h-20 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary"
        />
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        {done && <p className="mt-2 text-sm text-success">Thanks for your review!</p>}
        <div className="mt-3">
          <Button size="sm" onClick={submit} disabled={saving}>{saving ? "Submitting…" : "Submit review"}</Button>
        </div>
      </div>

      {/* List */}
      <ul className="mt-6 space-y-4">
        {reviews.map((r) => (
          <li key={r.id} className="rounded-card border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stars value={r.rating} />
                <span className="text-sm font-medium">{r.name || "Anonymous"}</span>
              </div>
              <span className="text-xs text-muted">{timeAgo(r.createdAt)}</span>
            </div>
            {r.comment && <p className="mt-2 text-sm text-muted">{r.comment}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}

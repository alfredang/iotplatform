"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { apiFetch } from "@/lib/client";

export function LikeButton({ slug, initial }: { slug: string; initial: number }) {
  const [likes, setLikes] = useState(initial);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLiked(localStorage.getItem(`blog-like-${slug}`) === "1");
  }, [slug]);

  async function like() {
    if (liked || busy) return;
    setBusy(true);
    setLikes((n) => n + 1);
    setLiked(true);
    localStorage.setItem(`blog-like-${slug}`, "1");
    try {
      const res = await apiFetch<{ likes: number }>(`/api/blog/${slug}/like`, { method: "POST" });
      setLikes(res.likes);
    } catch {
      /* keep optimistic value */
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={like}
      disabled={liked}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
        liked ? "border-danger/40 bg-danger/10 text-danger" : "border-border text-muted hover:text-danger"
      }`}
      aria-label="Like this post"
    >
      <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} /> {likes} {likes === 1 ? "like" : "likes"}
    </button>
  );
}

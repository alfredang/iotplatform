import { prisma } from "@/lib/db/prisma";
import { slugify } from "@/lib/utils";

/** Ensure tags exist by name, returning their ids (for connect). */
export async function upsertTagsByName(names: string[]): Promise<string[]> {
  const clean = Array.from(new Set(names.map((n) => n.trim()).filter(Boolean)));
  const ids: string[] = [];
  for (const name of clean) {
    const slug = slugify(name);
    const tag = await prisma.blogTag.upsert({
      where: { slug },
      update: { name },
      create: { slug, name },
    });
    ids.push(tag.id);
  }
  return ids;
}

/** A unique slug derived from title (adds -2, -3… on collision). */
export async function uniquePostSlug(title: string, ignoreId?: string): Promise<string> {
  const base = slugify(title) || "post";
  let slug = base;
  let n = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.blogPost.findUnique({ where: { slug } });
    if (!existing || existing.id === ignoreId) return slug;
    slug = `${base}-${n++}`;
  }
}

export const postCardSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  coverImage: true,
  likes: true,
  publishedAt: true,
  featured: true,
  category: { select: { id: true, name: true, slug: true } },
  tags: { select: { id: true, name: true, slug: true } },
  author: { select: { name: true } },
} as const;

/** Average star rating + count for a post. */
export async function ratingFor(postId: string): Promise<{ avg: number; count: number }> {
  const agg = await prisma.blogReview.aggregate({
    where: { postId },
    _avg: { rating: true },
    _count: true,
  });
  return { avg: agg._avg.rating ?? 0, count: agg._count };
}

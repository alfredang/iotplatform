import Link from "next/link";
import { Heart, Tag as TagIcon } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { postCardSelect } from "@/lib/blog";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Blog — IoTFlow",
  description: "Hands-on IoT projects and n8n workflow automations with ESP32, Arduino and Raspberry Pi.",
};

export default async function BlogIndex({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; tag?: string }>;
}) {
  const { category, tag } = await searchParams;

  const [posts, categories] = await Promise.all([
    prisma.blogPost
      .findMany({
        where: {
          published: true,
          ...(category ? { category: { slug: category } } : {}),
          ...(tag ? { tags: { some: { slug: tag } } } : {}),
        },
        orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
        select: postCardSelect,
      })
      .catch(() => []),
    prisma.blogCategory
      .findMany({ orderBy: { name: "asc" }, include: { _count: { select: { posts: true } } } })
      .catch(() => []),
  ]);

  return (
    <div>
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Blog</h1>
        <p className="mt-4 text-lg text-muted">
          Hands-on IoT projects and n8n workflow automations — with ESP32, Arduino and Raspberry Pi.
        </p>
      </div>

      {/* Category filter */}
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <FilterChip href="/blog" active={!category} label="All" />
        {categories.map((c) => (
          <FilterChip key={c.id} href={`/blog?category=${c.slug}`} active={category === c.slug} label={`${c.name} (${c._count.posts})`} />
        ))}
      </div>

      {tag && (
        <p className="mt-4 text-center text-sm text-muted">
          Filtered by tag <span className="font-mono text-primary">#{tag}</span> ·{" "}
          <Link href="/blog" className="underline hover:text-foreground">clear</Link>
        </p>
      )}

      {posts.length === 0 ? (
        <p className="mt-12 text-center text-muted">No posts yet.</p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {posts.map((p) => (
            <Link
              key={p.id}
              href={`/blog/${p.slug}`}
              className="group flex flex-col overflow-hidden rounded-card border border-border bg-surface transition hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
            >
              {p.coverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.coverImage} alt={p.title} className="h-44 w-full border-b border-border bg-white object-cover" />
              )}
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center gap-2 text-xs text-muted">
                  {p.category && <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">{p.category.name}</span>}
                  <span>{new Date(p.publishedAt).toLocaleDateString()}</span>
                </div>
                <h2 className="mt-2 font-semibold leading-snug group-hover:text-primary">{p.title}</h2>
                <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted">{p.excerpt}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-muted">
                  <div className="flex flex-wrap gap-1.5">
                    {p.tags.slice(0, 3).map((t) => (
                      <span key={t.id} className="inline-flex items-center gap-0.5"><TagIcon className="h-3 w-3" />{t.name}</span>
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {p.likes}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 text-sm transition ${
        active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}

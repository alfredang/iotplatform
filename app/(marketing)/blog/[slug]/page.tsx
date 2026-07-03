import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Tag as TagIcon } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { renderMarkdown } from "@/lib/markdown";
import { LikeButton } from "@/components/blog/like-button";
import { Reviews } from "@/components/blog/reviews";
import { ShareButtons } from "@/components/blog/share-buttons";
import { LeadMagnet } from "@/components/blog/lead-magnet";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug }, select: { title: true, excerpt: true } });
  if (!post) return { title: "Blog — IoTFlow" };
  return { title: `${post.title} — IoTFlow Blog`, description: post.excerpt };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.blogPost
    .findFirst({
      where: { slug, published: true },
      include: {
        category: { select: { name: true, slug: true } },
        tags: { select: { id: true, name: true, slug: true } },
        author: { select: { name: true } },
      },
    })
    .catch(() => null);
  if (!post) notFound();

  const html = renderMarkdown(post.content);

  return (
    <article>
      <Link href="/blog" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All posts
      </Link>

      <header className="mt-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          {post.category && (
            <Link href={`/blog?category=${post.category.slug}`} className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary hover:opacity-80">
              {post.category.name}
            </Link>
          )}
          <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
          {post.author?.name && <span>· by {post.author.name}</span>}
        </div>
        <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{post.title}</h1>
        <p className="mt-3 text-lg text-muted">{post.excerpt}</p>
      </header>

      {post.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.coverImage} alt={post.title} className="mt-6 w-full rounded-card border border-border bg-white" />
      )}

      {/* Content */}
      <div className="mt-8 max-w-none" dangerouslySetInnerHTML={{ __html: html }} />

      {/* Lead magnet — content upgrade */}
      <LeadMagnet title={post.title} />

      {/* Tags + share + like */}
      <div className="mt-8 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {post.tags.map((t) => (
            <Link
              key={t.id}
              href={`/blog?tag=${t.slug}`}
              className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs text-muted hover:text-foreground"
            >
              <TagIcon className="h-3 w-3" /> {t.name}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <ShareButtons title={post.title} />
          <LikeButton slug={post.slug} initial={post.likes} />
        </div>
      </div>

      <Reviews slug={post.slug} />
    </article>
  );
}

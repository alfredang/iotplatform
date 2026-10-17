import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CodeBlock } from "@/components/ui/copy";
import { Button } from "@/components/ui/button";
import { TUTORIALS, TUTORIAL_SLUGS, getTutorial } from "@/lib/tutorials";

export function generateStaticParams() {
  return TUTORIAL_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = getTutorial(slug);
  if (!t) return { title: "Tutorial — IoTFlow" };
  return { title: `${t.title} — IoTFlow tutorials`, description: t.summary };
}

export default async function TutorialPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = getTutorial(slug);
  if (!t) notFound();

  const idx = TUTORIALS.findIndex((x) => x.slug === slug);
  const prev = idx > 0 ? TUTORIALS[idx - 1] : null;
  const next = idx < TUTORIALS.length - 1 ? TUTORIALS[idx + 1] : null;

  return (
    <article>
      <Link href="/tutorials" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All tutorials
      </Link>

      <header className="mt-4 flex items-start gap-4">
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <t.icon className="h-6 w-6" />
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-primary">Tutorial {t.num} of {TUTORIALS.length}</p>
            <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">~{t.time}</span>
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{t.title}</h1>
          <p className="mt-2 text-muted">{t.summary}</p>
        </div>
      </header>

      {t.video && (
        <figure className="mt-8">
          <video
            src={t.video.src}
            poster={t.video.poster}
            controls
            playsInline
            preload="metadata"
            className="w-full rounded-card border border-border bg-black shadow-sm"
          />
          <figcaption className="mt-2 flex flex-wrap items-center justify-center gap-x-3 text-center text-xs text-muted">
            <span>{t.video.title}</span>
            <a href={t.video.src} download className="text-primary hover:underline">
              Download video
            </a>
          </figcaption>
        </figure>
      )}

      <ol className="mt-10 space-y-10">
        {t.steps.map((s, i) => (
          <li key={i} className="relative border-l border-border pl-8">
            <span className="absolute -left-[15px] top-0 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-surface text-sm font-semibold text-primary">
              {i + 1}
            </span>
            <h2 className="text-lg font-semibold">{s.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>

            {s.code && (
              <div className="mt-3">
                <CodeBlock code={s.code} />
              </div>
            )}

            {s.image && (
              <figure className="mt-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.image}
                  alt={s.caption || s.title}
                  className="w-full rounded-card border border-border shadow-sm"
                  loading="lazy"
                />
                {s.caption && <figcaption className="mt-2 text-center text-xs text-muted">{s.caption}</figcaption>}
              </figure>
            )}
          </li>
        ))}
      </ol>

      {/* Prev / next */}
      <nav className="mt-14 flex items-center justify-between gap-4 border-t border-border pt-6">
        {prev ? (
          <Link href={`/tutorials/${prev.slug}`} className="group min-w-0">
            <p className="text-xs text-muted">Previous</p>
            <p className="flex items-center gap-1 truncate font-medium group-hover:text-primary">
              <ArrowLeft className="h-4 w-4 shrink-0" /> {prev.title}
            </p>
          </Link>
        ) : <span />}
        {next ? (
          <Link href={`/tutorials/${next.slug}`} className="group min-w-0 text-right">
            <p className="text-xs text-muted">Next</p>
            <p className="flex items-center justify-end gap-1 truncate font-medium group-hover:text-primary">
              {next.title} <ArrowRight className="h-4 w-4 shrink-0" />
            </p>
          </Link>
        ) : (
          <Link href="/register">
            <Button>Get started free <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        )}
      </nav>
    </article>
  );
}

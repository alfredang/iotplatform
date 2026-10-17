import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TUTORIALS } from "@/lib/tutorials";

export const metadata = {
  title: "Tutorials — IoTFlow",
  description: "Seven step-by-step tutorials to go from zero to a live, automated IoT dashboard with IoTFlow.",
};

export default function TutorialsIndex() {
  return (
    <div>
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Tutorials</h1>
        <p className="mt-4 text-lg text-muted">
          Seven short, step-by-step guides — with screenshots — that take you from zero to a
          live, automated IoT dashboard.
        </p>
      </div>

      <div className="mt-12 space-y-4">
        {TUTORIALS.map((t) => (
          <Link
            key={t.slug}
            href={`/tutorials/${t.slug}`}
            className="group flex items-center gap-5 rounded-card border border-border bg-surface p-5 transition hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
          >
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <t.icon className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold">
                  <span className="text-primary">{t.num}.</span> {t.title}
                </h2>
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">~{t.time}</span>
              </div>
              <p className="mt-1 text-sm text-muted">{t.summary}</p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-primary" />
          </Link>
        ))}
      </div>
    </div>
  );
}

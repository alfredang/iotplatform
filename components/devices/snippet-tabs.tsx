"use client";

import { useState } from "react";
import type { Snippet } from "@/lib/sample-code";
import { CodeBlock } from "@/components/ui/copy";
import { cn } from "@/lib/utils";

export function SnippetTabs({ snippets }: { snippets: Snippet[] }) {
  const [active, setActive] = useState(snippets[0]?.id);
  const current = snippets.find((s) => s.id === active) ?? snippets[0];
  if (!current) return null;
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {snippets.map((s) => (
          <button
            key={s.id}
            onClick={() => setActive(s.id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition",
              s.id === current.id
                ? "bg-primary/10 text-primary"
                : "bg-surface-2 text-muted hover:text-foreground",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
      <CodeBlock code={current.code} />
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, FolderKanban, Plus } from "lucide-react";
import { useProject } from "@/components/project/project-context";
import { cn } from "@/lib/utils";

export function ProjectSwitcher({ onNavigate }: { onNavigate?: () => void }) {
  const { projects, projectId, setProject } = useProject();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const current = projects.find((p) => p.id === projectId) ?? projects[0];

  return (
    <div className="relative px-3 py-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-left text-sm hover:bg-border"
      >
        <FolderKanban className="h-4 w-4 shrink-0 text-primary" />
        <span className="min-w-0 flex-1 truncate font-medium">
          {current?.name ?? "Select project"}
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-3 right-3 z-20 mt-1 overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
            <ul className="max-h-64 overflow-y-auto py-1">
              {projects.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => {
                      setProject(p.id);
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-2"
                  >
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0",
                        p.id === projectId ? "text-primary" : "opacity-0",
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate">{p.name}</span>
                    {p._count && <span className="text-xs text-muted">{p._count.devices}</span>}
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={() => {
                setOpen(false);
                onNavigate?.();
                router.push("/projects");
              }}
              className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-left text-sm text-primary hover:bg-surface-2"
            >
              <Plus className="h-4 w-4" /> Manage projects
            </button>
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { createContext, useCallback, useContext } from "react";
import { useRouter } from "next/navigation";
import { PROJECT_COOKIE } from "@/lib/constants";

export type ProjectSummary = {
  id: string;
  name: string;
  description?: string | null;
  _count?: { devices: number };
};

type ProjectContextValue = {
  projectId: string;
  projects: ProjectSummary[];
  setProject: (id: string) => void;
  refresh: () => void;
};

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({
  projects,
  currentProjectId,
  children,
}: {
  projects: ProjectSummary[];
  currentProjectId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  const setProject = useCallback(
    (id: string) => {
      // Persist the choice (read server-side via the cookie) and re-render.
      document.cookie = `${PROJECT_COOKIE}=${id};path=/;max-age=31536000;samesite=lax`;
      router.refresh();
    },
    [router],
  );

  return (
    <ProjectContext.Provider
      value={{ projectId: currentProjectId, projects, setProject, refresh: () => router.refresh() }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used within ProjectProvider");
  return ctx;
}

/** Append the current projectId to an API path for project-scoped SWR keys. */
export function withProject(path: string, projectId: string): string {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}projectId=${encodeURIComponent(projectId)}`;
}

import type { ReactNode } from "react";
import { requireSession } from "@/lib/auth/rbac";
import { getViewAs, effectiveRole } from "@/lib/auth/view";
import { listProjects, resolveProject } from "@/lib/projects";
import { AppShell } from "@/components/layout/app-shell";
import { ProjectProvider } from "@/components/project/project-context";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireSession();
  const viewAs = await getViewAs();
  const role = session.user.role;
  const effRole = effectiveRole(role, viewAs);

  const [projects, current] = await Promise.all([
    listProjects(session.user.id),
    resolveProject(session.user.id),
  ]);

  return (
    <ProjectProvider projects={projects} currentProjectId={current.id}>
      <AppShell
        user={{ name: session.user.name, email: session.user.email }}
        realRole={role}
        effectiveRole={effRole}
        viewAs={viewAs}
      >
        {children}
      </AppShell>
    </ProjectProvider>
  );
}

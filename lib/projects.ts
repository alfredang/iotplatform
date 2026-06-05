import { cookies } from "next/headers";
import type { Project } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { AuthError } from "@/lib/auth/rbac";
import { PROJECT_COOKIE } from "@/lib/constants";

export { PROJECT_COOKIE };

/** Ensure the user has at least one project, returning a fallback default. */
export async function getOrCreateDefaultProject(ownerId: string): Promise<Project> {
  const existing = await prisma.project.findFirst({
    where: { ownerId },
    orderBy: { createdAt: "asc" },
  });
  if (existing) return existing;
  return prisma.project.create({
    data: { ownerId, name: "My Project", description: "Default project" },
  });
}

/** Validate that a project id belongs to the user. Throws 404 otherwise. */
export async function requireProject(ownerId: string, projectId: string): Promise<Project> {
  const project = await prisma.project.findFirst({ where: { id: projectId, ownerId } });
  if (!project) throw new AuthError("Project not found", 404);
  return project;
}

/**
 * Resolve the "current" project for a request: prefer an explicit id (query
 * param), else the cookie, else the user's default project (created if none).
 * Always verifies ownership.
 */
export async function resolveProject(
  ownerId: string,
  explicitId?: string | null,
): Promise<Project> {
  if (explicitId) {
    const owned = await prisma.project.findFirst({ where: { id: explicitId, ownerId } });
    if (owned) return owned;
  }
  const store = await cookies();
  const cookieId = store.get(PROJECT_COOKIE)?.value;
  if (cookieId) {
    const owned = await prisma.project.findFirst({ where: { id: cookieId, ownerId } });
    if (owned) return owned;
  }
  return getOrCreateDefaultProject(ownerId);
}

/** List a user's projects (for the switcher). */
export async function listProjects(ownerId: string) {
  return prisma.project.findMany({
    where: { ownerId },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { devices: true } } },
  });
}

import { prisma } from "@/lib/db/prisma";

/**
 * Returns the default dashboard for a project, creating an empty one if needed.
 */
export async function getOrCreateDefaultDashboard(ownerId: string, projectId: string) {
  const existing = await prisma.dashboard.findFirst({
    where: { ownerId, projectId, isDefault: true },
  });
  if (existing) return existing;

  const any = await prisma.dashboard.findFirst({ where: { ownerId, projectId } });
  if (any) {
    return prisma.dashboard.update({ where: { id: any.id }, data: { isDefault: true } });
  }
  return prisma.dashboard.create({
    data: { ownerId, projectId, name: "Overview", isDefault: true },
  });
}

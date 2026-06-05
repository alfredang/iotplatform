import { prisma } from "@/lib/db/prisma";

/** Returns the user's default dashboard, creating an empty one if needed. */
export async function getOrCreateDefaultDashboard(ownerId: string) {
  const existing = await prisma.dashboard.findFirst({
    where: { ownerId, isDefault: true },
  });
  if (existing) return existing;

  // Promote any dashboard to default, or create a fresh one.
  const any = await prisma.dashboard.findFirst({ where: { ownerId } });
  if (any) {
    return prisma.dashboard.update({
      where: { id: any.id },
      data: { isDefault: true },
    });
  }
  return prisma.dashboard.create({
    data: { ownerId, name: "Overview", isDefault: true },
  });
}

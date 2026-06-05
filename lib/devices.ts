import { prisma } from "@/lib/db/prisma";
import { AuthError } from "@/lib/auth/rbac";

/**
 * Fetch a device by its internal id, ensuring it belongs to the given owner.
 * Throws AuthError(404) when not found / not owned.
 */
export async function getOwnedDevice(id: string, ownerId: string) {
  const device = await prisma.device.findFirst({ where: { id, ownerId } });
  if (!device) throw new AuthError("Device not found", 404);
  return device;
}

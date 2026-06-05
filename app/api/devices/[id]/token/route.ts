import { prisma } from "@/lib/db/prisma";
import { requireApiUser } from "@/lib/auth/rbac";
import { getOwnedDevice } from "@/lib/devices";
import { handleApiError } from "@/lib/api";
import { generateDeviceToken } from "@/lib/tokens";

type Ctx = { params: Promise<{ id: string }> };

/** POST: revoke existing tokens and issue a fresh device token (shown once). */
export async function POST(_req: Request, { params }: Ctx) {
  try {
    const user = await requireApiUser("USER");
    const { id } = await params;
    await getOwnedDevice(id, user.id);

    await prisma.deviceToken.updateMany({
      where: { deviceId: id, revoked: false },
      data: { revoked: true },
    });

    const token = generateDeviceToken();
    await prisma.deviceToken.create({
      data: { deviceId: id, tokenHash: token.hash, prefix: token.prefix },
    });

    return Response.json({ token: token.token }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

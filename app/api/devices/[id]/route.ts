import { prisma } from "@/lib/db/prisma";
import { requireApiUser } from "@/lib/auth/rbac";
import { getOwnedDevice } from "@/lib/devices";
import { deviceUpdateSchema } from "@/lib/validation";
import { handleApiError, parseBody } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const user = await requireApiUser();
    const { id } = await params;
    await getOwnedDevice(id, user.id);

    const device = await prisma.device.findUnique({
      where: { id },
      include: {
        tokens: {
          where: { revoked: false },
          select: { id: true, prefix: true, lastUsed: true, createdAt: true },
        },
        alertRules: true,
        alerts: { where: { status: "ACTIVE" } },
        _count: { select: { telemetry: true } },
      },
    });
    return Response.json({ device });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: Request, { params }: Ctx) {
  try {
    const user = await requireApiUser("USER");
    const { id } = await params;
    await getOwnedDevice(id, user.id);
    const data = await parseBody(req, deviceUpdateSchema);

    const device = await prisma.device.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.location !== undefined ? { location: data.location || null } : {}),
        ...(data.latitude !== undefined ? { latitude: data.latitude } : {}),
        ...(data.longitude !== undefined ? { longitude: data.longitude } : {}),
        ...(data.protocol !== undefined ? { protocol: data.protocol } : {}),
      },
    });
    return Response.json({ device });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const user = await requireApiUser("USER");
    const { id } = await params;
    await getOwnedDevice(id, user.id);
    await prisma.device.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}

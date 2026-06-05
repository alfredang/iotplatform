import { prisma } from "@/lib/db/prisma";
import { requireApiUser } from "@/lib/auth/rbac";
import { deviceCreateSchema } from "@/lib/validation";
import { handleApiError, parseBody } from "@/lib/api";
import { generateDeviceToken } from "@/lib/tokens";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function GET() {
  try {
    const user = await requireApiUser("VIEWER");
    const devices = await prisma.device.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { telemetry: true } },
        alerts: { where: { status: "ACTIVE" }, select: { id: true } },
      },
    });
    return Response.json({ devices });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireApiUser("USER");
    const data = await parseBody(req, deviceCreateSchema);

    let deviceId = data.deviceId || slugify(data.name) || "device";
    // Ensure uniqueness by suffixing if needed.
    let suffix = 0;
    while (await prisma.device.findUnique({ where: { deviceId } })) {
      suffix += 1;
      deviceId = `${data.deviceId || slugify(data.name)}-${suffix}`;
    }

    const token = generateDeviceToken();
    const device = await prisma.device.create({
      data: {
        name: data.name,
        type: data.type || "Generic",
        deviceId,
        location: data.location || null,
        latitude: data.latitude,
        longitude: data.longitude,
        protocol: data.protocol,
        ownerId: user.id,
        tokens: {
          create: { tokenHash: token.hash, prefix: token.prefix },
        },
      },
    });

    // Return the raw token once — it can't be retrieved again.
    return Response.json({ device, token: token.token }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

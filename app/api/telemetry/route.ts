import { prisma } from "@/lib/db/prisma";
import {
  ingestForDevice,
  resolveApiKey,
  resolveDeviceForApiKey,
  resolveDeviceToken,
} from "@/lib/telemetry/ingest";
import { handleApiError } from "@/lib/api";
import { requireApiUser } from "@/lib/auth/rbac";

export const dynamic = "force-dynamic";

function bearer(req: Request): string | null {
  const h = req.headers.get("authorization") || "";
  if (h.toLowerCase().startsWith("bearer ")) return h.slice(7).trim();
  return req.headers.get("x-device-token") || req.headers.get("x-api-key");
}

/**
 * POST /api/telemetry
 * Auth: `Authorization: Bearer <token>` where token is either a device token
 * (dev_...) or an account API key (iot_...). With an API key, include the
 * public `deviceId` in the body.
 *
 * Body: any JSON of metric readings, e.g. { "temperature": 28.5, "humidity": 65 }
 * (with an API key, also include "deviceId").
 */
export async function POST(req: Request) {
  try {
    const token = bearer(req);
    if (!token) {
      return Response.json({ error: "Missing bearer token" }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    let device = null;

    if (token.startsWith("dev_")) {
      device = await resolveDeviceToken(token);
    } else if (token.startsWith("iot_")) {
      const ownerId = await resolveApiKey(token);
      const publicId = typeof body.deviceId === "string" ? body.deviceId : null;
      if (!ownerId || !publicId) {
        return Response.json(
          { error: "Invalid API key or missing deviceId in body" },
          { status: 401 },
        );
      }
      device = await resolveDeviceForApiKey(ownerId, publicId);
    } else {
      // Unknown prefix — try as device token then api key for convenience.
      device = await resolveDeviceToken(token);
    }

    if (!device) {
      return Response.json({ error: "Unauthorized device" }, { status: 401 });
    }

    // Don't treat the routing field as a metric.
    const { deviceId: _omit, token: _omit2, ...payload } = body;
    const result = await ingestForDevice(device, payload);
    return Response.json({ ok: true, ...result }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * GET /api/telemetry — recent telemetry for the signed-in user's devices.
 * Query: ?deviceId=<public>&metric=<m>&limit=<n>
 */
export async function GET(req: Request) {
  try {
    const user = await requireApiUser("VIEWER");
    const url = new URL(req.url);
    const publicId = url.searchParams.get("deviceId");
    const metric = url.searchParams.get("metric");
    const limit = Math.min(Number(url.searchParams.get("limit") || 100), 1000);

    const deviceFilter = await prisma.device.findMany({
      where: { ownerId: user.id, ...(publicId ? { deviceId: publicId } : {}) },
      select: { id: true },
    });

    const rows = await prisma.telemetry.findMany({
      where: {
        deviceId: { in: deviceFilter.map((d) => d.id) },
        ...(metric ? { metric } : {}),
      },
      orderBy: { ts: "desc" },
      take: limit,
      include: { device: { select: { name: true, deviceId: true } } },
    });

    return Response.json({ telemetry: rows });
  } catch (err) {
    return handleApiError(err);
  }
}

import { prisma } from "@/lib/db/prisma";
import { requireApiUser, AuthError } from "@/lib/auth/rbac";
import { getOwnedDevice } from "@/lib/devices";
import { handleApiError } from "@/lib/api";
import { setCommand, getPinStates } from "@/lib/commands";
import { resolveApiKey } from "@/lib/telemetry/ingest";
import { commandSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Authenticate the caller as the device owner, either via:
 *  - a dashboard session (Auth.js), or
 *  - an account API key (`Authorization: Bearer iot_...`) — used by n8n flows.
 * Returns the owner id.
 */
async function resolveOwner(req: Request): Promise<string> {
  const h = req.headers.get("authorization") || "";
  const key = h.toLowerCase().startsWith("bearer ")
    ? h.slice(7).trim()
    : req.headers.get("x-api-key");
  if (key && key.startsWith("iot_")) {
    const ownerId = await resolveApiKey(key);
    if (!ownerId) throw new AuthError("Invalid API key", 401);
    return ownerId;
  }
  const user = await requireApiUser("USER");
  return user.id;
}

/** GET /api/devices/:id/command — current virtual-pin states for the device. */
export async function GET(req: Request, { params }: Ctx) {
  try {
    const ownerId = await resolveOwner(req);
    const { id } = await params;
    await getOwnedDevice(id, ownerId);
    const state = await getPinStates(id);
    return Response.json({ state });
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * POST /api/devices/:id/command — set a virtual-pin value (downlink control).
 * Body: { "pin": "V1", "value": 1 }  or  { "pin": "msg", "strValue": "hello" }
 * Persists, publishes to MQTT `devices/<id>/down`, and fires the COMMAND event.
 */
export async function POST(req: Request, { params }: Ctx) {
  try {
    const ownerId = await resolveOwner(req);
    const { id } = await params;
    const device = await getOwnedDevice(id, ownerId);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new AuthError("Invalid JSON body", 400);
    }
    const data = commandSchema.parse(body);

    const command = await setCommand(
      device,
      data.pin,
      data.value ?? null,
      data.strValue ?? null,
    );
    return Response.json({ ok: true, command }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

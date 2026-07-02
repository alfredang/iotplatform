import { handleApiError } from "@/lib/api";
import { resolveDeviceToken } from "@/lib/telemetry/ingest";
import { getPinStates } from "@/lib/commands";

export const dynamic = "force-dynamic";

function bearer(req: Request): string | null {
  const h = req.headers.get("authorization") || "";
  if (h.toLowerCase().startsWith("bearer ")) return h.slice(7).trim();
  return req.headers.get("x-device-token");
}

/**
 * GET /api/device/state
 * Device-facing endpoint for HTTP-only devices to poll their virtual-pin
 * states (the downlink equivalent of subscribing to MQTT `devices/<id>/down`).
 *
 * Auth: `Authorization: Bearer dev_...` (device token).
 * Response: { "state": { "V1": 1, "relay": 0 } }
 */
export async function GET(req: Request) {
  try {
    const token = bearer(req);
    if (!token) {
      return Response.json({ error: "Missing device token" }, { status: 401 });
    }
    const device = await resolveDeviceToken(token);
    if (!device) {
      return Response.json({ error: "Unauthorized device" }, { status: 401 });
    }
    const state = await getPinStates(device.id);
    return Response.json({ state });
  } catch (err) {
    return handleApiError(err);
  }
}

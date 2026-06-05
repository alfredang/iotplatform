/** A single flattened numeric reading extracted from a telemetry payload. */
export type Reading = { metric: string; value: number };

export type NormalizedPayload = {
  readings: Reading[];
  latitude?: number;
  longitude?: number;
};

const LAT_KEYS = ["lat", "latitude"];
const LNG_KEYS = ["lng", "lon", "long", "longitude"];

/**
 * Turn an arbitrary JSON telemetry payload into a flat list of numeric metric
 * readings, plus extracted GPS coordinates. Handles:
 *   { temperature: 28.5, humidity: 65 }
 *   { temp: 22, gps: { lat: 1.3, lng: 103.8 } }
 *   { location: [lat, lng] }
 * Non-numeric, non-GPS values are ignored for charting (the full raw payload is
 * still stored separately).
 */
export function normalizePayload(input: unknown): NormalizedPayload {
  const readings: Reading[] = [];
  let latitude: number | undefined;
  let longitude: number | undefined;

  if (!input || typeof input !== "object") return { readings };

  const obj = input as Record<string, unknown>;

  const consumeGps = (key: string, value: number) => {
    const k = key.toLowerCase();
    if (LAT_KEYS.includes(k)) latitude = value;
    else if (LNG_KEYS.includes(k)) longitude = value;
    else return false;
    return true;
  };

  for (const [key, raw] of Object.entries(obj)) {
    // Nested GPS object: { gps: { lat, lng } } or { location: { lat, lng } }
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      for (const [k2, v2] of Object.entries(raw as Record<string, unknown>)) {
        if (typeof v2 === "number") consumeGps(k2, v2);
      }
      continue;
    }
    // location as [lat, lng]
    if (Array.isArray(raw) && raw.length === 2 && raw.every((n) => typeof n === "number")) {
      const k = key.toLowerCase();
      if (k.includes("location") || k.includes("coord") || k.includes("gps")) {
        latitude = raw[0] as number;
        longitude = raw[1] as number;
        continue;
      }
    }
    if (typeof raw === "number" && Number.isFinite(raw)) {
      if (consumeGps(key, raw)) {
        readings.push({ metric: key.toLowerCase(), value: raw });
      } else {
        readings.push({ metric: key, value: raw });
      }
      continue;
    }
    if (typeof raw === "boolean") {
      readings.push({ metric: key, value: raw ? 1 : 0 });
    }
  }

  return { readings, latitude, longitude };
}

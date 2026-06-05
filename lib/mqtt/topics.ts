/**
 * MQTT topic conventions for the platform.
 *
 * Devices publish telemetry to:  devices/<deviceId>/telemetry
 * The JSON payload contains the readings plus the device token, e.g.
 *   { "token": "dev_xxx", "temperature": 28.5, "humidity": 65 }
 *
 * The worker subscribes to the wildcard form and authenticates each message
 * by the embedded token.
 */
export const TELEMETRY_TOPIC_WILDCARD = "devices/+/telemetry";

export function telemetryTopic(deviceId: string): string {
  return `devices/${deviceId}/telemetry`;
}

/** Extract the public deviceId segment from a telemetry topic. */
export function deviceIdFromTopic(topic: string): string | null {
  const m = topic.match(/^devices\/([^/]+)\/telemetry$/);
  return m ? m[1] : null;
}

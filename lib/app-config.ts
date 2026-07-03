import { prisma } from "@/lib/db/prisma";

/**
 * Resolve integration settings from the admin-managed AppConfig row, falling
 * back to environment variables. The Admin → Settings page writes AppConfig so
 * admins can configure n8n and MQTT without editing .env.
 */

async function row() {
  return prisma.appConfig.findUnique({ where: { id: 1 } }).catch(() => null);
}

export type N8nConfig = { baseUrl: string; apiKey: string };

export async function getN8nConfig(): Promise<N8nConfig> {
  const cfg = await row();
  return {
    baseUrl: (cfg?.n8nBaseUrl || process.env.N8N_BASE_URL || "").replace(/\/$/, ""),
    apiKey: cfg?.n8nApiKey || process.env.N8N_API_KEY || "",
  };
}

export type MqttConfig = {
  brokerUrl: string;
  username?: string;
  password?: string;
  publicHost: string;
};

export async function getMqttConfig(): Promise<MqttConfig> {
  const cfg = await row();
  return {
    brokerUrl: cfg?.mqttBrokerUrl || process.env.MQTT_BROKER_URL || "mqtt://localhost:1883",
    username: cfg?.mqttUsername || process.env.MQTT_USERNAME || undefined,
    password: cfg?.mqttPassword || process.env.MQTT_PASSWORD || undefined,
    publicHost: cfg?.mqttPublicHost || process.env.NEXT_PUBLIC_MQTT_HOST || "localhost:1883",
  };
}

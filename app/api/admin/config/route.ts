import { prisma } from "@/lib/db/prisma";
import { requireAdminApi } from "@/lib/auth/rbac";
import { bustOAuthCache } from "@/lib/auth/auth";
import { handleApiError, parseBody } from "@/lib/api";
import { z } from "zod";

export const dynamic = "force-dynamic";

const configSchema = z.object({
  smtpHost: z.string().trim().max(200).optional().or(z.literal("")),
  smtpPort: z.coerce.number().int().min(1).max(65535).optional(),
  smtpUser: z.string().trim().max(200).optional().or(z.literal("")),
  // Only update the password when a non-empty value is provided.
  smtpPassword: z.string().max(400).optional(),
  smtpFrom: z.string().trim().max(200).optional().or(z.literal("")),
  alertEmail: z.string().trim().max(200).optional().or(z.literal("")),
  emailAlertsEnabled: z.boolean().optional(),
  // Gmail OAuth2 (secret + refresh token are write-only; blank keeps current)
  gmailUser: z.string().trim().max(200).optional().or(z.literal("")),
  gmailClientId: z.string().trim().max(300).optional().or(z.literal("")),
  gmailClientSecret: z.string().max(400).optional(),
  gmailRefreshToken: z.string().max(600).optional(),
  // Service-account JSON key (write-only; blank keeps current). Must be the
  // full key file so we can extract client_id + private_key at send time.
  gmailServiceAccountJson: z
    .string()
    .max(10_000)
    .optional()
    .refine(
      (v) => {
        if (!v) return true;
        try {
          const key = JSON.parse(v) as { client_id?: string; private_key?: string };
          return Boolean(key.client_id && key.private_key);
        } catch {
          return false;
        }
      },
      { message: "Must be a service-account JSON key with client_id and private_key" },
    ),
  // "Sign in with Google" (secret is write-only; blank keeps current)
  googleClientId: z.string().trim().max(300).optional().or(z.literal("")),
  googleClientSecret: z.string().max(400).optional(),
  // n8n
  n8nBaseUrl: z.string().trim().max(300).optional().or(z.literal("")),
  n8nApiKey: z.string().max(2000).optional(), // write-only; blank keeps current
  // MQTT
  mqttBrokerUrl: z.string().trim().max(300).optional().or(z.literal("")),
  mqttUsername: z.string().trim().max(200).optional().or(z.literal("")),
  mqttPassword: z.string().max(400).optional(), // write-only; blank keeps current
  mqttPublicHost: z.string().trim().max(200).optional().or(z.literal("")),
});

async function getConfig() {
  return prisma.appConfig.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
}

/** GET /api/admin/config — current email/SMTP settings (password masked). */
export async function GET() {
  try {
    await requireAdminApi();
    const cfg = await getConfig();
    return Response.json({
      config: {
        smtpHost: cfg.smtpHost ?? "",
        smtpPort: cfg.smtpPort,
        smtpUser: cfg.smtpUser ?? "",
        smtpFrom: cfg.smtpFrom ?? "",
        alertEmail: cfg.alertEmail ?? "",
        emailAlertsEnabled: cfg.emailAlertsEnabled,
        hasPassword: Boolean(cfg.smtpPassword),
        // Gmail OAuth2
        gmailUser: cfg.gmailUser ?? "",
        gmailClientId: cfg.gmailClientId ?? "",
        hasGmailClientSecret: Boolean(cfg.gmailClientSecret),
        hasGmailRefreshToken: Boolean(cfg.gmailRefreshToken),
        hasGmailServiceAccount: Boolean(cfg.gmailServiceAccountJson),
        // Google sign-in
        googleClientId: cfg.googleClientId ?? "",
        hasGoogleClientSecret: Boolean(cfg.googleClientSecret),
        // n8n
        n8nBaseUrl: cfg.n8nBaseUrl ?? "",
        hasN8nApiKey: Boolean(cfg.n8nApiKey),
        // MQTT
        mqttBrokerUrl: cfg.mqttBrokerUrl ?? "",
        mqttUsername: cfg.mqttUsername ?? "",
        mqttPublicHost: cfg.mqttPublicHost ?? "",
        hasMqttPassword: Boolean(cfg.mqttPassword),
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

/** PUT /api/admin/config — update email/SMTP settings (admin only). */
export async function PUT(req: Request) {
  try {
    await requireAdminApi();
    const data = await parseBody(req, configSchema);
    await getConfig();

    const config = await prisma.appConfig.update({
      where: { id: 1 },
      data: {
        ...(data.smtpHost !== undefined ? { smtpHost: data.smtpHost || null } : {}),
        ...(data.smtpPort !== undefined ? { smtpPort: data.smtpPort } : {}),
        ...(data.smtpUser !== undefined ? { smtpUser: data.smtpUser || null } : {}),
        ...(data.smtpPassword ? { smtpPassword: data.smtpPassword } : {}),
        ...(data.smtpFrom !== undefined ? { smtpFrom: data.smtpFrom || null } : {}),
        ...(data.alertEmail !== undefined ? { alertEmail: data.alertEmail || null } : {}),
        ...(data.emailAlertsEnabled !== undefined
          ? { emailAlertsEnabled: data.emailAlertsEnabled }
          : {}),
        // Gmail OAuth2
        ...(data.gmailUser !== undefined ? { gmailUser: data.gmailUser || null } : {}),
        ...(data.gmailClientId !== undefined ? { gmailClientId: data.gmailClientId || null } : {}),
        ...(data.gmailClientSecret ? { gmailClientSecret: data.gmailClientSecret } : {}),
        ...(data.gmailRefreshToken ? { gmailRefreshToken: data.gmailRefreshToken } : {}),
        ...(data.gmailServiceAccountJson
          ? { gmailServiceAccountJson: data.gmailServiceAccountJson }
          : {}),
        // Google sign-in
        ...(data.googleClientId !== undefined
          ? { googleClientId: data.googleClientId || null }
          : {}),
        ...(data.googleClientSecret ? { googleClientSecret: data.googleClientSecret } : {}),
        // n8n
        ...(data.n8nBaseUrl !== undefined ? { n8nBaseUrl: data.n8nBaseUrl || null } : {}),
        ...(data.n8nApiKey ? { n8nApiKey: data.n8nApiKey } : {}),
        // MQTT
        ...(data.mqttBrokerUrl !== undefined ? { mqttBrokerUrl: data.mqttBrokerUrl || null } : {}),
        ...(data.mqttUsername !== undefined ? { mqttUsername: data.mqttUsername || null } : {}),
        ...(data.mqttPassword ? { mqttPassword: data.mqttPassword } : {}),
        ...(data.mqttPublicHost !== undefined ? { mqttPublicHost: data.mqttPublicHost || null } : {}),
      },
    });
    bustOAuthCache(); // pick up new sign-in credentials immediately
    return Response.json({ ok: true, emailAlertsEnabled: config.emailAlertsEnabled });
  } catch (err) {
    return handleApiError(err);
  }
}

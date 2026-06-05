import { prisma } from "@/lib/db/prisma";
import { requireAdminApi } from "@/lib/auth/rbac";
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
      },
    });
    return Response.json({ ok: true, emailAlertsEnabled: config.emailAlertsEnabled });
  } catch (err) {
    return handleApiError(err);
  }
}

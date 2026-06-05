import nodemailer from "nodemailer";
import { prisma } from "@/lib/db/prisma";

type MailConfig = {
  host?: string | null;
  port: number;
  user?: string | null;
  pass?: string | null;
  from: string;
  alertEmail?: string | null;
  emailAlertsEnabled: boolean;
};

/**
 * Resolve mail settings from the admin-managed AppConfig row, falling back to
 * environment variables. AppConfig (set in the Admin → Email settings page)
 * takes precedence so admins can configure email without editing .env.
 */
export async function getMailConfig(): Promise<MailConfig> {
  const cfg = await prisma.appConfig.findUnique({ where: { id: 1 } }).catch(() => null);
  return {
    host: cfg?.smtpHost || process.env.SMTP_HOST || null,
    port: cfg?.smtpPort || Number(process.env.SMTP_PORT || 587),
    user: cfg?.smtpUser || process.env.SMTP_USER || null,
    pass: cfg?.smtpPassword || process.env.SMTP_PASSWORD || null,
    from: cfg?.smtpFrom || process.env.SMTP_FROM || "IoT Platform <no-reply@iotplatform.local>",
    alertEmail: cfg?.alertEmail || null,
    emailAlertsEnabled: cfg?.emailAlertsEnabled ?? false,
  };
}

/**
 * Sends transactional email via SMTP when configured. When SMTP is NOT
 * configured (no host), the message is logged to the server console so local
 * development still works without an email provider.
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<{ delivered: boolean }> {
  const cfg = await getMailConfig();

  if (!cfg.host) {
    // eslint-disable-next-line no-console
    console.log(
      `\n[email:console-fallback] To: ${opts.to}\nSubject: ${opts.subject}\n${opts.text}\n`,
    );
    return { delivered: false };
  }

  const transport = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: cfg.user ? { user: cfg.user, pass: cfg.pass ?? undefined } : undefined,
  });

  await transport.sendMail({
    from: cfg.from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html ?? `<pre style="font-family:sans-serif">${opts.text}</pre>`,
  });
  return { delivered: true };
}

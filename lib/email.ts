import nodemailer from "nodemailer";
import { prisma } from "@/lib/db/prisma";

type GmailConfig = {
  user: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
};

type MailConfig = {
  gmail?: GmailConfig | null;
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
 * environment variables. AppConfig (set in the Admin → Settings page) takes
 * precedence so admins can configure email without editing .env.
 */
export async function getMailConfig(): Promise<MailConfig> {
  const cfg = await prisma.appConfig.findUnique({ where: { id: 1 } }).catch(() => null);

  const gmailUser = cfg?.gmailUser || process.env.GMAIL_USER || null;
  const gmailClientId =
    cfg?.gmailClientId || process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || null;
  const gmailClientSecret =
    cfg?.gmailClientSecret ||
    process.env.GMAIL_CLIENT_SECRET ||
    process.env.GOOGLE_CLIENT_SECRET ||
    null;
  const gmailRefreshToken = cfg?.gmailRefreshToken || process.env.GMAIL_REFRESH_TOKEN || null;

  const gmail =
    gmailUser && gmailClientId && gmailClientSecret && gmailRefreshToken
      ? {
          user: gmailUser,
          clientId: gmailClientId,
          clientSecret: gmailClientSecret,
          refreshToken: gmailRefreshToken,
        }
      : null;

  return {
    gmail,
    host: cfg?.smtpHost || process.env.SMTP_HOST || null,
    port: cfg?.smtpPort || Number(process.env.SMTP_PORT || 587),
    user: cfg?.smtpUser || process.env.SMTP_USER || null,
    pass: cfg?.smtpPassword || process.env.SMTP_PASSWORD || null,
    from:
      cfg?.smtpFrom ||
      process.env.SMTP_FROM ||
      (gmailUser ? `IoTFlow <${gmailUser}>` : "IoT Platform <no-reply@iotplatform.local>"),
    alertEmail: cfg?.alertEmail || null,
    emailAlertsEnabled: cfg?.emailAlertsEnabled ?? false,
  };
}

/**
 * Sends transactional email. Transport preference:
 *   1. Gmail OAuth2 (XOAUTH2) when fully configured
 *   2. Plain SMTP when a host is set
 *   3. Console fallback (logged, not delivered) so local dev works without
 *      an email provider.
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<{ delivered: boolean }> {
  const cfg = await getMailConfig();

  let transport: nodemailer.Transporter;
  if (cfg.gmail) {
    transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: cfg.gmail.user,
        clientId: cfg.gmail.clientId,
        clientSecret: cfg.gmail.clientSecret,
        refreshToken: cfg.gmail.refreshToken,
      },
    });
  } else if (cfg.host) {
    transport = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.port === 465,
      auth: cfg.user ? { user: cfg.user, pass: cfg.pass ?? undefined } : undefined,
    });
  } else {
    // eslint-disable-next-line no-console
    console.log(
      `\n[email:console-fallback] To: ${opts.to}\nSubject: ${opts.subject}\n${opts.text}\n`,
    );
    return { delivered: false };
  }

  await transport.sendMail({
    from: cfg.from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html ?? `<pre style="font-family:sans-serif">${opts.text}</pre>`,
  });
  return { delivered: true };
}

import nodemailer from "nodemailer";
import { prisma } from "@/lib/db/prisma";

type GmailOAuthConfig = {
  user: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
};

type GmailServiceAccountConfig = {
  user: string; // mailbox to impersonate (requires domain-wide delegation)
  serviceClient: string; // service-account client_id
  privateKey: string;
};

type MailConfig = {
  gmailServiceAccount?: GmailServiceAccountConfig | null;
  gmail?: GmailOAuthConfig | null;
  host?: string | null;
  port: number;
  user?: string | null;
  pass?: string | null;
  from: string;
  alertEmail?: string | null;
  emailAlertsEnabled: boolean;
};

/**
 * Parses a Google service-account JSON key. Returns null unless it contains
 * the two fields nodemailer's 2LO auth needs (client_id + private_key).
 */
function parseServiceAccountKey(
  json: string | null | undefined,
  user: string | null,
): GmailServiceAccountConfig | null {
  if (!json || !user) return null;
  try {
    const key = JSON.parse(json) as { client_id?: string; private_key?: string };
    if (!key.client_id || !key.private_key) return null;
    return { user, serviceClient: key.client_id, privateKey: key.private_key };
  } catch {
    return null;
  }
}

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

  const gmailServiceAccount = parseServiceAccountKey(
    cfg?.gmailServiceAccountJson || process.env.GMAIL_SERVICE_ACCOUNT_JSON,
    gmailUser,
  );

  return {
    gmailServiceAccount,
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

export type EmailTransportName = "gmail-service-account" | "gmail-oauth2" | "smtp";

type CandidateTransport = { name: EmailTransportName; transport: nodemailer.Transporter };

function buildTransports(cfg: MailConfig): CandidateTransport[] {
  const candidates: CandidateTransport[] = [];
  if (cfg.gmailServiceAccount) {
    candidates.push({
      name: "gmail-service-account",
      transport: nodemailer.createTransport({
        service: "gmail",
        auth: {
          type: "OAuth2",
          user: cfg.gmailServiceAccount.user,
          serviceClient: cfg.gmailServiceAccount.serviceClient,
          privateKey: cfg.gmailServiceAccount.privateKey,
        },
      }),
    });
  }
  if (cfg.gmail) {
    candidates.push({
      name: "gmail-oauth2",
      transport: nodemailer.createTransport({
        service: "gmail",
        auth: {
          type: "OAuth2",
          user: cfg.gmail.user,
          clientId: cfg.gmail.clientId,
          clientSecret: cfg.gmail.clientSecret,
          refreshToken: cfg.gmail.refreshToken,
        },
      }),
    });
  }
  if (cfg.host) {
    candidates.push({
      name: "smtp",
      transport: nodemailer.createTransport({
        host: cfg.host,
        port: cfg.port,
        secure: cfg.port === 465,
        auth: cfg.user ? { user: cfg.user, pass: cfg.pass ?? undefined } : undefined,
      }),
    });
  }
  return candidates;
}

export type SendEmailResult = {
  delivered: boolean;
  transport: EmailTransportName | null;
  /** Per-transport failure messages for transports tried before the one that worked. */
  errors: string[];
};

/**
 * Sends transactional email. Transports are tried in order until one delivers:
 *   1. Gmail service account (domain-wide delegation) — survives password
 *      changes, so it's preferred when configured
 *   2. Gmail OAuth2 (XOAUTH2 refresh token) — note Google revokes
 *      Gmail-scoped refresh tokens when the account password changes
 *   3. Plain SMTP
 *   4. Console fallback (logged, not delivered) so local dev works without
 *      an email provider.
 * Throws only when every configured transport fails.
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<SendEmailResult> {
  const cfg = await getMailConfig();
  const candidates = buildTransports(cfg);

  if (candidates.length === 0) {
    // eslint-disable-next-line no-console
    console.log(
      `\n[email:console-fallback] To: ${opts.to}\nSubject: ${opts.subject}\n${opts.text}\n`,
    );
    return { delivered: false, transport: null, errors: [] };
  }

  const message = {
    from: cfg.from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html ?? `<pre style="font-family:sans-serif">${opts.text}</pre>`,
  };

  const errors: string[] = [];
  let lastError: unknown;
  for (const { name, transport } of candidates) {
    try {
      await transport.sendMail(message);
      return { delivered: true, transport: name, errors };
    } catch (err) {
      lastError = err;
      const detail = err instanceof Error ? err.message : String(err);
      errors.push(`${name}: ${detail}`);
      // eslint-disable-next-line no-console
      console.error(`[email] transport ${name} failed, trying next: ${detail}`);
    }
  }
  throw new Error(`All email transports failed — ${errors.join(" | ")}`, {
    cause: lastError,
  });
}

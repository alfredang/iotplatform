import nodemailer from "nodemailer";

/**
 * Sends transactional email via SMTP when configured. When SMTP is NOT
 * configured (no SMTP_HOST), the message is logged to the server console so
 * local development still works without an email provider.
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<{ delivered: boolean }> {
  const host = process.env.SMTP_HOST;
  const from = process.env.SMTP_FROM || "IoT Platform <no-reply@iotplatform.local>";

  if (!host) {
    // eslint-disable-next-line no-console
    console.log(
      `\n[email:console-fallback] To: ${opts.to}\nSubject: ${opts.subject}\n${opts.text}\n`,
    );
    return { delivered: false };
  }

  const transport = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });

  await transport.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html ?? `<pre style="font-family:sans-serif">${opts.text}</pre>`,
  });
  return { delivered: true };
}

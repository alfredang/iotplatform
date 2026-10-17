import { randomInt } from "crypto";
import { sendEmail } from "@/lib/email";

// No 0/O, 1/l/I — the password is read from an email and typed by hand.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

/** A readable one-time default password, e.g. "Hk7m-Pq2r-Tz9w". */
export function generateDefaultPassword(): string {
  const group = () =>
    Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  return `${group()}-${group()}-${group()}`;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/**
 * Emails a newly registered user their default password. They can sign in
 * with it (or with an emailed one-time code) and are then made to set their
 * own password before reaching the dashboard.
 */
export async function sendWelcomeEmail(opts: {
  to: string;
  name: string;
  password: string;
}) {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://iot.tertiaryinfotech.com").replace(
    /\/$/,
    "",
  );
  const loginUrl = `${appUrl}/login`;

  const text = [
    `Hi ${opts.name},`,
    "",
    "Welcome to IoTFlow — your account is ready.",
    "",
    `Email: ${opts.to}`,
    `Default password: ${opts.password}`,
    "",
    `Sign in at ${loginUrl}`,
    "Choose \"Password\" to use the default password above, or sign in with a",
    "one-time code sent to this email. Either way, you'll be asked to set your",
    "own password right after your first sign-in.",
    "",
    "If you didn't create this account, you can ignore this email.",
  ].join("\n");

  const html = `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:520px;margin:0 auto;color:#11161d">
  <h2 style="margin:0 0 12px">Welcome to IoT<span style="color:#0ea5a3">Flow</span></h2>
  <p>Hi ${escapeHtml(opts.name)}, your account is ready.</p>
  <table style="border-collapse:collapse;margin:16px 0;font-size:14px">
    <tr><td style="padding:4px 12px 4px 0;color:#5b6573">Email</td><td>${escapeHtml(opts.to)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#5b6573">Default password</td>
      <td><code style="font-size:16px;background:#f1f3f6;padding:4px 8px;border-radius:6px">${escapeHtml(opts.password)}</code></td></tr>
  </table>
  <p><a href="${loginUrl}" style="display:inline-block;background:#0ea5a3;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">Sign in to IoTFlow</a></p>
  <p style="font-size:14px;color:#5b6573">Choose <b>Password</b> to use the default password above, or sign in with a one-time code sent to this email. Either way, you'll be asked to set your own password right after your first sign-in.</p>
  <p style="font-size:12px;color:#8a96a6">If you didn't create this account, you can ignore this email.</p>
</div>`;

  return sendEmail({ to: opts.to, subject: "Welcome to IoTFlow — your sign-in details", text, html });
}

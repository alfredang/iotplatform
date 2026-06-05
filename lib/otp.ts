import { createHash, randomInt } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/email";

const OTP_TTL_MINUTES = 10;

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

/**
 * Generates a 6-digit OTP for the given email + purpose, stores its hash, and
 * emails it. Any previous unconsumed codes for the same email/purpose are
 * invalidated. Returns the code only in non-production so it can be surfaced
 * for local testing.
 */
export async function createOtp(
  email: string,
  purpose: "login" | "reset" = "login",
): Promise<{ devCode?: string }> {
  const normalized = email.trim().toLowerCase();
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");

  await prisma.otpCode.updateMany({
    where: { email: normalized, purpose, consumed: false },
    data: { consumed: true },
  });

  await prisma.otpCode.create({
    data: {
      email: normalized,
      codeHash: hashCode(code),
      purpose,
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
    },
  });

  const subject =
    purpose === "reset" ? "Your password reset code" : "Your login code";
  await sendEmail({
    to: normalized,
    subject,
    text: `Your IoT Platform ${purpose === "reset" ? "password reset" : "login"} code is: ${code}\nIt expires in ${OTP_TTL_MINUTES} minutes.`,
  });

  return process.env.NODE_ENV === "production" ? {} : { devCode: code };
}

/**
 * Verifies a submitted code. On success the matching record is marked consumed
 * and `true` is returned.
 */
export async function verifyOtp(
  email: string,
  code: string,
  purpose: "login" | "reset" = "login",
): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  const record = await prisma.otpCode.findFirst({
    where: {
      email: normalized,
      purpose,
      consumed: false,
      expiresAt: { gt: new Date() },
      codeHash: hashCode(code.trim()),
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return false;

  await prisma.otpCode.update({
    where: { id: record.id },
    data: { consumed: true },
  });
  return true;
}

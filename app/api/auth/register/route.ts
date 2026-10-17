import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { createOtp } from "@/lib/otp";
import { registerSchema } from "@/lib/validation";
import { handleApiError, parseBody } from "@/lib/api";
import { generateDefaultPassword, sendWelcomeEmail } from "@/lib/welcome";

/**
 * POST /api/auth/register
 *
 * Web sign-up sends only name + email: the account gets a generated default
 * password, emailed in a welcome message, and must set its own password after
 * the first sign-in (password or one-time code).
 *
 * The mobile apps still send a chosen password; those accounts keep the
 * verify-by-emailed-code flow and are not forced to change it.
 */
export async function POST(req: Request) {
  try {
    const { name, email, password } = await parseBody(req, registerSchema);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return Response.json(
        { error: "An account with that email already exists" },
        { status: 409 },
      );
    }

    if (password) {
      await prisma.user.create({
        data: {
          name,
          email,
          hashedPassword: bcrypt.hashSync(password, 10),
          role: "ADMIN",
          notificationEmail: email,
        },
      });

      // The account stays unverified (cannot sign in with a password) until the
      // emailed code is confirmed via /api/auth/verify-email.
      const { devCode } = await createOtp(email, "verify");

      return Response.json({ ok: true, requiresVerification: true, devCode }, { status: 201 });
    }

    const defaultPassword = generateDefaultPassword();
    const user = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword: bcrypt.hashSync(defaultPassword, 10),
        mustChangePassword: true,
        role: "ADMIN",
        notificationEmail: email,
      },
    });

    try {
      await sendWelcomeEmail({ to: email, name, password: defaultPassword });
    } catch (err) {
      // Without the email the user can never learn the password — roll back so
      // they can simply try again.
      await prisma.user.delete({ where: { id: user.id } });
      throw err;
    }

    return Response.json(
      {
        ok: true,
        welcomeEmailSent: true,
        // Only outside production, to ease local testing (mirrors devCode).
        devPassword: process.env.NODE_ENV === "production" ? undefined : defaultPassword,
      },
      { status: 201 },
    );
  } catch (err) {
    return handleApiError(err);
  }
}

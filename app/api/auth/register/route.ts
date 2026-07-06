import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { createOtp } from "@/lib/otp";
import { registerSchema } from "@/lib/validation";
import { handleApiError, parseBody } from "@/lib/api";

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
  } catch (err) {
    return handleApiError(err);
  }
}

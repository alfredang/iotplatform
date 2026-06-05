import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { verifyOtp } from "@/lib/otp";
import { otpResetSchema } from "@/lib/validation";
import { handleApiError, parseBody } from "@/lib/api";

/**
 * Password reset via OTP: verifies the emailed code and sets a new password.
 * (OTP *login* is handled by the Auth.js "otp" credentials provider instead.)
 */
export async function POST(req: Request) {
  try {
    const { email, code, password } = await parseBody(req, otpResetSchema);

    const ok = await verifyOtp(email, code, "reset");
    if (!ok) {
      return Response.json({ error: "Invalid or expired code" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return Response.json({ error: "No account for that email" }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { hashedPassword: bcrypt.hashSync(password, 10) },
    });

    return Response.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}

import { prisma } from "@/lib/db/prisma";
import { verifyOtp } from "@/lib/otp";
import { verifyEmailSchema } from "@/lib/validation";
import { handleApiError, parseBody } from "@/lib/api";

/** Confirms the emailed verification code and activates the account. */
export async function POST(req: Request) {
  try {
    const { email, code } = await parseBody(req, verifyEmailSchema);

    const ok = await verifyOtp(email, code, "verify");
    if (!ok) {
      return Response.json({ error: "Invalid or expired code" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return Response.json({ error: "No account for that email" }, { status: 404 });
    }

    if (!user.emailVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    }

    return Response.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}

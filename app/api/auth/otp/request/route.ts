import { createOtp } from "@/lib/otp";
import { otpRequestSchema } from "@/lib/validation";
import { handleApiError, parseBody } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const { email, purpose } = await parseBody(req, otpRequestSchema);
    const { devCode } = await createOtp(email, purpose);
    // devCode is only returned outside production, to ease local testing.
    return Response.json({ ok: true, devCode });
  } catch (err) {
    return handleApiError(err);
  }
}

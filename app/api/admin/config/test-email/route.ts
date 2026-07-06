import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAdminApi } from "@/lib/auth/rbac";
import { sendEmail } from "@/lib/email";
import { handleApiError, parseBody } from "@/lib/api";

const testEmailSchema = z.object({
  to: z.string().trim().toLowerCase().email("Enter a valid email").optional(),
});

/** POST /api/admin/config/test-email — send a test email (admin only). */
export async function POST(req: Request) {
  try {
    const admin = await requireAdminApi();
    const { to } = await parseBody(req, testEmailSchema);

    const user = await prisma.user.findUnique({ where: { id: admin.id } });
    const recipient = to || user?.notificationEmail || user?.email;
    if (!recipient) {
      return Response.json({ error: "No recipient email" }, { status: 400 });
    }

    try {
      const { delivered } = await sendEmail({
        to: recipient,
        subject: "IoTFlow test email",
        text: "This is a test email from your IoTFlow admin settings. If you can read this, outgoing email works.",
      });
      return Response.json({ ok: true, delivered, to: recipient });
    } catch (sendErr) {
      // Surface the transport error so admins can debug their settings.
      const message = sendErr instanceof Error ? sendErr.message : "Send failed";
      return Response.json({ error: message }, { status: 502 });
    }
  } catch (err) {
    return handleApiError(err);
  }
}

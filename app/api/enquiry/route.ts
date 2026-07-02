import { prisma } from "@/lib/db/prisma";
import { enquirySchema } from "@/lib/validation";
import { handleApiError, parseBody } from "@/lib/api";
import { sendEmail } from "@/lib/email";

// Where new landing-page enquiries are emailed.
const ENQUIRY_NOTIFY_TO = process.env.ENQUIRY_NOTIFY_TO || "angch@tertiaryinfotech.com";

export async function POST(req: Request) {
  try {
    const data = await parseBody(req, enquirySchema);
    const enquiry = await prisma.enquiry.create({
      data: {
        name: data.name,
        email: data.email,
        company: data.company || null,
        phone: data.phone || null,
        message: data.message,
      },
    });

    // Notify the team (best-effort — never fail the request on email issues).
    const text = [
      `New IoTFlow enquiry`,
      ``,
      `Name:    ${enquiry.name}`,
      `Email:   ${enquiry.email}`,
      `Company: ${enquiry.company || "—"}`,
      `Phone:   ${enquiry.phone || "—"}`,
      ``,
      `Message:`,
      enquiry.message,
    ].join("\n");
    void sendEmail({
      to: ENQUIRY_NOTIFY_TO,
      subject: `New enquiry from ${enquiry.name}`,
      text,
    }).catch(() => {});

    return Response.json({ ok: true }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

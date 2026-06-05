import { prisma } from "@/lib/db/prisma";
import { enquirySchema } from "@/lib/validation";
import { handleApiError, parseBody } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const data = await parseBody(req, enquirySchema);
    await prisma.enquiry.create({
      data: {
        name: data.name,
        email: data.email,
        company: data.company || null,
        phone: data.phone || null,
        message: data.message,
      },
    });
    return Response.json({ ok: true }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

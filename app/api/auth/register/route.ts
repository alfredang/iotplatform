import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
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

    // First-ever user becomes ADMIN; everyone else is a regular USER.
    const count = await prisma.user.count();
    await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword: bcrypt.hashSync(password, 10),
        role: count === 0 ? "ADMIN" : "USER",
        notificationEmail: email,
      },
    });

    return Response.json({ ok: true }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

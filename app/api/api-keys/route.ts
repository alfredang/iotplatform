import { prisma } from "@/lib/db/prisma";
import { requireApiUser } from "@/lib/auth/rbac";
import { apiKeySchema } from "@/lib/validation";
import { handleApiError, parseBody } from "@/lib/api";
import { generateApiKey } from "@/lib/tokens";

export async function GET() {
  try {
    const user = await requireApiUser();
    const keys = await prisma.apiKey.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        prefix: true,
        revoked: true,
        lastUsed: true,
        createdAt: true,
      },
    });
    return Response.json({ keys });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireApiUser("USER");
    const { name } = await parseBody(req, apiKeySchema);
    const key = generateApiKey();
    const created = await prisma.apiKey.create({
      data: { name, keyHash: key.hash, prefix: key.prefix, ownerId: user.id },
    });
    // Raw key returned once.
    return Response.json(
      { key: key.token, id: created.id, prefix: created.prefix },
      { status: 201 },
    );
  } catch (err) {
    return handleApiError(err);
  }
}

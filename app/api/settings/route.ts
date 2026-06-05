import { prisma } from "@/lib/db/prisma";
import { requireApiUser } from "@/lib/auth/rbac";
import { settingsSchema } from "@/lib/validation";
import { handleApiError, parseBody } from "@/lib/api";

/** PUT /api/settings — update the signed-in user's profile/preferences. */
export async function PUT(req: Request) {
  try {
    const user = await requireApiUser();
    const data = await parseBody(req, settingsSchema);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.orgName !== undefined ? { orgName: data.orgName } : {}),
        ...(data.notificationEmail !== undefined
          ? { notificationEmail: data.notificationEmail || null }
          : {}),
        ...(data.theme !== undefined ? { theme: data.theme } : {}),
      },
      select: { id: true, name: true, orgName: true, notificationEmail: true, theme: true },
    });
    return Response.json({ user: updated });
  } catch (err) {
    return handleApiError(err);
  }
}

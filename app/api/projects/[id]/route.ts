import { prisma } from "@/lib/db/prisma";
import { requireApiUser } from "@/lib/auth/rbac";
import { handleApiError, parseBody } from "@/lib/api";
import { requireProject } from "@/lib/projects";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(400).optional().or(z.literal("")),
});

export async function PUT(req: Request, { params }: Ctx) {
  try {
    const user = await requireApiUser();
    const { id } = await params;
    await requireProject(user.id, id);
    const data = await parseBody(req, updateSchema);
    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description || null } : {}),
      },
    });
    return Response.json({ project });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const user = await requireApiUser();
    const { id } = await params;
    await requireProject(user.id, id);
    // Don't allow deleting the user's only project.
    const count = await prisma.project.count({ where: { ownerId: user.id } });
    if (count <= 1) {
      return Response.json(
        { error: "You must keep at least one project" },
        { status: 400 },
      );
    }
    await prisma.project.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}

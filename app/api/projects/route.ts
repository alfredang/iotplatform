import { prisma } from "@/lib/db/prisma";
import { requireApiUser } from "@/lib/auth/rbac";
import { handleApiError, parseBody } from "@/lib/api";
import { listProjects } from "@/lib/projects";
import { z } from "zod";

const projectSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z.string().trim().max(400).optional().or(z.literal("")),
});

export async function GET() {
  try {
    const user = await requireApiUser();
    const projects = await listProjects(user.id);
    return Response.json({ projects });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireApiUser();
    const data = await parseBody(req, projectSchema);
    const project = await prisma.project.create({
      data: { name: data.name, description: data.description || null, ownerId: user.id },
    });
    // Give every project an empty default dashboard up front.
    await prisma.dashboard.create({
      data: { ownerId: user.id, projectId: project.id, name: "Overview", isDefault: true },
    });
    return Response.json({ project }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

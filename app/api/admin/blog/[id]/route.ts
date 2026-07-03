import { prisma } from "@/lib/db/prisma";
import { requireApiUser, AuthError } from "@/lib/auth/rbac";
import { handleApiError, parseBody } from "@/lib/api";
import { blogPostUpdateSchema } from "@/lib/validation";
import { upsertTagsByName, uniquePostSlug } from "@/lib/blog";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/admin/blog/:id — update a post (admin). */
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    await requireApiUser("ADMIN");
    const { id } = await params;
    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) throw new AuthError("Post not found", 404);

    const data = await parseBody(req, blogPostUpdateSchema);
    const tagIds = data.tags ? await upsertTagsByName(data.tags) : undefined;
    const slug =
      data.slug !== undefined
        ? slugify(data.slug || existing.title)
        : data.title
          ? await uniquePostSlug(data.title, id)
          : undefined;

    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(slug !== undefined ? { slug } : {}),
        ...(data.excerpt !== undefined ? { excerpt: data.excerpt } : {}),
        ...(data.content !== undefined ? { content: data.content } : {}),
        ...(data.coverImage !== undefined ? { coverImage: data.coverImage || null } : {}),
        ...(data.categoryId !== undefined ? { categoryId: data.categoryId || null } : {}),
        ...(data.published !== undefined ? { published: data.published } : {}),
        ...(data.featured !== undefined ? { featured: data.featured } : {}),
        ...(tagIds ? { tags: { set: tagIds.map((tid) => ({ id: tid })) } } : {}),
      },
    });
    return Response.json({ post });
  } catch (err) {
    return handleApiError(err);
  }
}

/** DELETE /api/admin/blog/:id */
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    await requireApiUser("ADMIN");
    const { id } = await params;
    await prisma.blogPost.delete({ where: { id } }).catch(() => {
      throw new AuthError("Post not found", 404);
    });
    return Response.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}

import { prisma } from "@/lib/db/prisma";
import { requireApiUser } from "@/lib/auth/rbac";
import { handleApiError, parseBody } from "@/lib/api";
import { blogPostSchema } from "@/lib/validation";
import { upsertTagsByName, uniquePostSlug } from "@/lib/blog";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** GET /api/admin/blog — all posts (admin). */
export async function GET() {
  try {
    await requireApiUser("ADMIN");
    const posts = await prisma.blogPost.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { name: true } },
        tags: { select: { name: true } },
        _count: { select: { reviews: true } },
      },
    });
    return Response.json({ posts });
  } catch (err) {
    return handleApiError(err);
  }
}

/** POST /api/admin/blog — create a post (admin). */
export async function POST(req: Request) {
  try {
    const user = await requireApiUser("ADMIN");
    const data = await parseBody(req, blogPostSchema);
    const slug = data.slug ? slugify(data.slug) : await uniquePostSlug(data.title);
    const tagIds = await upsertTagsByName(data.tags ?? []);

    const post = await prisma.blogPost.create({
      data: {
        slug,
        title: data.title,
        excerpt: data.excerpt,
        content: data.content,
        coverImage: data.coverImage || null,
        published: data.published,
        featured: data.featured,
        authorId: user.id,
        categoryId: data.categoryId || null,
        tags: { connect: tagIds.map((id) => ({ id })) },
      },
    });
    return Response.json({ post }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

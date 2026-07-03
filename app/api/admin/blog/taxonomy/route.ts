import { prisma } from "@/lib/db/prisma";
import { requireApiUser } from "@/lib/auth/rbac";
import { handleApiError, parseBody } from "@/lib/api";
import { blogTaxonomySchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** GET /api/admin/blog/taxonomy — categories + tags with post counts. */
export async function GET() {
  try {
    await requireApiUser("ADMIN");
    const [categories, tags] = await Promise.all([
      prisma.blogCategory.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { posts: true } } } }),
      prisma.blogTag.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { posts: true } } } }),
    ]);
    return Response.json({ categories, tags });
  } catch (err) {
    return handleApiError(err);
  }
}

/** POST /api/admin/blog/taxonomy?type=category|tag — create one. */
export async function POST(req: Request) {
  try {
    await requireApiUser("ADMIN");
    const type = new URL(req.url).searchParams.get("type") === "tag" ? "tag" : "category";
    const { name } = await parseBody(req, blogTaxonomySchema);
    const slug = slugify(name);
    if (type === "tag") {
      const tag = await prisma.blogTag.upsert({ where: { slug }, update: { name }, create: { slug, name } });
      return Response.json({ tag }, { status: 201 });
    }
    const category = await prisma.blogCategory.upsert({ where: { slug }, update: { name }, create: { slug, name } });
    return Response.json({ category }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

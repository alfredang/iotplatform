import { prisma } from "@/lib/db/prisma";
import { handleApiError } from "@/lib/api";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

/** POST /api/blog/:slug/like — public; increments the like counter. */
export async function POST(_req: Request, { params }: Ctx) {
  try {
    const { slug } = await params;
    const post = await prisma.blogPost.update({
      where: { slug },
      data: { likes: { increment: 1 } },
      select: { likes: true },
    });
    return Response.json({ likes: post.likes });
  } catch (err) {
    return handleApiError(err);
  }
}

import { prisma } from "@/lib/db/prisma";
import { handleApiError, parseBody } from "@/lib/api";
import { blogReviewSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

/** GET /api/blog/:slug/reviews — public list + average. */
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { slug } = await params;
    const post = await prisma.blogPost.findUnique({ where: { slug }, select: { id: true } });
    if (!post) return Response.json({ reviews: [], avg: 0, count: 0 });
    const reviews = await prisma.blogReview.findMany({
      where: { postId: post.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    const count = reviews.length;
    const avg = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
    return Response.json({ reviews, avg, count });
  } catch (err) {
    return handleApiError(err);
  }
}

/** POST /api/blog/:slug/reviews — public; submit a star rating + comment. */
export async function POST(req: Request, { params }: Ctx) {
  try {
    const { slug } = await params;
    const post = await prisma.blogPost.findUnique({ where: { slug }, select: { id: true } });
    if (!post) return Response.json({ error: "Post not found" }, { status: 404 });
    const data = await parseBody(req, blogReviewSchema);
    const review = await prisma.blogReview.create({
      data: {
        postId: post.id,
        rating: data.rating,
        name: data.name || null,
        comment: data.comment || null,
      },
    });
    return Response.json({ review }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

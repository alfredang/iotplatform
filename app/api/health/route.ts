import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({
      status: "ok",
      database: "up",
      time: new Date().toISOString(),
    });
  } catch {
    return Response.json(
      { status: "degraded", database: "down", time: new Date().toISOString() },
      { status: 503 },
    );
  }
}

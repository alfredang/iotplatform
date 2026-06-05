import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { auth } from "./auth";

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

/** Role hierarchy: ADMIN can do everything a USER can; USER more than VIEWER. */
const RANK: Record<Role, number> = { VIEWER: 1, USER: 2, ADMIN: 3 };

export function roleAtLeast(role: Role, min: Role): boolean {
  return RANK[role] >= RANK[min];
}

/**
 * For Server Components / page guards. Redirects to /login when unauthenticated.
 */
export async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

/**
 * For Route Handlers. Throws AuthError (caught and mapped to 401/403) instead
 * of redirecting. Returns the authenticated user.
 */
export async function requireApiUser(minRole: Role = "VIEWER") {
  const session = await auth();
  if (!session?.user) throw new AuthError("Unauthorized", 401);
  if (!roleAtLeast(session.user.role, minRole)) {
    throw new AuthError("Forbidden", 403);
  }
  return session.user;
}

/** Maps thrown errors to a JSON Response for API routes. */
export function errorResponse(err: unknown): Response {
  if (err instanceof AuthError) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  // eslint-disable-next-line no-console
  console.error(err);
  const message = err instanceof Error ? err.message : "Internal error";
  return Response.json({ error: message }, { status: 500 });
}

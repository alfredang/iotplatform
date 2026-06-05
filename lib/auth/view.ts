import { cookies } from "next/headers";
import type { Role } from "@prisma/client";
import { requireSession } from "./rbac";
import { VIEW_AS_COOKIE } from "@/lib/constants";

export { VIEW_AS_COOKIE };

/** The view-as preference from the cookie ("user" forces a User-level view). */
export async function getViewAs(): Promise<"user" | "admin"> {
  const store = await cookies();
  return store.get(VIEW_AS_COOKIE)?.value === "user" ? "user" : "admin";
}

/**
 * The effective role for UI purposes. An admin who chose "view as user" is
 * treated as USER in the interface (admin-only menus hide), while their real
 * role stays ADMIN for any genuine authorization decision.
 */
export function effectiveRole(realRole: Role, viewAs: "user" | "admin"): Role {
  if (realRole === "ADMIN" && viewAs === "user") return "USER";
  return realRole;
}

/**
 * Guard for admin pages. Requires a real ADMIN; if the admin is currently
 * "viewing as user", redirect them to the dashboard so the preview is faithful.
 */
export async function requireAdminView() {
  const session = await requireSession();
  const { redirect } = await import("next/navigation");
  if (session.user.role !== "ADMIN") redirect("/dashboard");
  const viewAs = await getViewAs();
  if (viewAs === "user") redirect("/dashboard");
  return session;
}

/**
 * Client-safe constants. This module must NOT import server-only code
 * (next/headers, Prisma, nodemailer) so it can be used from client components.
 */

/** Cookie holding the user's currently selected project id. */
export const PROJECT_COOKIE = "projectId";

/** Cookie holding an admin's view-as preference ("user" | "admin"). */
export const VIEW_AS_COOKIE = "viewAs";

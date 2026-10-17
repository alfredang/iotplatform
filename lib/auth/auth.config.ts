import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe base config. Contains NO database adapter and NO Node-only code
 * (bcrypt, Prisma) so it can be imported by the middleware, which runs on the
 * edge runtime. The full provider list + adapter live in ./auth.ts.
 */
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role ?? "USER";
        token.mustChangePassword = user.mustChangePassword ?? false;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? token.sub!;
        session.user.role = token.role ?? "USER";
        session.user.mustChangePassword = token.mustChangePassword ?? false;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

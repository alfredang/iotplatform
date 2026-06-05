import NextAuth, { type NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { verifyOtp } from "@/lib/otp";
import { authConfig } from "./auth.config";

// Build the provider list dynamically. OAuth providers are only registered
// when their credentials are present, so the app boots cleanly without them.
const providers: NextAuthConfig["providers"] = [
  Credentials({
    id: "credentials",
    name: "Email & Password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(creds) {
      const email = String(creds?.email || "").trim().toLowerCase();
      const password = String(creds?.password || "");
      if (!email || !password) return null;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user?.hashedPassword || user.disabled) return null;

      const ok = await bcrypt.compare(password, user.hashedPassword);
      if (!ok) return null;

      return { id: user.id, email: user.email, name: user.name, role: user.role };
    },
  }),
  Credentials({
    id: "otp",
    name: "One-Time Code",
    credentials: {
      email: { label: "Email", type: "email" },
      code: { label: "Code", type: "text" },
    },
    async authorize(creds) {
      const email = String(creds?.email || "").trim().toLowerCase();
      const code = String(creds?.code || "");
      if (!email || !code) return null;

      const ok = await verifyOtp(email, code, "login");
      if (!ok) return null;

      // Reject deactivated accounts.
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing?.disabled) return null;

      // Passwordless: create the account on first OTP login.
      const user = await prisma.user.upsert({
        where: { email },
        update: { emailVerified: new Date() },
        create: { email, emailVerified: new Date(), role: "USER" },
      });
      return { id: user.id, email: user.email, name: user.name, role: user.role };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

/** Which OAuth buttons to show on the auth pages (server-evaluated). */
export const enabledOAuth = {
  google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  github: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers,
});

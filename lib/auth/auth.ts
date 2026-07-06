import NextAuth, { CredentialsSignin, type NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { verifyOtp } from "@/lib/otp";
import { authConfig } from "./auth.config";

/** Surfaced to the login form so it can offer to resend the verification code. */
class EmailNotVerified extends CredentialsSignin {
  code = "email_not_verified";
}

const credentialProviders: NextAuthConfig["providers"] = [
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

      // Registered but never confirmed the emailed code.
      if (!user.emailVerified) throw new EmailNotVerified();

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
        create: { email, emailVerified: new Date(), role: "ADMIN" },
      });
      return { id: user.id, email: user.email, name: user.name, role: user.role };
    },
  }),
];

type OAuthCreds = {
  googleId: string | null;
  googleSecret: string | null;
  githubId: string | null;
  githubSecret: string | null;
};

// OAuth credentials come from the admin-managed AppConfig row (Admin →
// Settings), falling back to env vars. Cached briefly because auth() runs on
// every request; bustOAuthCache() is called when an admin saves new settings.
let oauthCache: { value: OAuthCreds; ts: number } | null = null;
const OAUTH_CACHE_TTL_MS = 30_000;

async function getOAuthCreds(): Promise<OAuthCreds> {
  if (oauthCache && Date.now() - oauthCache.ts < OAUTH_CACHE_TTL_MS) {
    return oauthCache.value;
  }
  const cfg = await prisma.appConfig.findUnique({ where: { id: 1 } }).catch(() => null);
  const value: OAuthCreds = {
    googleId: cfg?.googleClientId || process.env.GOOGLE_CLIENT_ID || null,
    googleSecret: cfg?.googleClientSecret || process.env.GOOGLE_CLIENT_SECRET || null,
    githubId: process.env.GITHUB_CLIENT_ID || null,
    githubSecret: process.env.GITHUB_CLIENT_SECRET || null,
  };
  oauthCache = { value, ts: Date.now() };
  return value;
}

export function bustOAuthCache() {
  oauthCache = null;
}

// The JWT caches the role from sign-in time; without a refresh, promotions,
// demotions and deactivations wouldn't apply until the user logs in again.
// Lookups are cached briefly because auth() runs on every request.
let roleCache = new Map<string, { role: Role; disabled: boolean; ts: number }>();
const ROLE_CACHE_TTL_MS = 30_000;

async function getFreshRole(userId: string) {
  const hit = roleCache.get(userId);
  if (hit && Date.now() - hit.ts < ROLE_CACHE_TTL_MS) return hit;
  const user = await prisma.user
    .findUnique({ where: { id: userId }, select: { role: true, disabled: true } })
    .catch(() => null);
  if (!user) return null;
  const entry = { role: user.role, disabled: user.disabled, ts: Date.now() };
  roleCache.set(userId, entry);
  if (roleCache.size > 10_000) roleCache = new Map([[userId, entry]]);
  return entry;
}

/** Call after changing a user's role or activation so it applies immediately. */
export function bustRoleCache(userId?: string) {
  if (userId) roleCache.delete(userId);
  else roleCache.clear();
}

/** Which OAuth buttons to show on the auth pages (server-evaluated). */
export async function getEnabledOAuth() {
  const creds = await getOAuthCreds();
  return {
    google: Boolean(creds.googleId && creds.googleSecret),
    github: Boolean(creds.githubId && creds.githubSecret),
  };
}

async function buildProviders(): Promise<NextAuthConfig["providers"]> {
  const creds = await getOAuthCreds();
  const providers = [...credentialProviders];
  if (creds.googleId && creds.googleSecret) {
    providers.push(
      Google({
        clientId: creds.googleId,
        clientSecret: creds.googleSecret,
        allowDangerousEmailAccountLinking: true,
      }),
    );
  }
  if (creds.githubId && creds.githubSecret) {
    providers.push(
      GitHub({
        clientId: creds.githubId,
        clientSecret: creds.githubSecret,
        allowDangerousEmailAccountLinking: true,
      }),
    );
  }
  return providers;
}

export const { handlers, auth, signIn, signOut } = NextAuth(async () => ({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: await buildProviders(),
  callbacks: {
    ...authConfig.callbacks,
    // Credentials providers enforce this in authorize(); this covers OAuth
    // sign-ins so a deactivated user can't slip back in through Google/GitHub.
    async signIn({ user }) {
      if (!user?.email) return true;
      const existing = await prisma.user.findUnique({ where: { email: user.email } });
      return !existing?.disabled;
    },
    // Overrides the static callback in auth.config.ts (kept there for the
    // middleware bundle, which can't reach the database).
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role ?? "USER";
        return token;
      }
      const id = (token.id as string) ?? token.sub;
      if (!id) return token;
      const fresh = await getFreshRole(id);
      if (!fresh || fresh.disabled) return null; // deleted/deactivated → end session
      token.role = fresh.role;
      return token;
    },
  },
}));

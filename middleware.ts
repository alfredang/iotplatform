import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth/auth.config";

// Edge-safe auth instance (no adapter / Node deps) used purely to read the JWT.
const { auth } = NextAuth(authConfig);

const PROTECTED = [
  "/dashboard",
  "/devices",
  "/telemetry",
  "/alerts",
  "/maps",
  "/api-keys",
  "/settings",
];

export default auth((req) => {
  const { pathname, origin } = req.nextUrl;
  const isProtected = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (isProtected && !req.auth?.user) {
    const url = new URL("/login", origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/devices/:path*",
    "/telemetry/:path*",
    "/alerts/:path*",
    "/maps/:path*",
    "/api-keys/:path*",
    "/settings/:path*",
  ],
};

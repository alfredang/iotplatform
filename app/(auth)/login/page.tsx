import { Suspense } from "react";
import { getEnabledOAuth } from "@/lib/auth/auth";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Sign in · IoTFlow" };

// OAuth buttons depend on runtime AppConfig; never prerender at build time.
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const oauth = await getEnabledOAuth();
  return (
    <Suspense>
      <LoginForm google={oauth.google} github={oauth.github} />
    </Suspense>
  );
}

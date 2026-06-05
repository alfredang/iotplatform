import { Suspense } from "react";
import { enabledOAuth } from "@/lib/auth/auth";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Sign in · IoTFlow" };

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm google={enabledOAuth.google} github={enabledOAuth.github} />
    </Suspense>
  );
}

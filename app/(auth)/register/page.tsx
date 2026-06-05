import { enabledOAuth } from "@/lib/auth/auth";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata = { title: "Sign up · IoTFlow" };

export default function RegisterPage() {
  return <RegisterForm google={enabledOAuth.google} github={enabledOAuth.github} />;
}

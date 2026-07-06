import { getEnabledOAuth } from "@/lib/auth/auth";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata = { title: "Sign up · IoTFlow" };

export default async function RegisterPage() {
  const oauth = await getEnabledOAuth();
  return <RegisterForm google={oauth.google} github={oauth.github} />;
}

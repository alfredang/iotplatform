import { redirect } from "next/navigation";

// One-time-code sign-in now lives on /login (it's the default method there).
export default function VerifyOtpPage() {
  redirect("/login");
}

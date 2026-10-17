import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireSession } from "@/lib/auth/rbac";
import { ChangePasswordForm } from "@/components/auth/change-password-form";

export const metadata = { title: "Set your password · IoTFlow" };

export default async function ChangePasswordPage() {
  const session = await requireSession();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, hashedPassword: true, mustChangePassword: true },
  });
  if (!user) redirect("/login");

  return (
    <ChangePasswordForm
      email={user.email}
      forced={user.mustChangePassword}
      needsCurrent={Boolean(user.hashedPassword) && !user.mustChangePassword}
    />
  );
}

import { requireSession } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/ui/misc";
import { SettingsForm } from "@/components/settings/settings-form";

export const metadata = { title: "Settings · IoTFlow" };

export default async function SettingsPage() {
  const session = await requireSession();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      role: true,
      orgName: true,
      notificationEmail: true,
      theme: true,
    },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Settings" description="Manage your profile and preferences." />
      <SettingsForm
        initial={{
          name: user?.name ?? "",
          email: user?.email ?? "",
          role: user?.role ?? "USER",
          orgName: user?.orgName ?? "",
          notificationEmail: user?.notificationEmail ?? "",
          theme: user?.theme ?? "dark",
        }}
      />
    </div>
  );
}

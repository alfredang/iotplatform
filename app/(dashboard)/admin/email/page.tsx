import { requireAdminView } from "@/lib/auth/view";
import { PageHeader } from "@/components/ui/misc";
import { EmailSettings } from "@/components/admin/email-settings";

export const metadata = { title: "Email & Alerts · Admin · IoTFlow" };

export default async function AdminEmailPage() {
  await requireAdminView();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Email & Alerts"
        description="Configure SMTP credentials and email notifications for alerts."
      />
      <EmailSettings />
    </div>
  );
}

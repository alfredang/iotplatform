import { requireAdminView } from "@/lib/auth/view";
import { PageHeader } from "@/components/ui/misc";
import { EmailSettings } from "@/components/admin/email-settings";

export const metadata = { title: "Settings · Admin · IoTFlow" };

export default async function AdminEmailPage() {
  await requireAdminView();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Settings"
        description="Configure email/SMTP, the n8n automation engine and the MQTT broker. Stored securely in the database."
      />
      <EmailSettings />
    </div>
  );
}

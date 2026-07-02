import { PageHeader } from "@/components/ui/misc";
import { AutomationsManager } from "@/components/automations/automations-manager";

export const metadata = { title: "Automations · IoTFlow" };

export default function AutomationsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Automations"
        description="Wire device events to n8n workflows — build no-code logic that notifies, controls devices, logs data or calls AI."
      />
      <AutomationsManager />
    </div>
  );
}

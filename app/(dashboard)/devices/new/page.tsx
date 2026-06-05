import { PageHeader } from "@/components/ui/misc";
import { ConnectionWizard } from "@/components/devices/connection-wizard";

export const metadata = { title: "Add device · IoTFlow" };

export default function NewDevicePage() {
  return (
    <div>
      <PageHeader
        title="Add a device"
        description="Connect a new device in a few quick steps."
      />
      <ConnectionWizard />
    </div>
  );
}

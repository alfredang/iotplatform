import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/misc";
import { DashboardSummary } from "@/components/dashboard/summary";
import { WidgetGrid } from "@/components/dashboard/widget-grid";

export const metadata = { title: "Dashboard · IoTFlow" };

export default async function DashboardPage() {
  const session = await auth();
  const firstName = session?.user.name?.split(" ")[0] || "there";

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Your devices and telemetry at a glance. Auto-refreshes every 5 seconds."
        action={
          <Link href="/devices/new">
            <Button>
              <PlusCircle className="h-4 w-4" /> Add device
            </Button>
          </Link>
        }
      />
      <DashboardSummary />
      <WidgetGrid />
    </div>
  );
}

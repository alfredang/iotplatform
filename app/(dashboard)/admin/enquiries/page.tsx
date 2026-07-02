import { requireAdminView } from "@/lib/auth/view";
import { prisma } from "@/lib/db/prisma";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { Card } from "@/components/ui/card";
import { Mail, Inbox } from "lucide-react";

export const metadata = { title: "Enquiries · Admin · IoTFlow" };
export const dynamic = "force-dynamic";

export default async function AdminEnquiriesPage() {
  await requireAdminView();
  const enquiries = await prisma.enquiry.findMany({ orderBy: { createdAt: "desc" }, take: 500 });

  return (
    <div>
      <PageHeader
        title="Enquiries"
        description="Contact-form submissions from the landing page. Also emailed to the team."
      />

      {enquiries.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-8 w-8" />}
          title="No enquiries yet"
          description="Submissions from the landing-page contact form will appear here."
        />
      ) : (
        <div className="space-y-3">
          {enquiries.map((e) => (
            <Card key={e.id} className="p-4 sm:p-5">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold">{e.name}</p>
                  <a
                    href={`mailto:${e.email}`}
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <Mail className="h-3.5 w-3.5" /> {e.email}
                  </a>
                </div>
                <p className="text-xs text-muted">{new Date(e.createdAt).toLocaleString()}</p>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                {e.company && <span>Company: <span className="text-foreground">{e.company}</span></span>}
                {e.phone && <span>Phone: <span className="text-foreground">{e.phone}</span></span>}
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/90">{e.message}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

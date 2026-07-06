import { requireAdminView } from "@/lib/auth/view";
import { PageHeader } from "@/components/ui/misc";
import { AdminUsers } from "@/components/admin/admin-users";

export const metadata = { title: "Users · Admin · IoTFlow" };

export default async function AdminUsersPage() {
  const session = await requireAdminView();
  return (
    <div>
      <PageHeader
        title="Users"
        description="View all user and admin accounts — create, edit, deactivate or remove them."
      />
      <AdminUsers currentUserId={session.user.id} />
    </div>
  );
}

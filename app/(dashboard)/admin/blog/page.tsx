import { requireAdminView } from "@/lib/auth/view";
import { PageHeader } from "@/components/ui/misc";
import { BlogAdmin } from "@/components/admin/blog-admin";

export const metadata = { title: "Blog · Admin · IoTFlow" };

export default async function AdminBlogPage() {
  await requireAdminView();
  return (
    <div>
      <PageHeader
        title="Blog"
        description="Create and manage blog posts, categories and tags. Admins only."
      />
      <BlogAdmin />
    </div>
  );
}

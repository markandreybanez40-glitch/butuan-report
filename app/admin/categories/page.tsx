import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/data/profiles";
import { getAdminCategories } from "@/lib/data/admin";
import { AdminHeader } from "@/components/admin/admin-header";
import { CategoriesManager } from "@/components/admin/categories-manager";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Category Management | Butuan Report Admin",
  description: "Configure civic hazard classification categories and reporting options",
};

export default async function AdminCategoriesPage() {
  const currentProfile = await getCurrentProfile();
  if (!currentProfile || currentProfile.role !== "admin") {
    redirect("/dashboard");
  }

  const categories = await getAdminCategories();

  return (
    <>
      <AdminHeader
        title="Incident Category Management"
        subtitle="Manage public hazard categories, citizen guidelines, and active status"
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
        <CategoriesManager categories={categories} />
      </main>
    </>
  );
}

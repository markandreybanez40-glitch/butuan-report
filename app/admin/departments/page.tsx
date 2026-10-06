import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/data/profiles";
import { getAdminDepartments } from "@/lib/data/admin";
import { AdminHeader } from "@/components/admin/admin-header";
import { DepartmentsManager } from "@/components/admin/departments-manager";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Department Management | Butuan Report Admin",
  description: "Configure municipal offices, disaster agencies, and responder departments",
};

export default async function AdminDepartmentsPage() {
  const currentProfile = await getCurrentProfile();
  if (!currentProfile || currentProfile.role !== "admin") {
    redirect("/dashboard");
  }

  const departments = await getAdminDepartments();

  return (
    <>
      <AdminHeader
        title="Department Management"
        subtitle="Manage municipal departments, dispatch routing agencies, and operating statuses"
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
        <DepartmentsManager departments={departments} />
      </main>
    </>
  );
}

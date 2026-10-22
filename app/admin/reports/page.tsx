import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/data/profiles";
import { getStaffIncidentPaginatedQueue, getAssignableStaff } from "@/lib/data/staff";
import { getActiveCategories } from "@/lib/data/categories";
import { getActiveDepartments } from "@/lib/data/departments";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminReportsTable } from "@/components/admin/admin-reports-table";

interface AdminReportsPageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    severity?: string;
    category?: string;
    barangay?: string;
    sort?: string;
    page?: string;
  }>;
}

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Incident Reports Workspace | Butuan Report Admin",
  description: "Executive oversight, assignment, and management of citizen incident reports",
};

export default async function AdminReportsPage({ searchParams }: AdminReportsPageProps) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  const { q, status, severity, category, barangay, sort, page } = await searchParams;
  const currentPage = parseInt(page || "1", 10) || 1;
  const pageSize = 15;

  const [categories, departments, staffMembers, queueResult] = await Promise.all([
    getActiveCategories(),
    getActiveDepartments(),
    getAssignableStaff(),
    getStaffIncidentPaginatedQueue(profile, {
      search: q,
      status,
      severity,
      categoryId: category,
      barangay,
      sort,
      page: currentPage,
      pageSize,
    }),
  ]);

  return (
    <>
      <AdminHeader
        title="Resident Incident Reports"
        subtitle="Comprehensive triage, departmental routing, and lifecycle management for all citizen hazard reports"
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
        <AdminReportsTable
          incidents={queueResult.incidents}
          categories={categories}
          departments={departments}
          staffMembers={staffMembers}
          totalCount={queueResult.totalCount}
          currentPage={queueResult.page}
          pageSize={queueResult.pageSize}
          totalPages={queueResult.totalPages}
        />
      </main>
    </>
  );
}

import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/data/profiles";
import { getActiveDepartments } from "@/lib/data/departments";
import { getAssignableStaff } from "@/lib/data/staff";
import { getAdminAssignmentsPaginatedQueue } from "@/lib/data/admin";
import { AdminHeader } from "@/components/admin/admin-header";
import { AssignmentsTable } from "@/components/admin/assignments-table";

interface AdminAssignmentsPageProps {
  searchParams: Promise<{
    q?: string;
    dept?: string;
    responder?: string;
    status?: string;
    assignment?: string;
    page?: string;
  }>;
}

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Assignments Workspace | Butuan Report Admin",
  description: "Executive triage, department routing, and field responder assignment management",
};

export default async function AdminAssignmentsPage({ searchParams }: AdminAssignmentsPageProps) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  const { q, dept, responder, status, assignment, page } = await searchParams;
  const currentPage = parseInt(page || "1", 10) || 1;
  const pageSize = 15;

  const [departments, staffMembers, queueResult] = await Promise.all([
    getActiveDepartments(),
    getAssignableStaff(),
    getAdminAssignmentsPaginatedQueue({
      search: q,
      departmentId: dept,
      responderId: responder,
      status,
      assignmentFilter: assignment,
      page: currentPage,
      pageSize,
    }),
  ]);

  return (
    <>
      <AdminHeader
        title="Department & Responder Assignments"
        subtitle="Manage municipal agency routing, responder dispatches, and assignment lifecycle records"
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
        <AssignmentsTable
          incidents={queueResult.incidents}
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

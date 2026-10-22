import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/data/profiles";
import { getAdminResidentsPaginated } from "@/lib/data/admin";
import { AdminHeader } from "@/components/admin/admin-header";
import { ResidentsTable } from "@/components/admin/residents-table";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Residents Management | Butuan Report Admin",
  description: "Browse registered citizen profiles, review submitted report records, and manage security authorizations",
};

interface AdminResidentsPageProps {
  searchParams: Promise<{
    q?: string;
    barangay?: string;
    role?: string;
    page?: string;
  }>;
}

export default async function AdminResidentsPage({ searchParams }: AdminResidentsPageProps) {
  const currentProfile = await getCurrentProfile();
  if (!currentProfile || currentProfile.role !== "admin") {
    redirect("/dashboard");
  }

  const { q, barangay, role, page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);

  const { residents, totalCount, totalPages, pageSize } = await getAdminResidentsPaginated({
    search: q,
    barangay: barangay,
    role: role,
    page: currentPage,
    pageSize: 12,
  });

  return (
    <>
      <AdminHeader
        title="Residents Management"
        subtitle="Manage citizen profiles, inspect submitted reports, and configure account role authorizations"
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
        <ResidentsTable
          residents={residents}
          totalCount={totalCount}
          currentPage={currentPage}
          pageSize={pageSize}
          totalPages={totalPages}
          currentUserId={currentProfile.id}
        />
      </main>
    </>
  );
}

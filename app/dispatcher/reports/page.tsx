import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/data/profiles";
import { getStaffIncidentPaginatedQueue } from "@/lib/data/staff";
import { getActiveCategories } from "@/lib/data/categories";
import { DispatcherHeader } from "@/components/dispatcher/dispatcher-header";
import { DispatcherReportsTable } from "@/components/dispatcher/dispatcher-reports-table";

interface DispatcherReportsPageProps {
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
  title: "Incident Reports | Butuan Report Dispatch",
  description: "Review, filter, and dispatch civic incident reports across Butuan City",
};

export default async function DispatcherReportsPage({ searchParams }: DispatcherReportsPageProps) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "dispatcher") {
    redirect("/dashboard");
  }

  const { q, status, severity, category, barangay, sort, page } = await searchParams;
  const currentPage = parseInt(page || "1", 10) || 1;
  const pageSize = 15;

  const [categories, queueResult] = await Promise.all([
    getActiveCategories(),
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
      <DispatcherHeader
        title="Municipal Incident Reports"
        subtitle="Review, prioritize, and dispatch civic hazard reports across all 86 Butuan City barangays"
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
        <DispatcherReportsTable
          incidents={queueResult.incidents}
          categories={categories}
          totalCount={queueResult.totalCount}
          currentPage={queueResult.page}
          pageSize={queueResult.pageSize}
          totalPages={queueResult.totalPages}
        />
      </main>
    </>
  );
}

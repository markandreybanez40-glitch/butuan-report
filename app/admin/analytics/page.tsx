import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/data/profiles";
import { getAdminAnalyticsData, getAdminCategories } from "@/lib/data/admin";
import { AdminHeader } from "@/components/admin/admin-header";
import { AnalyticsView } from "@/components/admin/analytics-view";
import { resolveReportPeriod } from "@/lib/utils/report-period";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Reports & Analytics | Butuan Report Admin",
  description: "Comprehensive municipal incident metrics, resolution timelines, hazard categories, and geographic distributions",
};

interface AdminAnalyticsPageProps {
  searchParams: Promise<{
    period?: string;
    date?: string;
    month?: string;
    year?: string;
    range?: string;
    from?: string;
    to?: string;
    category?: string;
    status?: string;
    severity?: string;
    barangay?: string;
  }>;
}

export default async function AdminAnalyticsPage({ searchParams }: AdminAnalyticsPageProps) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const categories = await getAdminCategories();

  // Find category name for display in periodInfo if filtered
  const activeCategory = (categories || []).find(
    (c) => c.id === params.category || c.name.toLowerCase() === params.category?.toLowerCase()
  );

  const periodInfo = resolveReportPeriod({
    period: params.period,
    date: params.date,
    month: params.month,
    year: params.year,
    range: params.range,
    from: params.from,
    to: params.to,
    categoryName: activeCategory?.name,
    statusName: params.status,
    severityName: params.severity,
    barangayName: params.barangay,
  });

  const analyticsData = await getAdminAnalyticsData({
    dateRange: periodInfo.mode === "preset" ? periodInfo.range : undefined,
    fromDate: periodInfo.fromDate || undefined,
    toDate: periodInfo.toDate || undefined,
    categoryId: params.category,
    status: params.status,
    severity: params.severity,
    barangay: params.barangay,
  });

  return (
    <>
      <div className="no-print">
        <AdminHeader
          title="Civic Reports & Analytics"
          subtitle="Real-time incident trends, resolution duration benchmarks, and geographic distribution across Butuan City"
        />
      </div>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto print:p-0 print:m-0 print:max-w-none">
        <AnalyticsView
          analyticsData={analyticsData}
          categories={categories}
          periodInfo={periodInfo}
          adminName={profile.full_name || "Administrator"}
        />
      </main>
    </>
  );
}

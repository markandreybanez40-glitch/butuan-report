import { redirect } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Clock,
  CheckCircle2,
  Users,
  Eye,
} from "lucide-react";
import { getCurrentProfile } from "@/lib/data/profiles";
import { getAdminDashboardStats } from "@/lib/data/admin";
import { getActiveCategories } from "@/lib/data/categories";
import { getStaffIncidentPaginatedQueue } from "@/lib/data/staff";
import { AdminHeader } from "@/components/admin/admin-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportsStatusChart } from "@/components/admin/reports-status-chart";
import { DashboardRecentReports } from "@/components/admin/dashboard-recent-reports";

interface AdminDashboardPageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    category?: string;
    page?: string;
  }>;
}

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Dashboard | Butuan Report",
  description: "Executive oversight, incident triage, and management for Butuan City",
};

export default async function AdminDashboardPage({ searchParams }: AdminDashboardPageProps) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  const { q, status, category, page } = await searchParams;
  const currentPage = parseInt(page || "1", 10) || 1;
  const pageSize = 6;

  const [stats, categories, queueResult] = await Promise.all([
    getAdminDashboardStats(),
    getActiveCategories(),
    getStaffIncidentPaginatedQueue(profile, {
      search: q,
      status,
      categoryId: category,
      page: currentPage,
      pageSize,
    }),
  ]);

  return (
    <>
      <AdminHeader
        title="Dashboard"
        subtitle="Executive administrative overview and municipal service monitoring"
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* 5 KPI Cards: Total Reports, Pending Reports, Under Review, Resolved Reports, Registered Residents */}
        <section
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4"
          aria-label="Civic Incident KPIs"
        >
          {/* 1. Total Reports */}
          <Link href="/admin/reports" className="block group">
            <Card className="border-border/70 shadow-2xs group-hover:border-blue-500/50 group-hover:shadow-xs transition-all h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground group-hover:text-blue-600 transition-colors">
                  Total Reports
                </CardTitle>
                <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                  <FileText className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
                  {stats.totalReports}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 flex items-center justify-between">
                  <span>All-time filings</span>
                  <span className="text-blue-600 font-medium">View &rarr;</span>
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* 2. Pending Reports */}
          <Link href="/admin/reports?status=submitted" className="block group">
            <Card className="border-border/70 shadow-2xs group-hover:border-amber-500/50 group-hover:shadow-xs transition-all h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground group-hover:text-amber-600 transition-colors">
                  Pending Reports
                </CardTitle>
                <div className="size-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Clock className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">
                  {stats.pendingReports}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 flex items-center justify-between">
                  <span>Awaiting triage</span>
                  <span className="text-amber-600 font-medium">Triage &rarr;</span>
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* 3. Under Review */}
          <Link href="/admin/reports?status=under_review" className="block group">
            <Card className="border-border/70 shadow-2xs group-hover:border-sky-500/50 group-hover:shadow-xs transition-all h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground group-hover:text-sky-600 transition-colors">
                  Under Review
                </CardTitle>
                <div className="size-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-600 dark:text-sky-400">
                  <Eye className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-extrabold text-sky-600 dark:text-sky-400">
                  {stats.underReview}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 flex items-center justify-between">
                  <span>Being assessed</span>
                  <span className="text-sky-600 font-medium">Review &rarr;</span>
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* 4. Resolved Reports */}
          <Link href="/admin/reports?status=resolved" className="block group">
            <Card className="border-border/70 shadow-2xs group-hover:border-emerald-500/50 group-hover:shadow-xs transition-all h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground group-hover:text-emerald-600 transition-colors">
                  Resolved Reports
                </CardTitle>
                <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {stats.resolved}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Completed actions
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* 5. Registered Residents */}
          <Link href="/admin/users" className="block group col-span-2 sm:col-span-1">
            <Card className="border-border/70 shadow-2xs group-hover:border-blue-500/50 group-hover:shadow-xs transition-all h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground group-hover:text-blue-600 transition-colors">
                  Registered Residents
                </CardTitle>
                <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                  <Users className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
                  {stats.totalResidents}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 flex items-center justify-between">
                  <span>Verified citizens</span>
                  <span className="text-blue-600 font-medium">Manage &rarr;</span>
                </p>
              </CardContent>
            </Card>
          </Link>
        </section>

        {/* Below Cards: Reports Overview (Chart) & Recent Reports (Table) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Reports Overview Chart (5 cols on lg) */}
          <div className="lg:col-span-5">
            <ReportsStatusChart
              total={stats.totalReports}
              resolved={stats.resolved}
              inProgress={stats.inProgress}
              underReview={stats.underReview}
              rejected={stats.rejected}
            />
          </div>

          {/* Recent Reports Table (7 cols on lg) */}
          <div className="lg:col-span-7">
            <DashboardRecentReports
              incidents={queueResult.incidents}
              categories={categories}
              totalCount={queueResult.totalCount}
              currentPage={queueResult.page}
              pageSize={queueResult.pageSize}
              totalPages={queueResult.totalPages}
            />
          </div>
        </section>
      </main>
    </>
  );
}

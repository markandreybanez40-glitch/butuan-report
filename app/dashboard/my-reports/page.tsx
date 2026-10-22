import Link from "next/link";
import { Plus, FileText, ArrowRight, Calendar, MapPin, SearchX, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { getMyPaginatedIncidents } from "@/lib/data/incidents";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ReportsFilter } from "@/components/dashboard/reports-filter";
import { IncidentStatusBadge, IncidentSeverityBadge } from "@/components/dashboard/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Reports | Butuan Report",
  description: "Track and monitor your submitted incident reports and municipal responses",
};

interface MyReportsPageProps {
  searchParams: Promise<{
    status?: string;
    q?: string;
    page?: string;
  }>;
}

export default async function MyReportsPage({ searchParams }: MyReportsPageProps) {
  const { status, q, page } = await searchParams;
  const currentPage = parseInt(page || "1", 10) || 1;
  const pageSize = 10;

  const result = await getMyPaginatedIncidents({
    status,
    search: q,
    page: currentPage,
    pageSize,
  });

  const { reports, totalCount, totalPages } = result;
  const isFiltered = Boolean((status && status !== "all") || q);

  const startIdx = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(totalCount, currentPage * pageSize);

  const buildPageUrl = (targetPage: number) => {
    const params = new URLSearchParams();
    if (status && status !== "all") params.set("status", status);
    if (q && q.trim()) params.set("q", q.trim());
    if (targetPage > 1) params.set("page", String(targetPage));
    const qs = params.toString();
    return qs ? `/dashboard/my-reports?${qs}` : "/dashboard/my-reports";
  };

  return (
    <>
      <DashboardHeader
        title="My Reports"
        subtitle="Manage and track all incidents submitted by your account"
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Top Header & New Report Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Incident History
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Showing reports submitted by your account. Municipal responses and public milestones are updated in real time.
            </p>
          </div>

          <Link
            href="/dashboard/submit-report"
            className={cn(buttonVariants({ size: "sm" }), "rounded-full shadow-xs gap-1.5 self-start sm:self-center")}
          >
            <Plus className="size-4" />
            <span>Submit New Report</span>
          </Link>
        </div>

        {/* Search & Status Filters */}
        <ReportsFilter />

        {/* Reports Content List */}
        {reports.length === 0 ? (
          <Card className="border-dashed p-8 sm:p-12 text-center bg-card">
            <CardContent className="flex flex-col items-center justify-center p-0 space-y-4">
              <div className="size-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                {isFiltered ? <SearchX className="size-7" /> : <FileText className="size-7" />}
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h3 className="font-semibold text-foreground text-base">
                  {isFiltered ? "No matching reports found" : "You have not submitted any reports yet"}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isFiltered
                    ? "Try adjusting your search terms or clearing the status filter to view all submissions."
                    : "Help keep Butuan City safe and clean by reporting road hazards, flooding, fallen trees, or public safety issues."}
                </p>
              </div>
              <div>
                {isFiltered ? (
                  <Link
                    href="/dashboard/my-reports"
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full text-xs")}
                  >
                    Reset Filters
                  </Link>
                ) : (
                  <Link
                    href="/dashboard/submit-report"
                    className={cn(buttonVariants({ size: "sm" }), "rounded-full text-xs gap-1.5")}
                  >
                    <Plus className="size-3.5" />
                    <span>Submit Your First Report</span>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="text-xs text-muted-foreground px-1 flex items-center justify-between">
              <span>
                Showing <strong className="text-foreground">{startIdx}–{endIdx}</strong> of{" "}
                <strong className="text-foreground">{totalCount}</strong> report
                {totalCount === 1 ? "" : "s"}
              </span>
              {isFiltered && (
                <Link
                  href="/dashboard/my-reports"
                  className="text-primary hover:underline font-medium"
                >
                  Clear filters
                </Link>
              )}
            </div>

            <div className="space-y-3">
              {reports.map((report) => {
                const submittedDate = new Date(report.created_at).toLocaleDateString("en-PH", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

                const updatedDate = new Date(report.updated_at).toLocaleDateString("en-PH", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <Link
                    key={report.id}
                    href={`/dashboard/reports/${report.id}`}
                    className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
                  >
                    <Card className="border-border/80 p-4 sm:p-5 hover:border-primary/50 transition-all duration-150 hover:shadow-xs bg-card group-hover:bg-accent/5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Left info column */}
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
                              {report.report_number}
                            </span>
                            <IncidentStatusBadge status={report.status} />
                            <IncidentSeverityBadge severity={report.severity} />
                            {report.category && (
                              <Badge variant="outline" className="text-[11px] font-normal">
                                {report.category.name}
                              </Badge>
                            )}
                          </div>

                          <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors truncate">
                            {report.title}
                          </h3>

                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {report.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
                            <div className="flex items-center gap-1">
                              <MapPin className="size-3.5 shrink-0 text-muted-foreground/80" />
                              <span>
                                {report.barangay}
                                {report.landmark ? ` (${report.landmark})` : ""}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <Calendar className="size-3.5 shrink-0 text-muted-foreground/80" />
                              <span>Submitted {submittedDate}</span>
                            </div>

                            <div className="flex items-center gap-1">
                              <Clock className="size-3.5 shrink-0 text-muted-foreground/80" />
                              <span>Updated {updatedDate}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right button indicator */}
                        <div className="flex items-center self-end sm:self-center shrink-0 text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform">
                          <span>View Details</span>
                          <ArrowRight className="ml-1 size-4" />
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>

            {/* Server-Side Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 px-1 text-xs text-muted-foreground">
                <div>
                  Page <strong className="text-foreground">{currentPage}</strong> of{" "}
                  <strong className="text-foreground">{totalPages}</strong>
                </div>

                <div className="flex items-center gap-1.5">
                  {currentPage > 1 ? (
                    <Link
                      href={buildPageUrl(currentPage - 1)}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 text-xs gap-1")}
                    >
                      <ChevronLeft className="size-3.5" />
                      <span>Previous</span>
                    </Link>
                  ) : (
                    <Button variant="outline" size="sm" disabled className="h-8 text-xs gap-1">
                      <ChevronLeft className="size-3.5" />
                      <span>Previous</span>
                    </Button>
                  )}

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum = i + 1;
                      if (totalPages > 5) {
                        if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                      }
                      const isActive = pageNum === currentPage;
                      return (
                        <Link
                          key={pageNum}
                          href={buildPageUrl(pageNum)}
                          className={cn(
                            buttonVariants({
                              variant: isActive ? "default" : "outline",
                              size: "sm",
                            }),
                            "h-8 w-8 p-0 text-xs",
                            isActive ? "bg-primary text-primary-foreground font-semibold" : ""
                          )}
                        >
                          {pageNum}
                        </Link>
                      );
                    })}
                  </div>

                  {currentPage < totalPages ? (
                    <Link
                      href={buildPageUrl(currentPage + 1)}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 text-xs gap-1")}
                    >
                      <span>Next</span>
                      <ChevronRight className="size-3.5" />
                    </Link>
                  ) : (
                    <Button variant="outline" size="sm" disabled className="h-8 text-xs gap-1">
                      <span>Next</span>
                      <ChevronRight className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}

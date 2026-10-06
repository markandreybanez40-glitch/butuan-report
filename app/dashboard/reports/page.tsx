import Link from "next/link";
import { Plus, FileText, ArrowRight, Calendar, MapPin, SearchX } from "lucide-react";
import { getMyIncidents } from "@/lib/data/incidents";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ReportsFilter } from "@/components/dashboard/reports-filter";
import { IncidentStatusBadge, IncidentSeverityBadge } from "@/components/dashboard/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface MyReportsPageProps {
  searchParams: Promise<{
    status?: string;
    q?: string;
  }>;
}

export default async function MyReportsPage({ searchParams }: MyReportsPageProps) {
  const { status, q } = await searchParams;

  const reports = await getMyIncidents({
    status: status,
    search: q,
  });

  const isFiltered = Boolean((status && status !== "all") || q);

  return (
    <>
      <DashboardHeader
        title="My Reports"
        subtitle="Manage and track all incidents submitted by you"
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
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
            href="/dashboard/new"
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
          <Card className="border-dashed border-border/80 p-12 text-center bg-card/40 my-6">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
              {isFiltered ? <SearchX className="size-6" /> : <FileText className="size-6" />}
            </div>
            <h3 className="text-base font-semibold text-foreground">
              {isFiltered ? "No matching reports found" : "No reports filed yet"}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-5">
              {isFiltered
                ? "Try adjusting your search query or status filter to see other submissions."
                : "You haven't submitted any incident reports yet. When you report a civic hazard, it will appear here."}
            </p>
            {!isFiltered && (
              <Link
                href="/dashboard/new"
                className={cn(buttonVariants({ size: "sm" }), "rounded-full shadow-xs")}
              >
                <Plus className="mr-1.5 size-3.5" />
                Submit Your First Report
              </Link>
            )}
          </Card>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <Card
                key={report.id}
                className="border-border/60 transition-all hover:border-primary/40 hover:shadow-xs bg-card"
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2 min-w-0 flex-1">
                      {/* Top Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                          {report.report_number}
                        </span>
                        <IncidentStatusBadge status={report.status} />
                        <IncidentSeverityBadge severity={report.severity} />
                      </div>

                      {/* Title */}
                      <Link
                        href={`/dashboard/reports/${report.id}`}
                        className="font-semibold text-base text-foreground hover:text-primary transition-colors block line-clamp-1"
                      >
                        {report.title}
                      </Link>

                      {/* Description excerpt */}
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {report.description}
                      </p>

                      {/* Metadata Row */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                        <span className="font-medium text-foreground/80">
                          {report.category?.name || "Civic Hazard"}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3 text-muted-foreground" />
                          {report.barangay}
                          {report.street_area ? `, ${report.street_area}` : ""}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3 text-muted-foreground" />
                          {new Date(report.created_at).toLocaleDateString("en-PH", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* View Action */}
                    <div className="shrink-0 self-end sm:self-center">
                      <Link
                        href={`/dashboard/reports/${report.id}`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-lg text-xs gap-1.5")}
                      >
                        <span>View Details</span>
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

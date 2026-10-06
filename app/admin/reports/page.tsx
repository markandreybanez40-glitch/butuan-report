import Link from "next/link";
import { redirect } from "next/navigation";
import {
  MapPin,
  Calendar,
  ArrowRight,
  Inbox,
  Building2,
  UserCheck,
} from "lucide-react";
import { getCurrentProfile } from "@/lib/data/profiles";
import { getStaffIncidentQueue } from "@/lib/data/staff";
import { getActiveCategories } from "@/lib/data/categories";
import { AdminHeader } from "@/components/admin/admin-header";
import { StaffQueueFilter } from "@/components/staff/staff-queue-filter";
import { IncidentStatusBadge, IncidentSeverityBadge } from "@/components/dashboard/status-badge";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AdminReportsPageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    severity?: string;
    category?: string;
    barangay?: string;
  }>;
}

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Incident Reports Workspace | Butuan Report Admin",
  description: "Executive oversight, assignment, and management of resident incident reports",
};

export default async function AdminReportsPage({ searchParams }: AdminReportsPageProps) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  const { q, status, severity, category, barangay } = await searchParams;

  const categories = await getActiveCategories();
  const incidents = await getStaffIncidentQueue(profile, {
    search: q,
    status,
    severity,
    categoryId: category,
    barangay,
  });

  return (
    <>
      <AdminHeader
        title="Resident Incident Reports"
        subtitle="Manage and triage all civic reports submitted by citizens across Butuan City"
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Filters and Search Bar */}
        <StaffQueueFilter categories={categories} />

        {/* Incidents Count Summary */}
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>
            Showing <strong className="text-foreground">{incidents.length}</strong> incident report{incidents.length === 1 ? "" : "s"}
          </span>
          {(q || status || severity || category || barangay) && (
            <Link
              href="/admin/reports"
              className="text-purple-600 dark:text-purple-400 hover:underline font-medium"
            >
              Clear all filters
            </Link>
          )}
        </div>

        {/* Incidents List / Table */}
        {incidents.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-border/80 flex flex-col items-center justify-center space-y-3">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <Inbox className="size-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">No reports match your filters</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Try adjusting your search criteria, clearing the status filter, or checking for newly submitted reports.
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {incidents.map((incident) => {
              const dateStr = new Date(incident.created_at).toLocaleDateString("en-PH", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              // Extract active assignment
              const activeAssignment = incident.assignments?.find(
                (a) => a.unassigned_at === null
              );

              return (
                <Card
                  key={incident.id}
                  className="p-4 sm:p-5 hover:border-purple-500/40 transition-colors shadow-2xs group border-border/70"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    {/* Left: Info */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                          {incident.report_number}
                        </span>
                        <IncidentStatusBadge status={incident.status} />
                        <IncidentSeverityBadge severity={incident.severity} />
                        {incident.category && (
                          <Badge variant="outline" className="text-[11px] font-normal">
                            {incident.category.name}
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-foreground leading-snug group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {incident.title}
                      </h3>

                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {incident.description}
                      </p>

                      {/* Location & Metadata Bar */}
                      <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-muted-foreground pt-1">
                        <div className="flex items-center gap-1">
                          <MapPin className="size-3.5 shrink-0 text-muted-foreground/80" />
                          <span>
                            {incident.barangay}
                            {incident.landmark ? ` (${incident.landmark})` : ""}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Calendar className="size-3.5 shrink-0 text-muted-foreground/80" />
                          <span>{dateStr}</span>
                        </div>

                        {incident.reporter && (
                          <div className="flex items-center gap-1 text-[11px]">
                            <span>Reporter:</span>
                            <strong className="text-foreground">{incident.reporter.full_name}</strong>
                          </div>
                        )}
                      </div>

                      {/* Assignment status badge */}
                      {activeAssignment ? (
                        <div className="inline-flex items-center gap-2 pt-1 text-xs">
                          <span className="text-muted-foreground">Assigned to:</span>
                          <Badge
                            variant="secondary"
                            className="text-[11px] font-medium flex items-center gap-1 bg-muted/80 text-foreground"
                          >
                            <Building2 className="size-3 text-purple-600 dark:text-purple-400" />
                            {activeAssignment.department?.name || "Unassigned Dept"}
                          </Badge>
                          {activeAssignment.assigned_user && (
                            <Badge
                              variant="outline"
                              className="text-[11px] font-medium flex items-center gap-1"
                            >
                              <UserCheck className="size-3 text-blue-500" />
                              {activeAssignment.assigned_user.full_name}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <div className="pt-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                          &bull; Pending departmental assignment
                        </div>
                      )}
                    </div>

                    {/* Right: Review Action */}
                    <div className="flex items-center sm:self-center shrink-0 pt-2 sm:pt-0">
                      <Link
                        href={`/admin/reports/${incident.id}`}
                        className={cn(
                          buttonVariants({ size: "sm" }),
                          "bg-purple-600 hover:bg-purple-700 text-white shadow-xs flex items-center gap-1.5 w-full sm:w-auto"
                        )}
                      >
                        <span>Manage Report</span>
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}

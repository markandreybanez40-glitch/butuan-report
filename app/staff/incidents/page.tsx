import Link from "next/link";
import {
  MapPin,
  Calendar,
  ArrowRight,
  Inbox,
} from "lucide-react";
import { getCurrentProfile } from "@/lib/data/profiles";
import { getStaffIncidentQueue } from "@/lib/data/staff";
import { getActiveCategories } from "@/lib/data/categories";
import { StaffHeader } from "@/components/staff/staff-header";
import { StaffQueueFilter } from "@/components/staff/staff-queue-filter";
import { IncidentStatusBadge, IncidentSeverityBadge } from "@/components/dashboard/status-badge";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

interface StaffIncidentsPageProps {
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
  title: "Incident Queue | Butuan Report",
  description: "Municipal incident queue, search, and department triage",
};

export default async function StaffIncidentsPage({ searchParams }: StaffIncidentsPageProps) {
  const profile = await getCurrentProfile();
  if (!profile) return null;

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
      <StaffHeader
        title="Incident Queue"
        subtitle={
          profile.role === "responder"
            ? "Incidents assigned to your response unit"
            : "Review, assign, and update civic incident reports"
        }
        role={profile.role as UserRole}
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Filters and Search Bar */}
        <StaffQueueFilter categories={categories} />

        {/* Counter and Results */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Showing <strong className="text-foreground">{incidents.length}</strong> incident(s) in queue
          </div>
        </div>

        {incidents.length === 0 ? (
          <Card className="border-dashed p-12 text-center space-y-3">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <Inbox className="size-6" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">No Incidents Found</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              No reports match your current filter parameters. Try adjusting your search query, status, or category filter.
            </p>
            <div className="pt-2">
              <Link
                href="/staff/incidents"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full text-xs")}
              >
                Clear All Filters
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {incidents.map((incident) => {
              const activeAssignment = incident.assignments.find((a) => a.unassigned_at === null);
              const assignedLabel = activeAssignment?.department?.name ||
                activeAssignment?.assigned_user?.full_name ||
                "Unassigned";

              const formattedDate = new Date(incident.created_at).toLocaleDateString("en-PH", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={incident.id}
                  className="rounded-xl border border-border/80 bg-card p-4 transition-all hover:border-primary/50 hover:shadow-xs"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Identifiers & Main Information */}
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-extrabold text-primary">
                          {incident.report_number}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs font-medium text-muted-foreground">
                          {incident.category?.name || "Civic Hazard"}
                        </span>
                        <IncidentSeverityBadge severity={incident.severity} />
                        <IncidentStatusBadge status={incident.status} />
                      </div>

                      <Link
                        href={`/staff/incidents/${incident.id}`}
                        className="block text-sm font-bold text-foreground hover:text-primary transition-colors truncate"
                      >
                        {incident.title}
                      </Link>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3 text-primary shrink-0" />
                          <span>{incident.barangay}</span>
                          {incident.street_area && <span>({incident.street_area})</span>}
                        </span>

                        <span className="flex items-center gap-1">
                          <Calendar className="size-3 shrink-0" />
                          <span>{formattedDate}</span>
                        </span>

                        {incident.reporter && (
                          <span className="text-[11px] text-muted-foreground">
                            Reporter: <strong>{incident.reporter.full_name}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Assigned Entity & Action Button */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/50">
                      <div className="text-left lg:text-right">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                          Assignment
                        </span>
                        <span
                          className={cn(
                            "text-xs font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5",
                            activeAssignment
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {assignedLabel}
                        </span>
                      </div>

                      <Link
                        href={`/staff/incidents/${incident.id}`}
                        className={cn(
                          buttonVariants({ size: "sm" }),
                          "rounded-full gap-1.5 shadow-xs text-xs px-4"
                        )}
                      >
                        <span>Manage</span>
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}

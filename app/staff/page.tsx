import Link from "next/link";
import {
  Clock,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
  ArrowRight,
  ShieldAlert,
  MapPin,
  Calendar,
} from "lucide-react";
import { getCurrentProfile } from "@/lib/data/profiles";
import { getStaffIncidentStats, getStaffIncidentQueue } from "@/lib/data/staff";
import { StaffHeader } from "@/components/staff/staff-header";
import { IncidentStatusBadge, IncidentSeverityBadge } from "@/components/dashboard/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Staff Dashboard | Butuan Report",
  description: "Operations overview and incident queue management",
};

export default async function StaffOverviewPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const stats = await getStaffIncidentStats(profile);
  const recentIncidents = await getStaffIncidentQueue(profile, { limit: 6 });
  const criticalIncidents = await getStaffIncidentQueue(profile, { severity: "critical", limit: 3 });

  const roleTitle = {
    dispatcher: "City Dispatch Operations",
    responder: "Field Responder Center",
    admin: "Municipal Administration",
    resident: "Resident View",
  }[profile.role];

  return (
    <>
      <StaffHeader
        title={roleTitle}
        subtitle={
          profile.role === "responder"
            ? "Your assigned active incident response and operational tasks"
            : "Centralized incident triage, department assignment, and monitoring"
        }
        role={profile.role as UserRole}
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Welcome Banner */}
        <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-5 text-primary" />
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                Welcome back, {profile.full_name}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
              {profile.role === "responder"
                ? "You are logged in as an active Field Responder. Below are the civic hazards currently assigned to your team."
                : "Operational queue is active. You have full dispatcher privileges to triage submitted reports, coordinate departmental assignments, and publish citizen updates."}
            </p>
          </div>

          <Link
            href="/staff/incidents"
            className={cn(buttonVariants({ size: "sm" }), "rounded-full gap-1.5 shadow-sm self-start md:self-center")}
          >
            <span>View Full Queue</span>
            <ArrowRight className="size-4" />
          </Link>
        </section>

        {/* Minimal Summary Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Queue */}
          <Card className="border-border/70 shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {profile.role === "responder" ? "Assigned Incidents" : "Total Queue"}
              </CardTitle>
              <ClipboardList className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.total}</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {profile.role === "responder" ? "Under your response unit" : "All tracked municipal incidents"}
              </p>
            </CardContent>
          </Card>

          {/* Awaiting Review */}
          <Card className="border-border/70 shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {profile.role === "responder" ? "New Assignments" : "Awaiting Review"}
              </CardTitle>
              <Clock className="size-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {profile.role === "responder" ? stats.assigned : stats.submitted}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {profile.role === "responder" ? "Assigned tickets pending action" : "Submitted citizen reports"}
              </p>
            </CardContent>
          </Card>

          {/* In Progress */}
          <Card className="border-border/70 shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                In Progress
              </CardTitle>
              <Activity className="size-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.inProgress}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Active municipal work crews
              </p>
            </CardContent>
          </Card>

          {/* Resolved */}
          <Card className="border-border/70 shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Resolved & Closed
              </CardTitle>
              <CheckCircle2 className="size-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {stats.resolved + stats.closed}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Completed hazard interventions
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Critical Hazards Notice (if active) */}
        {criticalIncidents.length > 0 && (
          <aside className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 space-y-3">
            <div className="flex items-center gap-2 text-destructive dark:text-red-300 font-semibold text-xs sm:text-sm">
              <AlertTriangle className="size-4.5" />
              <span>Priority Alert: {criticalIncidents.length} Critical Incident(s) in Queue</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {criticalIncidents.map((incident) => (
                <Link
                  key={incident.id}
                  href={`/staff/incidents/${incident.id}`}
                  className="rounded-lg bg-background p-3 border border-destructive/20 hover:border-destructive/50 transition-colors block text-xs space-y-1"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-destructive">{incident.report_number}</span>
                    <IncidentStatusBadge status={incident.status} />
                  </div>
                  <p className="font-medium text-foreground truncate">{incident.title}</p>
                  <p className="text-[10px] text-muted-foreground">{incident.barangay}</p>
                </Link>
              ))}
            </div>
          </aside>
        )}

        {/* Recent Incidents Queue */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground">Recent Incidents</h3>
              <p className="text-xs text-muted-foreground">
                Latest reports filed across Butuan City barangays
              </p>
            </div>
            <Link
              href="/staff/incidents"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>

          {recentIncidents.length === 0 ? (
            <Card className="border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">
                {profile.role === "responder"
                  ? "No incidents are currently assigned to you."
                  : "No incident reports logged in the queue yet."}
              </p>
            </Card>
          ) : (
            <div className="grid gap-3">
              {recentIncidents.map((incident) => {
                const activeAssignment = incident.assignments.find((a) => a.unassigned_at === null);
                const assignedLabel = activeAssignment?.department?.name ||
                  activeAssignment?.assigned_user?.full_name ||
                  "Unassigned";

                return (
                  <Link
                    key={incident.id}
                    href={`/staff/incidents/${incident.id}`}
                    className="group rounded-xl border border-border/80 bg-card p-4 transition-all hover:border-primary/50 hover:shadow-xs block"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-extrabold text-primary">
                            {incident.report_number}
                          </span>
                          <span className="text-xs font-medium text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {incident.category?.name || "Civic Hazard"}
                          </span>
                          <IncidentSeverityBadge severity={incident.severity} />
                          <IncidentStatusBadge status={incident.status} />
                        </div>

                        <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                          {incident.title}
                        </h4>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3 text-primary shrink-0" />
                            <span>{incident.barangay}</span>
                          </span>

                          <span className="flex items-center gap-1">
                            <Calendar className="size-3 shrink-0" />
                            <span>
                              {new Date(incident.created_at).toLocaleDateString("en-PH", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </span>

                          <span className="text-[11px] font-medium text-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                            Assigned: {assignedLabel}
                          </span>
                        </div>
                      </div>

                      <div className="self-end sm:self-center shrink-0">
                        <span className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full text-xs gap-1")}>
                          <span>Manage</span>
                          <ArrowRight className="size-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </>
  );
}

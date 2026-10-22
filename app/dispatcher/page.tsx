import Link from "next/link";
import {
  ClipboardList,
  Clock,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Radio,
  MapPin,
  Calendar,
  Building2,
  UserCheck,
  Inbox,
  AlertCircle,
} from "lucide-react";
import { getCurrentProfile } from "@/lib/data/profiles";
import { getStaffIncidentStats, getStaffIncidentPaginatedQueue } from "@/lib/data/staff";
import { DispatcherHeader } from "@/components/dispatcher/dispatcher-header";
import { IncidentStatusBadge, IncidentSeverityBadge } from "@/components/dashboard/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dispatcher Command Center | Butuan Report",
  description: "Centralized incident triage, assignment routing, and operational status tracking",
};

export default async function DispatcherOverviewPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const [stats, recentQueue, criticalQueue] = await Promise.all([
    getStaffIncidentStats(profile),
    getStaffIncidentPaginatedQueue(profile, { pageSize: 8, sort: "newest" }),
    getStaffIncidentPaginatedQueue(profile, { severity: "critical", pageSize: 4 }),
  ]);

  return (
    <>
      <DispatcherHeader
        title="Municipal Dispatch Operations"
        subtitle="Centralized incident triage, rapid response routing, and municipal dispatch"
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Operations Welcome Banner */}
        <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Radio className="size-5 text-amber-600 dark:text-amber-400" />
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                Dispatcher Console: {profile.full_name}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Review incoming civic reports, route incidents to response units (CDRRMO, CEO, City ENRO, CHO, CGSO), and keep reporting citizens updated in real time.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <Link
              href="/dispatcher/assignments"
              className={cn(buttonVariants({ size: "sm" }), "bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold gap-1.5 shadow-xs")}
            >
              <span>Assignment Board</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </section>

        {/* 4 KPI Summary Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Queue */}
          <Link href="/dispatcher/reports" className="block group">
            <Card className="border-border/70 shadow-2xs group-hover:border-amber-500/50 transition-colors h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground group-hover:text-amber-600 transition-colors">
                  Total Reports
                </CardTitle>
                <div className="size-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <ClipboardList className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
                  {stats.total}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 flex items-center justify-between">
                  <span>All active city records</span>
                  <span className="text-amber-600 font-medium">View &rarr;</span>
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Pending Triage */}
          <Link href="/dispatcher/reports?status=submitted" className="block group">
            <Card className="border-border/70 shadow-2xs group-hover:border-amber-500/50 transition-colors h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground group-hover:text-amber-600 transition-colors">
                  Pending Review
                </CardTitle>
                <div className="size-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Clock className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">
                  {stats.submitted}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 flex items-center justify-between">
                  <span>Awaiting initial triage</span>
                  <span className="text-amber-600 font-medium">Triage &rarr;</span>
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* In Progress */}
          <Link href="/dispatcher/reports?status=assigned,in_progress" className="block group">
            <Card className="border-border/70 shadow-2xs group-hover:border-sky-500/50 transition-colors h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground group-hover:text-sky-600 transition-colors">
                  In Progress
                </CardTitle>
                <div className="size-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-600 dark:text-sky-400">
                  <Activity className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-extrabold text-sky-600 dark:text-sky-400">
                  {stats.inProgress + stats.assigned}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 flex items-center justify-between">
                  <span>Assigned to responders</span>
                  <span className="text-sky-600 font-medium">Track &rarr;</span>
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Resolved */}
          <Link href="/dispatcher/reports?status=resolved,closed" className="block group">
            <Card className="border-border/70 shadow-2xs group-hover:border-emerald-500/50 transition-colors h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground group-hover:text-emerald-600 transition-colors">
                  Resolved
                </CardTitle>
                <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {stats.resolved + stats.closed}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Completed resolutions
                </p>
              </CardContent>
            </Card>
          </Link>
        </section>

        {/* Priority / Critical Hazards Alert */}
        {criticalQueue.incidents.length > 0 && (
          <section className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 space-y-3">
            <div className="flex items-center gap-2 text-destructive dark:text-red-300 font-bold text-xs sm:text-sm">
              <AlertTriangle className="size-4.5" />
              <span>Priority Action: {criticalQueue.totalCount} Critical Incident(s) in City</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {criticalQueue.incidents.map((incident) => (
                <Link
                  key={incident.id}
                  href={`/dispatcher/reports/${incident.id}`}
                  className="rounded-lg bg-card p-3 border border-destructive/20 hover:border-destructive/50 transition-colors block text-xs space-y-1.5 shadow-2xs"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-destructive">{incident.report_number}</span>
                    <IncidentStatusBadge status={incident.status} />
                  </div>
                  <p className="font-bold text-foreground truncate">{incident.title}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{incident.barangay}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Incident Dispatch Queue */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                  Incoming Incident Stream
                </h3>
                <Badge variant="outline" className="text-[10px] font-mono px-2 py-0 border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5">
                  Live Stream
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Review, assign responsible departments, and coordinate municipal field response
              </p>
            </div>
            <Link
              href="/dispatcher/reports"
              className={cn(buttonVariants({ size: "sm" }), "bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold gap-1.5 shadow-xs self-start sm:self-center")}
            >
              <span>View All Reports</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {recentQueue.incidents.length === 0 ? (
            <Card className="border-dashed p-10 text-center bg-card/50">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mx-auto mb-3">
                <Inbox className="size-6" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">No reports currently in queue</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                Citizen incident submissions will automatically stream in here in real time.
              </p>
            </Card>
          ) : (
            <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-2xs divide-y divide-border/60">
              {recentQueue.incidents.map((incident) => {
                const dateStr = new Date(incident.created_at).toLocaleDateString("en-PH", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                const activeAssignment = incident.assignments?.find(
                  (a) => a.unassigned_at === null
                );
                const isCritical = incident.severity === "critical";

                return (
                  <div
                    key={incident.id}
                    className={cn(
                      "p-4 transition-colors hover:bg-muted/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4",
                      isCritical ? "bg-destructive/5" : ""
                    )}
                  >
                    {/* Left Details */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                          {incident.report_number}
                        </span>
                        <IncidentStatusBadge status={incident.status} />
                        <IncidentSeverityBadge severity={incident.severity} />
                        {incident.category && (
                          <Badge variant="outline" className="text-[11px] font-normal">
                            {incident.category.name}
                          </Badge>
                        )}
                        {isCritical && (
                          <Badge variant="destructive" className="text-[10px] py-0 px-1.5 gap-1 font-semibold">
                            <AlertCircle className="size-3" />
                            Urgent
                          </Badge>
                        )}
                      </div>

                      <Link
                        href={`/dispatcher/reports/${incident.id}`}
                        className="font-bold text-sm sm:text-base text-foreground hover:text-amber-600 dark:hover:text-amber-400 transition-colors line-clamp-1 block"
                      >
                        {incident.title}
                      </Link>

                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed max-w-3xl">
                        {incident.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-0.5">
                        <div className="flex items-center gap-1">
                          <MapPin className="size-3 text-muted-foreground" />
                          <span>{incident.barangay}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Calendar className="size-3 text-muted-foreground" />
                          <span>{dateStr}</span>
                        </div>

                        {activeAssignment ? (
                          <div className="flex items-center gap-1 text-[11px] text-foreground font-medium">
                            <Building2 className="size-3 text-amber-600 dark:text-amber-400" />
                            <span>{activeAssignment.department?.name || "Assigned Dept"}</span>
                            {activeAssignment.assigned_user && (
                              <span className="text-muted-foreground">({activeAssignment.assigned_user.full_name})</span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                            <UserCheck className="size-3" />
                            <span>Unassigned</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Dispatch Action */}
                    <div className="shrink-0 self-end lg:self-center">
                      <Link
                        href={`/dispatcher/reports/${incident.id}`}
                        className={cn(
                          buttonVariants({ size: "sm" }),
                          "bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold gap-1.5 shadow-xs"
                        )}
                      >
                        <span>Manage & Dispatch</span>
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </>
  );
}

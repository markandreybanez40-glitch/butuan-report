import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import {
  Plus,
  FileText,
  Clock,
  Activity,
  CheckCircle2,
  AlertCircle,
  Bell,
  ArrowRight,
  MapPin,
  Calendar,
  Sparkles,
} from "lucide-react";
import { getCurrentProfile } from "@/lib/data/profiles";
import { getResidentIncidentStats, getMyIncidents } from "@/lib/data/incidents";
import { getMyNotifications } from "@/lib/data/notifications";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { IncidentStatusBadge, IncidentSeverityBadge } from "@/components/dashboard/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const user = await currentUser();
  const profile = await getCurrentProfile();
  const stats = await getResidentIncidentStats();
  const recentReports = await getMyIncidents({ limit: 5 });
  const notifications = await getMyNotifications(4);

  const displayName = profile?.full_name || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Resident";
  const barangay = profile?.barangay || "Butuan City";

  return (
    <>
      <DashboardHeader
        title="Dashboard Overview"
        subtitle={`Welcome back, ${displayName}`}
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl w-full mx-auto">
        {/* Welcome Section */}
        <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-r from-card via-card to-primary/5 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Kumusta, {displayName}!
                </span>
                <Badge variant="outline" className="gap-1 border-primary/30 text-primary bg-primary/5 text-xs">
                  <Sparkles className="size-3" />
                  Resident Reporter
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground max-w-xl">
                Track your active civic incident reports and stay updated on municipal resolution efforts across Butuan City.
              </p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                <MapPin className="size-3.5 text-primary" />
                <span>Primary Area: <strong>{barangay}</strong></span>
              </div>
            </div>

            {/* Prominent New Report Button */}
            <div className="shrink-0">
              <Link
                href="/dashboard/new"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "rounded-full px-6 shadow-md gap-2 w-full sm:w-auto font-semibold"
                )}
              >
                <Plus className="size-4" />
                <span>Submit New Report</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <section aria-label="Incident Summary Statistics">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {/* Total Reports */}
            <Card className="border-border/70 bg-card/70 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Total Reports
                </CardTitle>
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <FileText className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
                  {stats.total}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  All community filings submitted by you
                </p>
              </CardContent>
            </Card>

            {/* Under Review */}
            <Card className="border-border/70 bg-card/70 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Under Review
                </CardTitle>
                <div className="size-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Clock className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
                  {stats.underReview}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Awaiting dispatcher evaluation
                </p>
              </CardContent>
            </Card>

            {/* In Progress */}
            <Card className="border-border/70 bg-card/70 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  In Progress
                </CardTitle>
                <div className="size-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-600 dark:text-sky-400">
                  <Activity className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
                  {stats.inProgress}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Assigned to field responders
                </p>
              </CardContent>
            </Card>

            {/* Resolved */}
            <Card className="border-border/70 bg-card/70 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Resolved
                </CardTitle>
                <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
                  {stats.resolved}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Completed on-site resolutions
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Main Content Grid: Recent Reports & Notifications Preview */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Recent Reports Section (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-foreground">
                  Recent Reports
                </h2>
                <p className="text-xs text-muted-foreground">
                  Your most recent incident submissions
                </p>
              </div>
              <Link
                href="/dashboard/reports"
                className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
              >
                <span>View all reports</span>
                <ArrowRight className="size-3" />
              </Link>
            </div>

            {recentReports.length === 0 ? (
              /* Empty State */
              <Card className="border-dashed border-border/80 p-8 text-center bg-card/40">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
                  <FileText className="size-6" />
                </div>
                <h3 className="text-base font-semibold text-foreground">No reports filed yet</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-5">
                  Spot a broken road, clogged drainage, or civic hazard? Submit your first report to help improve our community.
                </p>
                <Link
                  href="/dashboard/new"
                  className={cn(buttonVariants({ size: "sm" }), "rounded-full shadow-xs")}
                >
                  <Plus className="mr-1.5 size-3.5" />
                  Report an Incident
                </Link>
              </Card>
            ) : (
              <div className="space-y-3">
                {recentReports.map((report) => (
                  <Card
                    key={report.id}
                    className="border-border/60 transition-all hover:border-primary/40 hover:shadow-xs bg-card"
                  >
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-primary">
                              {report.report_number}
                            </span>
                            <IncidentStatusBadge status={report.status} />
                            <IncidentSeverityBadge severity={report.severity} />
                          </div>
                          <Link
                            href={`/dashboard/reports/${report.id}`}
                            className="font-semibold text-sm sm:text-base text-foreground hover:text-primary transition-colors line-clamp-1 block"
                          >
                            {report.title}
                          </Link>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground/80">
                              {report.category?.name || "Civic Hazard"}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="size-3 text-muted-foreground" />
                              {report.barangay}
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

                        <div className="shrink-0 self-end sm:self-center">
                          <Link
                            href={`/dashboard/reports/${report.id}`}
                            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-lg text-xs gap-1")}
                          >
                            <span>Details</span>
                            <ArrowRight className="size-3" />
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Preview (1 Col) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                  <Bell className="size-4 text-primary" />
                  Notifications
                </h2>
                <p className="text-xs text-muted-foreground">
                  Updates on your submitted reports
                </p>
              </div>
            </div>

            <Card className="border-border/60 bg-card">
              <CardContent className="p-4 space-y-3">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    <CheckCircle2 className="size-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p className="font-medium text-foreground/80">All caught up</p>
                    <p className="mt-0.5">No new notifications at this time.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        "p-3 rounded-lg border border-border/50 text-xs transition-colors",
                        n.read_at ? "bg-muted/30" : "bg-primary/5 border-primary/20"
                      )}
                    >
                      <div className="flex items-center justify-between font-semibold text-foreground">
                        <span className="truncate">{n.title}</span>
                        {!n.read_at && (
                          <span className="size-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-muted-foreground/70 block mt-2">
                        {new Date(n.created_at).toLocaleDateString("en-PH", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Quick Emergency Assistance Card */}
            <Card className="border-destructive/20 bg-destructive/5 text-destructive dark:text-red-300">
              <CardContent className="p-4 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertCircle className="size-4 shrink-0 text-destructive" />
                  <span>Immediate Emergency?</span>
                </div>
                <p className="leading-relaxed opacity-90">
                  Do not wait for portal responses if lives are in danger. Call <strong>911</strong> or Butuan CDRRMO at <strong>(085) 341-1111</strong> immediately.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}

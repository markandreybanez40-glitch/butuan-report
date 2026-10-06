import Link from "next/link";
import {
  FileText,
  Clock,
  CheckCircle2,
  Users,
  Building2,
  Tags,
  ScrollText,
  ArrowRight,
  Activity,
} from "lucide-react";
import { getAdminDashboardStats } from "@/lib/data/admin";
import { AdminHeader } from "@/components/admin/admin-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Dashboard | Butuan Report",
  description: "Municipal operations overview, KPIs, and audit feed",
};

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();

  return (
    <>
      <AdminHeader
        title="Administrative Command Center"
        subtitle="Executive oversight of incidents, staff access, and municipal configurations"
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* KPI Summary Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Incidents */}
          <Card className="border-border/70 shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Total Incidents
              </CardTitle>
              <FileText className="size-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalIncidents}</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                All-time civic hazard reports
              </p>
            </CardContent>
          </Card>

          {/* Open / In-Progress */}
          <Card className="border-border/70 shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Active Operations
              </CardTitle>
              <Clock className="size-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {stats.openIncidents}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Pending triage or dispatched
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
                {stats.resolvedIncidents}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Completed incident resolutions
              </p>
            </CardContent>
          </Card>

          {/* Active Staff / Users */}
          <Card className="border-border/70 shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Staff & Citizens
              </CardTitle>
              <Users className="size-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats.totalStaff}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  / {stats.totalUsers} total
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Responders, dispatchers, & admins
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Administration Hub Quick Navigation */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Link
            href="/admin/users"
            className="group rounded-xl border border-border/80 bg-card p-4 hover:border-purple-500/50 hover:shadow-xs transition-all space-y-2 block"
          >
            <div className="size-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Users className="size-4" />
            </div>
            <h3 className="text-sm font-bold text-foreground group-hover:text-purple-600 transition-colors flex items-center justify-between">
              <span>User Authorization</span>
              <ArrowRight className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-muted-foreground">
              Authorize staff roles (responders, dispatchers, admins) and inspect resident accounts.
            </p>
          </Link>

          <Link
            href="/admin/departments"
            className="group rounded-xl border border-border/80 bg-card p-4 hover:border-purple-500/50 hover:shadow-xs transition-all space-y-2 block"
          >
            <div className="size-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Building2 className="size-4" />
            </div>
            <h3 className="text-sm font-bold text-foreground group-hover:text-blue-600 transition-colors flex items-center justify-between">
              <span>Departments</span>
              <ArrowRight className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-muted-foreground">
              Manage {stats.activeDepartments} municipal offices (CDRRMO, CEO, City ENRO, CHO, CGSO).
            </p>
          </Link>

          <Link
            href="/admin/categories"
            className="group rounded-xl border border-border/80 bg-card p-4 hover:border-purple-500/50 hover:shadow-xs transition-all space-y-2 block"
          >
            <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Tags className="size-4" />
            </div>
            <h3 className="text-sm font-bold text-foreground group-hover:text-emerald-600 transition-colors flex items-center justify-between">
              <span>Categories</span>
              <ArrowRight className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-muted-foreground">
              Configure {stats.activeCategories} public reporting hazard types and classification rules.
            </p>
          </Link>

          <Link
            href="/admin/audit-logs"
            className="group rounded-xl border border-border/80 bg-card p-4 hover:border-purple-500/50 hover:shadow-xs transition-all space-y-2 block"
          >
            <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <ScrollText className="size-4" />
            </div>
            <h3 className="text-sm font-bold text-foreground group-hover:text-amber-600 transition-colors flex items-center justify-between">
              <span>Audit Logs</span>
              <ArrowRight className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-muted-foreground">
              Immutable, append-only security logs for role updates and master data changes.
            </p>
          </Link>
        </section>

        {/* Recent Audit Activity */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground">Recent Security & Operational Audit Log</h3>
              <p className="text-xs text-muted-foreground">
                Append-only record of administrative actions and system modifications
              </p>
            </div>
            <Link
              href="/admin/audit-logs"
              className="text-xs font-semibold text-purple-600 hover:underline flex items-center gap-1"
            >
              <span>View Full Audit Trail</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>

          {stats.recentActivity.length === 0 ? (
            <Card className="border-dashed p-8 text-center">
              <p className="text-xs text-muted-foreground">
                No administrative actions or audit records logged yet.
              </p>
            </Card>
          ) : (
            <div className="rounded-xl border border-border/70 bg-card divide-y divide-border/60 overflow-hidden shadow-2xs">
              {stats.recentActivity.map((log) => {
                const dateStr = new Date(log.created_at).toLocaleDateString("en-PH", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div key={log.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-7 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                        <Activity className="size-3.5" />
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">
                            {log.action.toUpperCase().replace(/_/g, " ")}
                          </span>
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-mono">
                            {log.entity_type}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Actor: <strong>{log.actor?.full_name || "System"}</strong> ({log.actor?.role || "SYSTEM"})
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 self-start sm:self-center font-mono">
                      {dateStr}
                    </span>
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

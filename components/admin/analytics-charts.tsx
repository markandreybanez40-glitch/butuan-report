"use client";

import {
  BarChart3,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Eye,
  XCircle,
  MapPin,
  Tags,
  ShieldAlert,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AdminAnalyticsData } from "@/lib/data/admin";

interface AnalyticsChartsProps {
  data: AdminAnalyticsData;
}

export function AnalyticsCharts({ data }: AnalyticsChartsProps) {
  const safeTotal = Math.max(1, data.totalReports);

  const statusList = [
    {
      label: "Resolved",
      count: data.statusBreakdown.resolved + data.statusBreakdown.closed,
      detail: `${data.statusBreakdown.resolved} resolved, ${data.statusBreakdown.closed} closed`,
      color: "bg-emerald-500",
      textColor: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
      icon: CheckCircle2,
    },
    {
      label: "In Progress / Assigned",
      count: data.statusBreakdown.assigned + data.statusBreakdown.in_progress,
      detail: `${data.statusBreakdown.in_progress} in progress, ${data.statusBreakdown.assigned} assigned`,
      color: "bg-blue-600",
      textColor: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      icon: Activity,
    },
    {
      label: "Under Review / Pending",
      count: data.statusBreakdown.submitted + data.statusBreakdown.under_review,
      detail: `${data.statusBreakdown.submitted} submitted, ${data.statusBreakdown.under_review} under review`,
      color: "bg-amber-500",
      textColor: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
      icon: Eye,
    },
    {
      label: "Rejected / Duplicate",
      count:
        data.statusBreakdown.rejected +
        data.statusBreakdown.duplicate +
        data.statusBreakdown.cancelled,
      detail: `${data.statusBreakdown.rejected} rejected, ${data.statusBreakdown.duplicate} duplicate`,
      color: "bg-red-500",
      textColor: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
      icon: XCircle,
    },
  ];

  if (data.error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive dark:text-red-300 flex items-start gap-2.5 shadow-xs">
        <AlertTriangle className="size-4 shrink-0 mt-0.5" />
        <div className="flex-1 space-y-1">
          <strong className="block font-semibold">Unable to Load Incident Analytics</strong>
          <p className="text-muted-foreground">{data.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Top KPI Summary Cards: Total Reports, Pending, In Progress, Resolved */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Reports */}
        <Card className="border-border/70 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Total Reports
            </CardTitle>
            <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <BarChart3 className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
              {data.totalReports}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Matching active filter criteria
            </p>
          </CardContent>
        </Card>

        {/* Pending Reports */}
        <Card className="border-border/70 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Pending Reports
            </CardTitle>
            <div className="size-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">
              {data.pendingCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {data.statusBreakdown.submitted} submitted, {data.statusBreakdown.under_review} under review
            </p>
          </CardContent>
        </Card>

        {/* In Progress */}
        <Card className="border-border/70 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              In Progress
            </CardTitle>
            <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Activity className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400">
              {data.inProgressCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {data.statusBreakdown.in_progress} active, {data.statusBreakdown.assigned} assigned
            </p>
          </CardContent>
        </Card>

        {/* Resolved Reports */}
        <Card className="border-border/70 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Resolved Reports
            </CardTitle>
            <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {data.resolvedCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {data.resolutionRate}% rate ({data.averageResolutionFormatted} avg)
            </p>
          </CardContent>
        </Card>
      </section>

      {/* 2. Timeline Trend Chart: Reports Over Time */}
      <Card className="border-border/70 shadow-2xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-foreground tracking-tight flex items-center gap-2">
              <TrendingUp className="size-4 text-blue-600 dark:text-blue-400" />
              <span>Incident Reporting Volume Over Time</span>
            </CardTitle>
            <Badge variant="outline" className="text-xs font-mono font-medium">
              {data.reportsOverTime.length} Data Points
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Chronological trend of incident reports received and verified resolutions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.reportsOverTime.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-xs text-muted-foreground bg-muted/20 rounded-xl border border-border/50">
              No incident data found for the selected time range and filters.
            </div>
          ) : (
            <div className="h-64 sm:h-72 w-full pt-2 min-h-[260px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
                <AreaChart
                  data={data.reportsOverTime}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSubmitted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border border-border/80 bg-background/95 backdrop-blur-md p-2.5 shadow-xl text-xs space-y-1">
                            <p className="font-bold text-foreground">{label}</p>
                            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                              <span className="size-2 rounded-full bg-blue-600" />
                              <span>Submitted: <strong>{payload[0]?.value}</strong></span>
                            </div>
                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                              <span className="size-2 rounded-full bg-emerald-500" />
                              <span>Resolved: <strong>{payload[1]?.value}</strong></span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="submitted"
                    stroke="#2563eb"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSubmitted)"
                    name="Submitted Reports"
                    dot={{ r: 3, fill: "#2563eb", strokeWidth: 1 }}
                    activeDot={{ r: 5 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="resolved"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorResolved)"
                    name="Resolved Reports"
                    dot={{ r: 3, fill: "#10b981", strokeWidth: 1 }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Middle Section: Category Breakdown & Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Reports by Category */}
        <div className="lg:col-span-7">
          <Card className="border-border/70 shadow-2xs h-full flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Tags className="size-4 text-blue-600 dark:text-blue-400" />
                  <span>Reports by Hazard Category</span>
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {data.categoryBreakdown.length} Categories
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Classification volume and citizen incident distribution
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3.5">
              {data.categoryBreakdown.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground bg-muted/20 rounded-xl">
                  No incident category data available.
                </div>
              ) : (
                data.categoryBreakdown.map((cat) => (
                  <div key={cat.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground truncate max-w-[70%]">
                        {cat.name}
                      </span>
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                        <strong className="text-foreground">{cat.count}</strong>
                        <span>({cat.percentage}%)</span>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        style={{ width: `${cat.percentage}%` }}
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Reports by Status Breakdown */}
        <div className="lg:col-span-5">
          <Card className="border-border/70 shadow-2xs h-full flex flex-col justify-between">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Activity className="size-4 text-blue-600 dark:text-blue-400" />
                <span>Reports by Status</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Incident operational workflow breakdown
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              {statusList.map((st) => {
                const Icon = st.icon;
                const pct = Math.round((st.count / safeTotal) * 100);

                return (
                  <div
                    key={st.label}
                    className={`p-3 rounded-xl border ${st.borderColor} ${st.bgColor} flex items-center justify-between gap-3`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`size-7 rounded-lg ${st.color} text-white flex items-center justify-center shrink-0 shadow-2xs`}
                      >
                        <Icon className="size-3.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-foreground block truncate">
                          {st.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground block truncate">
                          {pct}% of total ({st.detail})
                        </span>
                      </div>
                    </div>

                    <span className="text-lg font-extrabold text-foreground font-mono shrink-0">
                      {st.count}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 4. Bottom Section: Reports by Severity & Reports by Barangay */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Reports by Severity */}
        <div className="lg:col-span-5">
          <Card className="border-border/70 shadow-2xs h-full flex flex-col justify-between">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <ShieldAlert className="size-4 text-blue-600 dark:text-blue-400" />
                <span>Reports by Severity</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Triage classification levels across municipal hazards
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Critical */}
              <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="size-3 rounded-full bg-red-600" />
                  <div>
                    <span className="text-xs font-bold text-red-700 dark:text-red-300 block">
                      Critical Emergency
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Immediate life safety hazard
                    </span>
                  </div>
                </div>
                <span className="text-lg font-bold font-mono text-red-700 dark:text-red-300">
                  {data.severityBreakdown.critical}
                </span>
              </div>

              {/* High */}
              <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="size-3 rounded-full bg-amber-500" />
                  <div>
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300 block">
                      High Priority
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Major disruption or risk
                    </span>
                  </div>
                </div>
                <span className="text-lg font-bold font-mono text-amber-700 dark:text-amber-300">
                  {data.severityBreakdown.high}
                </span>
              </div>

              {/* Medium */}
              <div className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="size-3 rounded-full bg-blue-500" />
                  <div>
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300 block">
                      Medium Priority
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Standard civic maintenance
                    </span>
                  </div>
                </div>
                <span className="text-lg font-bold font-mono text-blue-700 dark:text-blue-300">
                  {data.severityBreakdown.medium}
                </span>
              </div>

              {/* Low */}
              <div className="p-3 rounded-xl border border-border/70 bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="size-3 rounded-full bg-muted-foreground/60" />
                  <div>
                    <span className="text-xs font-bold text-foreground block">
                      Low Priority
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Minor advisory report
                    </span>
                  </div>
                </div>
                <span className="text-lg font-bold font-mono text-foreground">
                  {data.severityBreakdown.low}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reports by Barangay (Top Reporting Areas) */}
        <div className="lg:col-span-7">
          <Card className="border-border/70 shadow-2xs h-full flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <MapPin className="size-4 text-blue-600 dark:text-blue-400" />
                  <span>Reports by Barangay (Top Reporting Areas)</span>
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {data.barangayBreakdown.length} Barangays
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Incident density and resolution counts across Butuan City barangays
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-2.5">
              {data.barangayBreakdown.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground bg-muted/20 rounded-xl">
                  No barangay data matching the active filters.
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {data.barangayBreakdown.map((b, idx) => {
                    const pctOfMax = Math.round(
                      (b.count / Math.max(1, data.barangayBreakdown[0]?.count || 1)) * 100
                    );

                    return (
                      <div
                        key={b.barangay}
                        className="p-2.5 rounded-lg border border-border/60 bg-muted/10 hover:bg-muted/30 transition-colors space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-foreground flex items-center gap-1.5 truncate">
                            <span className="size-4 rounded-full bg-muted flex items-center justify-center font-mono text-[10px] text-muted-foreground font-bold shrink-0">
                              {idx + 1}
                            </span>
                            <span className="truncate">{b.barangay}</span>
                          </span>

                          <div className="flex items-center gap-2 shrink-0 text-[11px] font-mono">
                            <span className="text-foreground font-bold">{b.count} reports</span>
                            {b.resolved > 0 && (
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                ({b.resolved} resolved)
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            style={{ width: `${pctOfMax}%` }}
                            className="h-full bg-blue-600 rounded-full transition-all duration-300"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

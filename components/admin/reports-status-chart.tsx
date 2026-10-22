"use client";

import { CheckCircle2, Activity, Eye, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ReportsStatusChartProps {
  total: number;
  resolved: number;
  inProgress: number;
  underReview: number;
  rejected: number;
}

export function ReportsStatusChart({
  total,
  resolved,
  inProgress,
  underReview,
  rejected,
}: ReportsStatusChartProps) {
  const safeTotal = Math.max(1, total);

  const resolvedPct = Math.round((resolved / safeTotal) * 100);
  const inProgressPct = Math.round((inProgress / safeTotal) * 100);
  const underReviewPct = Math.round((underReview / safeTotal) * 100);
  const rejectedPct = Math.round((rejected / safeTotal) * 100);

  const statusItems = [
    {
      label: "Resolved",
      count: resolved,
      percentage: resolvedPct,
      color: "bg-emerald-500",
      textColor: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
      icon: CheckCircle2,
    },
    {
      label: "In Progress",
      count: inProgress,
      percentage: inProgressPct,
      color: "bg-blue-600",
      textColor: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      icon: Activity,
    },
    {
      label: "Under Review",
      count: underReview,
      percentage: underReviewPct,
      color: "bg-amber-500",
      textColor: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
      icon: Eye,
    },
    {
      label: "Rejected",
      count: rejected,
      percentage: rejectedPct,
      color: "bg-red-500",
      textColor: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
      icon: XCircle,
    },
  ];

  return (
    <Card className="border-border/70 shadow-2xs h-full flex flex-col justify-between">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-foreground tracking-tight">
            Reports Overview
          </CardTitle>
          <Badge variant="outline" className="text-[11px] font-mono font-medium">
            {total} Total Filed
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Real-time incident distribution and resolution progress
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Multi-segment Progress Bar */}
        <div className="space-y-1.5">
          <div className="h-3 w-full rounded-full bg-muted overflow-hidden flex shadow-inner">
            {total === 0 ? (
              <div className="h-full w-full bg-muted-foreground/20" />
            ) : (
              <>
                <div
                  style={{ width: `${resolvedPct}%` }}
                  className="h-full bg-emerald-500 transition-all duration-500"
                  title={`Resolved: ${resolved} (${resolvedPct}%)`}
                />
                <div
                  style={{ width: `${inProgressPct}%` }}
                  className="h-full bg-blue-600 transition-all duration-500"
                  title={`In Progress: ${inProgress} (${inProgressPct}%)`}
                />
                <div
                  style={{ width: `${underReviewPct}%` }}
                  className="h-full bg-amber-500 transition-all duration-500"
                  title={`Under Review: ${underReview} (${underReviewPct}%)`}
                />
                <div
                  style={{ width: `${rejectedPct}%` }}
                  className="h-full bg-red-500 transition-all duration-500"
                  title={`Rejected: ${rejected} (${rejectedPct}%)`}
                />
              </>
            )}
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
            <span>0%</span>
            <span>Resolution Rate: {total > 0 ? `${resolvedPct}%` : "0%"}</span>
            <span>100%</span>
          </div>
        </div>

        {/* 4 Status Breakdown Grid Cards */}
        <div className="grid grid-cols-2 gap-2.5">
          {statusItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={`p-3 rounded-xl border ${item.borderColor} ${item.bgColor} flex items-center justify-between gap-2`}
              >
                <div className="space-y-0.5">
                  <span className="text-[11px] font-semibold text-muted-foreground block">
                    {item.label}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-bold text-foreground">
                      {item.count}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      ({item.percentage}%)
                    </span>
                  </div>
                </div>
                <div
                  className={`size-7 rounded-lg ${item.color} text-white flex items-center justify-center shrink-0 shadow-2xs`}
                >
                  <Icon className="size-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

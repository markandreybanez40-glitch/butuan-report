"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  CalendarDays,
  Printer,
  RotateCcw,
  Tags,
  Activity,
  AlertTriangle,
  MapPin,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BUTUAN_BARANGAYS } from "@/lib/constants/barangays";
import {
  formatDateYMD,
  resolveReportPeriod,
  type ReportPeriodMode,
} from "@/lib/utils/report-period";
import type { IncidentCategory } from "@/types";

interface AnalyticsFiltersProps {
  categories: IncidentCategory[];
  onTogglePreview?: () => void;
  isPreviewing?: boolean;
}

const MONTH_OPTIONS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const DATE_RANGE_OPTIONS = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "1y", label: "Past Year" },
  { value: "all", label: "All Time" },
];

export function AnalyticsFilters({
  categories,
  onTogglePreview,
  isPreviewing = false,
}: AnalyticsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const todayStr = formatDateYMD(now);

  // Derive active period mode from searchParams
  const periodParam = searchParams.get("period") as ReportPeriodMode | null;
  const rawRange = searchParams.get("range");
  const rawFrom = searchParams.get("from");
  const rawTo = searchParams.get("to");
  const rawDate = searchParams.get("date");
  const rawMonth = searchParams.get("month");
  const rawYear = searchParams.get("year");

  // Determine active period mode
  let activeMode: ReportPeriodMode = "preset";
  if (periodParam === "daily" || (rawDate && !rawMonth && !rawRange) || (rawFrom && rawFrom === rawTo)) {
    activeMode = "daily";
  } else if (periodParam === "monthly" || (rawMonth && !rawDate && !rawPeriodParamIsDaily(periodParam))) {
    activeMode = "monthly";
  } else if (periodParam === "yearly" || (rawYear && !rawMonth && !rawDate && !rawFrom)) {
    activeMode = "yearly";
  } else if (rawFrom && rawTo && rawFrom !== rawTo) {
    activeMode = "preset"; // custom date range under preset
  } else {
    activeMode = "preset";
  }

  function rawPeriodParamIsDaily(p: string | null) {
    return p === "daily";
  }

  // Local state for period inputs
  const selectedDate = rawDate || rawFrom || todayStr;
  const selectedMonth = rawMonth ? parseInt(rawMonth, 10) : (rawFrom ? parseInt(rawFrom.split("-")[1], 10) : currentMonth);
  const selectedYear = rawYear ? parseInt(rawYear, 10) : (rawFrom ? parseInt(rawFrom.split("-")[0], 10) : currentYear);

  // Year options list (from 2024 to currentYear + 1)
  const startYear = 2024;
  const yearOptions: number[] = [];
  for (let y = currentYear + 1; y >= startYear; y--) {
    yearOptions.push(y);
  }

  // Active Category resolution
  const rawCategoryParam = searchParams.get("category") || "all";
  const otherCategory = categories.find(
    (c) =>
      c.name.toLowerCase().includes("other") ||
      c.name.toLowerCase() === "other civic concern"
  );

  let currentCategory = rawCategoryParam;
  if (
    (rawCategoryParam.toLowerCase() === "other" ||
      rawCategoryParam.toLowerCase() === "other civic concern") &&
    otherCategory
  ) {
    currentCategory = otherCategory.id;
  } else if (
    rawCategoryParam.toLowerCase() === "all categories" ||
    rawCategoryParam.toLowerCase() === "all"
  ) {
    currentCategory = "all";
  }

  const currentStatus = searchParams.get("status") || "all";
  const currentSeverity = searchParams.get("severity") || "all";
  const currentBarangay = searchParams.get("barangay") || "all";
  const fromDate = searchParams.get("from") || "";
  const toDate = searchParams.get("to") || "";

  // Resolve human label for active period
  const periodInfo = resolveReportPeriod({
    period: periodParam || (activeMode !== "preset" ? activeMode : undefined),
    date: selectedDate,
    month: String(selectedMonth),
    year: String(selectedYear),
    range: rawRange || undefined,
    from: fromDate || undefined,
    to: toDate || undefined,
  });

  // Apply filters to URL
  const applyFilters = (updates: {
    periodMode?: ReportPeriodMode;
    date?: string;
    month?: number;
    year?: number;
    range?: string;
    category?: string;
    status?: string;
    severity?: string;
    barangay?: string;
    from?: string;
    to?: string;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (updates.periodMode) {
      if (updates.periodMode === "daily") {
        const d = updates.date || selectedDate || todayStr;
        params.set("period", "daily");
        params.set("date", d);
        params.set("from", d);
        params.set("to", d);
        params.delete("range");
        params.delete("month");
        params.delete("year");
      } else if (updates.periodMode === "monthly") {
        const m = updates.month || selectedMonth || currentMonth;
        const y = updates.year || selectedYear || currentYear;
        const lastDay = new Date(y, m, 0).getDate();
        const f = `${y}-${String(m).padStart(2, "0")}-01`;
        const t = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
        params.set("period", "monthly");
        params.set("month", String(m));
        params.set("year", String(y));
        params.set("from", f);
        params.set("to", t);
        params.delete("range");
        params.delete("date");
      } else if (updates.periodMode === "yearly") {
        const y = updates.year || selectedYear || currentYear;
        const f = `${y}-01-01`;
        const t = `${y}-12-31`;
        params.set("period", "yearly");
        params.set("year", String(y));
        params.set("from", f);
        params.set("to", t);
        params.delete("range");
        params.delete("date");
        params.delete("month");
      } else if (updates.periodMode === "preset") {
        params.delete("period");
        params.delete("date");
        params.delete("month");
        params.delete("year");
        params.delete("from");
        params.delete("to");
        params.set("range", updates.range || "30d");
      }
    }

    if (updates.range !== undefined && !updates.periodMode) {
      if (updates.range && updates.range !== "30d") {
        params.set("range", updates.range);
      } else {
        params.delete("range");
      }
      if (updates.range !== "custom") {
        params.delete("from");
        params.delete("to");
        params.delete("period");
        params.delete("date");
        params.delete("month");
        params.delete("year");
      }
    }

    if (updates.from !== undefined) {
      if (updates.from) params.set("from", updates.from);
      else params.delete("from");
    }

    if (updates.to !== undefined) {
      if (updates.to) params.set("to", updates.to);
      else params.delete("to");
    }

    if (updates.category !== undefined) {
      const catVal = updates.category.trim();
      if (
        catVal &&
        catVal.toLowerCase() !== "all" &&
        catVal.toLowerCase() !== "all categories"
      ) {
        params.set("category", catVal);
      } else {
        params.delete("category");
      }
    }

    if (updates.status !== undefined) {
      if (updates.status && updates.status !== "all") {
        params.set("status", updates.status);
      } else {
        params.delete("status");
      }
    }

    if (updates.severity !== undefined) {
      if (updates.severity && updates.severity !== "all") {
        params.set("severity", updates.severity);
      } else {
        params.delete("severity");
      }
    }

    if (updates.barangay !== undefined) {
      if (updates.barangay && updates.barangay !== "all") {
        params.set("barangay", updates.barangay);
      } else {
        params.delete("barangay");
      }
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  // Browser print trigger
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const hasActiveFilters =
    searchParams.has("period") ||
    searchParams.has("date") ||
    searchParams.has("month") ||
    searchParams.has("year") ||
    (rawRange && rawRange !== "30d") ||
    (currentCategory !== "all" && currentCategory !== "") ||
    currentStatus !== "all" ||
    currentSeverity !== "all" ||
    currentBarangay !== "all" ||
    fromDate !== "" ||
    toDate !== "";

  return (
    <div className="bg-card p-4 sm:p-5 rounded-2xl border border-border/80 shadow-xs space-y-4">
      {/* 1. Header Toolbar: Period Selector Tabs & Print Report Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <CalendarDays className="size-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-bold text-foreground">Report Period:</span>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="inline-flex rounded-lg p-1 bg-muted/60 border border-border/60 gap-1 text-xs">
            <button
              type="button"
              disabled={isPending}
              data-testid="period-tab-daily"
              onClick={() => applyFilters({ periodMode: "daily", date: todayStr })}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                activeMode === "daily"
                  ? "bg-background text-foreground shadow-2xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Daily
            </button>
            <button
              type="button"
              disabled={isPending}
              data-testid="period-tab-monthly"
              onClick={() =>
                applyFilters({
                  periodMode: "monthly",
                  month: currentMonth,
                  year: currentYear,
                })
              }
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                activeMode === "monthly"
                  ? "bg-background text-foreground shadow-2xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              disabled={isPending}
              data-testid="period-tab-yearly"
              onClick={() => applyFilters({ periodMode: "yearly", year: currentYear })}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                activeMode === "yearly"
                  ? "bg-background text-foreground shadow-2xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Yearly
            </button>
            <button
              type="button"
              disabled={isPending}
              data-testid="period-tab-preset"
              onClick={() => applyFilters({ periodMode: "preset", range: "30d" })}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                activeMode === "preset"
                  ? "bg-background text-foreground shadow-2xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Presets / Custom
            </button>
          </div>
        </div>

        {/* Action Controls: Preview Toggle & Print Report Button */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          {onTogglePreview && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onTogglePreview}
              className="gap-1.5 text-xs rounded-lg h-9"
            >
              {isPreviewing ? (
                <>
                  <EyeOff className="size-3.5" />
                  <span>Hide Sheet</span>
                </>
              ) : (
                <>
                  <Eye className="size-3.5" />
                  <span>Preview Sheet</span>
                </>
              )}
            </Button>
          )}

          <Button
            type="button"
            variant="default"
            size="sm"
            data-testid="print-report-button"
            onClick={handlePrint}
            className="gap-1.5 text-xs font-semibold rounded-lg shadow-sm h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Printer className="size-3.5" />
            <span>Print Report</span>
          </Button>
        </div>
      </div>

      {/* 2. Specific Period Controls depending on selected mode */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-muted/20 border border-border/50 text-xs">
        {/* DAILY MODE CONTROLS */}
        {activeMode === "daily" && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-foreground">Select Day:</span>
            <input
              type="date"
              data-testid="daily-date-picker"
              aria-label="Select date for daily report"
              value={selectedDate}
              disabled={isPending}
              onChange={(e) => applyFilters({ periodMode: "daily", date: e.target.value })}
              className="h-8 rounded-md border border-input bg-card px-2.5 text-xs font-mono shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <button
              type="button"
              disabled={isPending || selectedDate === todayStr}
              onClick={() => applyFilters({ periodMode: "daily", date: todayStr })}
              className={`h-7 px-2.5 rounded-md text-[11px] font-medium border border-border/60 ${
                selectedDate === todayStr
                  ? "bg-blue-600 text-white font-bold"
                  : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              Today
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                const y = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                applyFilters({ periodMode: "daily", date: formatDateYMD(y) });
              }}
              className="h-7 px-2.5 rounded-md text-[11px] font-medium bg-card hover:bg-muted border border-border/60 text-muted-foreground hover:text-foreground"
            >
              Yesterday
            </button>
          </div>
        )}

        {/* MONTHLY MODE CONTROLS */}
        {activeMode === "monthly" && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-foreground">Select Month &amp; Year:</span>
            <select
              data-testid="monthly-month-picker"
              aria-label="Select month"
              value={selectedMonth}
              disabled={isPending}
              onChange={(e) =>
                applyFilters({
                  periodMode: "monthly",
                  month: parseInt(e.target.value, 10),
                  year: selectedYear,
                })
              }
              className="h-8 rounded-md border border-input bg-card px-2.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {MONTH_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            <select
              data-testid="monthly-year-picker"
              aria-label="Select year"
              value={selectedYear}
              disabled={isPending}
              onChange={(e) =>
                applyFilters({
                  periodMode: "monthly",
                  month: selectedMonth,
                  year: parseInt(e.target.value, 10),
                })
              }
              className="h-8 rounded-md border border-input bg-card px-2.5 text-xs font-mono shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* YEARLY MODE CONTROLS */}
        {activeMode === "yearly" && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-foreground">Select Calendar Year:</span>
            <select
              data-testid="yearly-year-picker"
              aria-label="Select year for annual report"
              value={selectedYear}
              disabled={isPending}
              onChange={(e) =>
                applyFilters({
                  periodMode: "yearly",
                  year: parseInt(e.target.value, 10),
                })
              }
              className="h-8 rounded-md border border-input bg-card px-3 text-xs font-mono shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-bold"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  Year {y}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* PRESET / CUSTOM RANGE CONTROLS */}
        {activeMode === "preset" && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {DATE_RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={isPending}
                  onClick={() => applyFilters({ range: opt.value, from: "", to: "" })}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    rawRange === opt.value && !fromDate && !toDate
                      ? "bg-blue-600 text-white font-semibold shadow-xs"
                      : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border/60"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 pl-2 border-l border-border/60 text-xs">
              <span className="text-[11px] text-muted-foreground">Range:</span>
              <input
                type="date"
                value={fromDate}
                disabled={isPending}
                aria-label="From date"
                onChange={(e) => applyFilters({ from: e.target.value, range: "custom" })}
                className="h-7 rounded-md border border-input bg-card px-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-mono"
              />
              <span className="text-muted-foreground">to</span>
              <input
                type="date"
                value={toDate}
                disabled={isPending}
                aria-label="To date"
                onChange={(e) => applyFilters({ to: e.target.value, range: "custom" })}
                className="h-7 rounded-md border border-input bg-card px-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-mono"
              />
            </div>
          </div>
        )}

        {/* Selected Reporting Period Banner */}
        <div className="flex items-center gap-2 shrink-0">
          <Badge
            variant="outline"
            data-testid="selected-reporting-period"
            className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-300/40 dark:border-blue-800/50 text-xs px-2.5 py-1 gap-1"
          >
            <Check className="size-3 text-blue-600 dark:text-blue-400" />
            <span>
              Period: <strong>{periodInfo.periodLabel}</strong>
            </span>
          </Badge>
        </div>
      </div>

      {/* 3. Operational Drilldown Filters: Category, Status, Severity, Barangay */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        {/* Category Filter */}
        <div className="flex items-center gap-1.5">
          <Tags className="size-3.5 text-muted-foreground" />
          <select
            value={currentCategory}
            disabled={isPending}
            aria-label="Filter by Category"
            onChange={(e) => applyFilters({ category: e.target.value })}
            className="h-8 rounded-md border border-input bg-card px-2.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring max-w-[180px] truncate"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => {
              const isOtherCat = c.name.toLowerCase().includes("other");
              return (
                <option key={c.id} value={c.id}>
                  {isOtherCat ? "Other (Civic Concern)" : c.name}
                </option>
              );
            })}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <Activity className="size-3.5 text-muted-foreground" />
          <select
            value={currentStatus}
            disabled={isPending}
            aria-label="Filter by Status"
            onChange={(e) => applyFilters({ status: e.target.value })}
            className="h-8 rounded-md border border-input bg-card px-2.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Pending (Submitted)</option>
            <option value="under_review">Under Review</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
            <option value="rejected">Rejected</option>
            <option value="duplicate">Duplicate</option>
          </select>
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="size-3.5 text-muted-foreground" />
          <select
            value={currentSeverity}
            disabled={isPending}
            aria-label="Filter by Severity"
            onChange={(e) => applyFilters({ severity: e.target.value })}
            className="h-8 rounded-md border border-input bg-card px-2.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">All Severities</option>
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
            <option value="critical">Critical Emergency</option>
          </select>
        </div>

        {/* Barangay Filter */}
        <div className="flex items-center gap-1.5">
          <MapPin className="size-3.5 text-muted-foreground" />
          <select
            value={currentBarangay}
            disabled={isPending}
            aria-label="Filter by Barangay"
            onChange={(e) => applyFilters({ barangay: e.target.value })}
            className="h-8 rounded-md border border-input bg-card px-2.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring max-w-[180px] truncate"
          >
            <option value="all">All Barangays (86)</option>
            {BUTUAN_BARANGAYS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Button */}
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => {
              startTransition(() => {
                router.push(pathname);
              });
            }}
            disabled={isPending}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1 ml-auto"
          >
            <RotateCcw className="size-3" />
            <span>Reset Filters</span>
          </Button>
        )}
      </div>
    </div>
  );
}

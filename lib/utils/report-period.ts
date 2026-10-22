export type ReportPeriodMode = "daily" | "monthly" | "yearly" | "preset" | "custom";

export interface ReportPeriodInfo {
  mode: ReportPeriodMode;
  title: string;
  periodLabel: string;
  dateRangeText: string;
  fromDate: string;
  toDate: string;
  date?: string;
  month?: number;
  year?: number;
  range?: string;
  activeFilterSummary?: string;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function formatDateYMD(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatHumanDate(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-").map(Number);
  if (parts.length === 3) {
    const [year, month, day] = parts;
    if (month >= 1 && month <= 12) {
      return `${MONTH_NAMES[month - 1]} ${day}, ${year}`;
    }
  }
  return dateStr;
}

/**
 * Calculates start/end dates and human-readable metadata for Daily, Monthly, Yearly, and Preset report periods.
 */
export function resolveReportPeriod(searchParams?: {
  period?: string;
  date?: string;
  month?: string;
  year?: string;
  range?: string;
  from?: string;
  to?: string;
  categoryName?: string;
  statusName?: string;
  severityName?: string;
  barangayName?: string;
}): ReportPeriodInfo {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const todayStr = formatDateYMD(now);

  const rawPeriod = searchParams?.period?.toLowerCase();
  const rawFrom = searchParams?.from?.trim() || "";
  const rawTo = searchParams?.to?.trim() || "";
  const rawDate = searchParams?.date?.trim() || "";
  const rawMonth = searchParams?.month ? parseInt(searchParams.month, 10) : undefined;
  const rawYear = searchParams?.year ? parseInt(searchParams.year, 10) : undefined;
  const rawRange = searchParams?.range || "30d";

  // Build active filters summary text
  const filterParts: string[] = [];
  if (searchParams?.categoryName && searchParams.categoryName !== "all") {
    filterParts.push(`Category: ${searchParams.categoryName}`);
  }
  if (searchParams?.statusName && searchParams.statusName !== "all") {
    filterParts.push(`Status: ${searchParams.statusName}`);
  }
  if (searchParams?.severityName && searchParams.severityName !== "all") {
    filterParts.push(`Severity: ${searchParams.severityName}`);
  }
  if (searchParams?.barangayName && searchParams.barangayName !== "all") {
    filterParts.push(`Barangay: ${searchParams.barangayName}`);
  }
  const activeFilterSummary = filterParts.length > 0 ? filterParts.join(" • ") : undefined;

  // 1. DAILY PERIOD: explicit period="daily" OR date parameter OR from === to
  if (rawPeriod === "daily" || (rawDate && !rawMonth && !rawRange) || (rawFrom && rawFrom === rawTo)) {
    const selectedDate = rawDate || rawFrom || todayStr;
    const humanDate = formatHumanDate(selectedDate);

    return {
      mode: "daily",
      title: "Daily Incident Report",
      periodLabel: humanDate,
      dateRangeText: `${humanDate} (Full Day, 00:00 - 23:59)`,
      fromDate: selectedDate,
      toDate: selectedDate,
      date: selectedDate,
      year: parseInt(selectedDate.split("-")[0], 10),
      month: parseInt(selectedDate.split("-")[1], 10),
      activeFilterSummary,
    };
  }

  // 2. MONTHLY PERIOD: explicit period="monthly" OR (month given without daily date)
  if (rawPeriod === "monthly" || (rawMonth && !rawDate && !rawPeriod)) {
    const selectedYear = rawYear || (rawFrom ? parseInt(rawFrom.split("-")[0], 10) : currentYear);
    const selectedMonth = rawMonth || (rawFrom ? parseInt(rawFrom.split("-")[1], 10) : currentMonth);
    const validMonth = Math.max(1, Math.min(12, selectedMonth));
    const lastDay = new Date(selectedYear, validMonth, 0).getDate();

    const fromDate = `${selectedYear}-${pad(validMonth)}-01`;
    const toDate = `${selectedYear}-${pad(validMonth)}-${pad(lastDay)}`;
    const monthName = MONTH_NAMES[validMonth - 1];

    return {
      mode: "monthly",
      title: "Monthly Incident Report",
      periodLabel: `${monthName} ${selectedYear}`,
      dateRangeText: `${monthName} 1, ${selectedYear} – ${monthName} ${lastDay}, ${selectedYear}`,
      fromDate,
      toDate,
      month: validMonth,
      year: selectedYear,
      activeFilterSummary,
    };
  }

  // 3. YEARLY PERIOD: explicit period="yearly" OR (year given with yearly mode)
  if (rawPeriod === "yearly" || (rawYear && !rawMonth && !rawDate && !rawFrom)) {
    const selectedYear = rawYear || currentYear;
    const fromDate = `${selectedYear}-01-01`;
    const toDate = `${selectedYear}-12-31`;

    return {
      mode: "yearly",
      title: "Annual Incident Report",
      periodLabel: `Calendar Year ${selectedYear}`,
      dateRangeText: `January 1, ${selectedYear} – December 31, ${selectedYear}`,
      fromDate,
      toDate,
      year: selectedYear,
      activeFilterSummary,
    };
  }

  // 4. CUSTOM DATE RANGE: from and to specified (and not single day)
  if (rawFrom && rawTo && rawFrom !== rawTo) {
    const fromHuman = formatHumanDate(rawFrom);
    const toHuman = formatHumanDate(rawTo);

    return {
      mode: "custom",
      title: "Custom Period Incident Report",
      periodLabel: `${fromHuman} – ${toHuman}`,
      dateRangeText: `${fromHuman} to ${toHuman}`,
      fromDate: rawFrom,
      toDate: rawTo,
      activeFilterSummary,
    };
  }

  // 5. STANDARD PRESETS (7d, 30d, 90d, 1y, all)
  const presetLabels: Record<string, { label: string; days: number }> = {
    "7d": { label: "Last 7 Days", days: 7 },
    "30d": { label: "Last 30 Days", days: 30 },
    "90d": { label: "Last 90 Days", days: 90 },
    "1y": { label: "Past Year (12 Months)", days: 365 },
    all: { label: "All Time (Complete History)", days: 0 },
  };

  const preset = presetLabels[rawRange] || presetLabels["30d"];
  let fromDate = "";
  if (preset.days > 0) {
    const start = new Date(now.getTime() - (preset.days - 1) * 24 * 60 * 60 * 1000);
    fromDate = formatDateYMD(start);
  }

  return {
    mode: "preset",
    title: "Incident Analytics & Activity Report",
    periodLabel: preset.label,
    dateRangeText: preset.days > 0 ? `${formatHumanDate(fromDate)} – ${formatHumanDate(todayStr)}` : "All Recorded Incidents",
    fromDate,
    toDate: todayStr,
    range: rawRange,
    activeFilterSummary,
  };
}

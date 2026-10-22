"use client";

import type { AdminAnalyticsData } from "@/lib/data/admin";
import type { ReportPeriodInfo } from "@/lib/utils/report-period";

interface PrintableIncidentReportProps {
  data: AdminAnalyticsData;
  period: ReportPeriodInfo;
  generatedBy?: string;
  isInlinePreview?: boolean;
}

export function PrintableIncidentReport({
  data,
  period,
  generatedBy = "Administrator",
  isInlinePreview = false,
}: PrintableIncidentReportProps) {
  const safeTotal = Math.max(1, data.totalReports);
  const now = new Date();
  const generationTimestamp = now.toLocaleString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const statusRows = [
    {
      label: "Resolved",
      count: data.statusBreakdown.resolved,
      description: "Action taken, repairs inspected and confirmed resolved",
    },
    {
      label: "Closed",
      count: data.statusBreakdown.closed,
      description: "Archived following automatic grace period or resolution",
    },
    {
      label: "In Progress",
      count: data.statusBreakdown.in_progress,
      description: "Department response teams deployed and active on site",
    },
    {
      label: "Assigned",
      count: data.statusBreakdown.assigned,
      description: "Dispatched to responsible municipal department team",
    },
    {
      label: "Under Review",
      count: data.statusBreakdown.under_review,
      description: "Under operational assessment by dispatchers",
    },
    {
      label: "Pending (Submitted)",
      count: data.statusBreakdown.submitted,
      description: "Awaiting initial operator triage in dispatch queue",
    },
    {
      label: "Rejected / Duplicate / Cancelled",
      count:
        data.statusBreakdown.rejected +
        data.statusBreakdown.duplicate +
        data.statusBreakdown.cancelled,
      description: "Invalid submissions, spam, or duplicate reports",
    },
  ];

  const severityRows = [
    {
      label: "Critical Emergency",
      count: data.severityBreakdown.critical,
      urgency: "Immediate life-safety or disaster hazard",
    },
    {
      label: "High Priority",
      count: data.severityBreakdown.high,
      urgency: "Major public disruption or infrastructure blockage",
    },
    {
      label: "Medium Priority",
      count: data.severityBreakdown.medium,
      urgency: "Standard municipal road, utility, or environmental concern",
    },
    {
      label: "Low Priority",
      count: data.severityBreakdown.low,
      urgency: "Minor community advisory or cosmetic maintenance",
    },
  ];

  return (
    <div
      data-testid="printable-incident-report"
      className={
        isInlinePreview
          ? "w-full max-w-4xl mx-auto bg-white dark:bg-zinc-950 text-black dark:text-zinc-100 p-8 rounded-2xl border border-border shadow-md space-y-6 text-sm"
          : "hidden print:block print:w-full print:p-0 print:m-0 text-black bg-white space-y-6 font-sans text-[10pt]"
      }
    >
      {/* 1. Official Header */}
      <div className="border-b-2 border-black pb-4 text-center space-y-1">
        <div className="text-[11px] uppercase tracking-widest font-semibold text-neutral-600 dark:text-neutral-400">
          Republic of the Philippines • City Government of Butuan
        </div>
        <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
          City Disaster Risk Reduction and Management Office (CDRRMO) &bull; City Administrator&apos;s Office
        </div>
        <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight pt-1 text-black dark:text-white">
          Butuan Report — Official Incident & Resolution Summary
        </h1>
        <div className="inline-block bg-neutral-100 dark:bg-zinc-900 px-3 py-1 rounded-full text-xs font-bold text-blue-800 dark:text-blue-300 border border-neutral-300 dark:border-zinc-800 mt-1">
          {period.title.toUpperCase()}
        </div>
      </div>

      {/* 2. Metadata Box */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-lg border border-neutral-300 dark:border-zinc-800 bg-neutral-50/60 dark:bg-zinc-900/60 text-xs print:bg-transparent">
        <div>
          <span className="block text-[10px] uppercase font-bold text-neutral-500">
            Reporting Period
          </span>
          <strong className="text-sm font-bold text-black dark:text-white">
            {period.periodLabel}
          </strong>
        </div>
        <div>
          <span className="block text-[10px] uppercase font-bold text-neutral-500">
            Date Span
          </span>
          <span className="text-xs font-mono text-neutral-800 dark:text-neutral-200">
            {period.dateRangeText}
          </span>
        </div>
        <div>
          <span className="block text-[10px] uppercase font-bold text-neutral-500">
            Date Generated
          </span>
          <span className="text-xs text-neutral-800 dark:text-neutral-200">
            {generationTimestamp}
          </span>
        </div>
        <div>
          <span className="block text-[10px] uppercase font-bold text-neutral-500">
            Authorized Officer
          </span>
          <strong className="text-xs text-black dark:text-white">
            {generatedBy}
          </strong>
        </div>
      </div>

      {period.activeFilterSummary && (
        <div className="text-xs p-2 rounded bg-neutral-100 dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 text-neutral-700 dark:text-neutral-300">
          <strong>Applied Filter Scope:</strong> {period.activeFilterSummary}
        </div>
      )}

      {/* 3. Executive Summary / Totals */}
      <div className="print-avoid-break space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 border-b border-neutral-300 pb-1">
          Executive Summary &amp; Key Performance Indicators
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 border border-neutral-300 dark:border-zinc-800 rounded-lg">
            <span className="block text-[10px] uppercase font-bold text-neutral-500">
              Total Reports
            </span>
            <span className="text-2xl font-black font-mono text-black dark:text-white">
              {data.totalReports}
            </span>
            <span className="block text-[10px] text-neutral-500 mt-0.5">Recorded in Period</span>
          </div>

          <div className="p-3 border border-neutral-300 dark:border-zinc-800 rounded-lg">
            <span className="block text-[10px] uppercase font-bold text-neutral-500">
              Resolved Cases
            </span>
            <span className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400">
              {data.resolvedCount}
            </span>
            <span className="block text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">
              {data.resolutionRate}% Resolution Rate
            </span>
          </div>

          <div className="p-3 border border-neutral-300 dark:border-zinc-800 rounded-lg">
            <span className="block text-[10px] uppercase font-bold text-neutral-500">
              In Progress / Assigned
            </span>
            <span className="text-2xl font-black font-mono text-blue-700 dark:text-blue-400">
              {data.inProgressCount}
            </span>
            <span className="block text-[10px] text-neutral-500 mt-0.5">Active Field Operations</span>
          </div>

          <div className="p-3 border border-neutral-300 dark:border-zinc-800 rounded-lg">
            <span className="block text-[10px] uppercase font-bold text-neutral-500">
              Avg Resolution Time
            </span>
            <span className="text-2xl font-black font-mono text-neutral-900 dark:text-neutral-100">
              {data.averageResolutionFormatted}
            </span>
            <span className="block text-[10px] text-neutral-500 mt-0.5">Response Benchmark</span>
          </div>
        </div>
      </div>

      {/* 4. Category Breakdown Table */}
      <div className="print-avoid-break space-y-2">
        <div className="flex items-center justify-between border-b border-neutral-300 pb-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
            1. Breakdown by Hazard Category
          </h2>
          <span className="text-[10px] text-neutral-500 font-mono">
            {data.categoryBreakdown.length} System Categories
          </span>
        </div>

        <table className="w-full text-left text-xs border-collapse print-table">
          <thead>
            <tr className="bg-neutral-100 dark:bg-zinc-900 border-y border-neutral-300 dark:border-zinc-700 text-[10px] uppercase font-bold text-neutral-600 dark:text-neutral-400">
              <th className="py-2 px-3">Hazard Category</th>
              <th className="py-2 px-3 text-right">Report Count</th>
              <th className="py-2 px-3 text-right">% of Total</th>
              <th className="py-2 px-3 text-left">Volume Visualizer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-zinc-800">
            {data.categoryBreakdown.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-3 px-3 text-center text-neutral-500 italic">
                  No incident category records for this reporting period.
                </td>
              </tr>
            ) : (
              data.categoryBreakdown.map((c) => (
                <tr key={c.id}>
                  <td className="py-2 px-3 font-semibold text-black dark:text-white">
                    {c.name}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold">
                    {c.count}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-neutral-600 dark:text-neutral-400">
                    {c.percentage}%
                  </td>
                  <td className="py-2 px-3 w-40">
                    <div className="h-2 w-full bg-neutral-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${c.percentage}%` }}
                        className="h-full bg-neutral-700 dark:bg-neutral-300 rounded-full"
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-black font-bold bg-neutral-50 dark:bg-zinc-900/60">
              <td className="py-2 px-3 uppercase text-[10px]">Total Incidents Classified</td>
              <td className="py-2 px-3 text-right font-mono text-sm">{data.totalReports}</td>
              <td className="py-2 px-3 text-right font-mono">100%</td>
              <td className="py-2 px-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 5. Operational Status Breakdown */}
      <div className="print-avoid-break space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 border-b border-neutral-300 pb-1">
          2. Breakdown by Operational Status
        </h2>

        <table className="w-full text-left text-xs border-collapse print-table">
          <thead>
            <tr className="bg-neutral-100 dark:bg-zinc-900 border-y border-neutral-300 dark:border-zinc-700 text-[10px] uppercase font-bold text-neutral-600 dark:text-neutral-400">
              <th className="py-2 px-3">Operational Stage</th>
              <th className="py-2 px-3">Description &amp; Workflow Role</th>
              <th className="py-2 px-3 text-right">Count</th>
              <th className="py-2 px-3 text-right">% of Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-zinc-800">
            {statusRows.map((s) => {
              const pct = Math.round((s.count / safeTotal) * 100);
              return (
                <tr key={s.label}>
                  <td className="py-2 px-3 font-semibold text-black dark:text-white">
                    {s.label}
                  </td>
                  <td className="py-2 px-3 text-[11px] text-neutral-600 dark:text-neutral-400">
                    {s.description}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold">
                    {s.count}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-neutral-600 dark:text-neutral-400">
                    {pct}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 6. Severity & Geographic Distribution */}
      <div className="print-avoid-break grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Severity */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 border-b border-neutral-300 pb-1">
            3. Triage Severity Distribution
          </h2>
          <table className="w-full text-left text-xs border-collapse print-table">
            <thead>
              <tr className="bg-neutral-100 dark:bg-zinc-900 border-y border-neutral-300 text-[10px] uppercase font-bold text-neutral-600">
                <th className="py-1.5 px-2.5">Priority</th>
                <th className="py-1.5 px-2.5 text-right">Reports</th>
                <th className="py-1.5 px-2.5 text-right">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {severityRows.map((sev) => {
                const pct = Math.round((sev.count / safeTotal) * 100);
                return (
                  <tr key={sev.label}>
                    <td className="py-1.5 px-2.5 font-medium">{sev.label}</td>
                    <td className="py-1.5 px-2.5 text-right font-mono font-bold">{sev.count}</td>
                    <td className="py-1.5 px-2.5 text-right font-mono text-neutral-600">{pct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Top Reporting Barangays */}
        <div className="space-y-2">
          <div className="flex items-center justify-between border-b border-neutral-300 pb-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
              4. Geographic Density (Top Barangays)
            </h2>
            <span className="text-[10px] text-neutral-500 font-mono">
              {data.barangayBreakdown.length} Affected
            </span>
          </div>

          <table className="w-full text-left text-xs border-collapse print-table">
            <thead>
              <tr className="bg-neutral-100 dark:bg-zinc-900 border-y border-neutral-300 text-[10px] uppercase font-bold text-neutral-600">
                <th className="py-1.5 px-2.5">Barangay</th>
                <th className="py-1.5 px-2.5 text-right">Incidents</th>
                <th className="py-1.5 px-2.5 text-right">Resolved</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {data.barangayBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-2 px-2.5 text-center text-neutral-500 italic">
                    No barangay records for this period.
                  </td>
                </tr>
              ) : (
                data.barangayBreakdown.slice(0, 7).map((b) => (
                  <tr key={b.barangay}>
                    <td className="py-1.5 px-2.5 font-medium truncate max-w-[140px]">{b.barangay}</td>
                    <td className="py-1.5 px-2.5 text-right font-mono font-bold">{b.count}</td>
                    <td className="py-1.5 px-2.5 text-right font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                      {b.resolved}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. Official Certification & Signature Block */}
      <div className="print-avoid-break pt-6 border-t-2 border-black space-y-6">
        <p className="text-[11px] text-neutral-600 italic text-center">
          I hereby certify that this document represents the verified civic incident records and municipal response metrics
          captured in the Butuan Report platform for the specified reporting period.
        </p>

        <div className="grid grid-cols-2 gap-12 pt-6">
          <div className="text-center space-y-1">
            <div className="border-b border-black w-48 mx-auto" />
            <strong className="block text-xs uppercase font-bold pt-1">{generatedBy}</strong>
            <span className="block text-[10px] text-neutral-500">
              Administrative Officer / System Operator
            </span>
          </div>

          <div className="text-center space-y-1">
            <div className="border-b border-black w-48 mx-auto" />
            <strong className="block text-xs uppercase font-bold pt-1">
              Honorable City Administrator / Mayor
            </strong>
            <span className="block text-[10px] text-neutral-500">
              Executive Oversight • City Government of Butuan
            </span>
          </div>
        </div>

        <div className="text-[9px] text-neutral-400 text-center pt-2">
          Butuan Report Civic Incident Management System &bull; Official Public Safety Document &bull; Generated: {generationTimestamp}
        </div>
      </div>
    </div>
  );
}

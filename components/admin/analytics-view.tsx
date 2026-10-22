"use client";

import { useState } from "react";
import { AnalyticsFilters } from "@/components/admin/analytics-filters";
import { AnalyticsCharts } from "@/components/admin/analytics-charts";
import { PrintableIncidentReport } from "@/components/admin/printable-incident-report";
import type { AdminAnalyticsData } from "@/lib/data/admin";
import type { ReportPeriodInfo } from "@/lib/utils/report-period";
import type { IncidentCategory } from "@/types";

interface AnalyticsViewProps {
  analyticsData: AdminAnalyticsData;
  categories: IncidentCategory[];
  periodInfo: ReportPeriodInfo;
  adminName: string;
}

export function AnalyticsView({
  analyticsData,
  categories,
  periodInfo,
  adminName,
}: AnalyticsViewProps) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="space-y-6">
      {/* Screen Interactive Controls: Period Selector & Print Report Button */}
      <div className="no-print">
        <AnalyticsFilters
          categories={categories}
          isPreviewing={showPreview}
          onTogglePreview={() => setShowPreview((prev) => !prev)}
        />
      </div>

      {/* Screen Inline Document Preview (when admin toggles Preview Sheet) */}
      {showPreview && (
        <div className="no-print space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>Official Sheet Preview (matches printable document format):</span>
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="hover:underline text-blue-600 dark:text-blue-400"
            >
              Close Preview
            </button>
          </div>
          <PrintableIncidentReport
            data={analyticsData}
            period={periodInfo}
            generatedBy={adminName}
            isInlinePreview={true}
          />
        </div>
      )}

      {/* Screen Interactive Charts & Visualizations */}
      <div className="no-print">
        <AnalyticsCharts data={analyticsData} />
      </div>

      {/* Official Print Layout (displayed exclusively during browser print dialog) */}
      <div className="print-only hidden print:block">
        <PrintableIncidentReport
          data={analyticsData}
          period={periodInfo}
          generatedBy={adminName}
          isInlinePreview={false}
        />
      </div>
    </div>
  );
}

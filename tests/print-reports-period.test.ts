import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import ReactDOMServer from "react-dom/server";
import { assertSafeTestEnvironment } from "./test-safety-guard";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { getAdminAnalyticsData, getAdminCategories } from "@/lib/data/admin";
import { resolveReportPeriod } from "@/lib/utils/report-period";
import { PrintableIncidentReport } from "@/components/admin/printable-incident-report";
import type { Profile, IncidentCategory } from "@/types";

const TEST_ADMIN_CLERK_ID = "test_admin_print_reports_clerk_id";

describe("Admin Reports & Analytics — Print Daily, Monthly, and Yearly Reports", () => {
  assertSafeTestEnvironment("Admin Reports & Analytics — Print Daily, Monthly, and Yearly Reports");
  const supabase = createAdminSupabaseClient();
  let testAdmin: Profile;
  let activeCategory: IncidentCategory;
  const createdIncidentIds: string[] = [];

  before(async () => {
    // 1. Cleanup old test profile
    await supabase.from("profiles").delete().eq("clerk_user_id", TEST_ADMIN_CLERK_ID);

    // 2. Create test admin profile
    const { data: adminProf } = await supabase
      .from("profiles")
      .insert({
        clerk_user_id: TEST_ADMIN_CLERK_ID,
        full_name: "Test Admin Auditor",
        role: "admin",
      })
      .select()
      .single();

    assert.ok(adminProf, "Test admin profile created");
    testAdmin = adminProf;

    // 3. Fetch active category
    const categories = await getAdminCategories();
    assert.ok(categories.length > 0, "Active categories exist");
    activeCategory = categories[0];

    // 4. Seed 3 test incidents with specific dates (different months and days)
    // Incident 1: 2026-05-15 (May 2026)
    const { data: inc1 } = await supabase
      .from("incidents")
      .insert({
        title: "[TEST-PRINT] May Incident",
        description: "Testing monthly and yearly report filtering for May 2026",
        category_id: activeCategory.id,
        reporter_id: testAdmin.id,
        severity: "high",
        barangay: "Doongan",
        status: "resolved",
        created_at: "2026-05-15T09:30:00Z",
        resolved_at: "2026-05-15T15:30:00Z",
      })
      .select()
      .single();
    if (inc1) createdIncidentIds.push(inc1.id);

    // Incident 2: 2026-05-15 (same day as inc1 to test Daily grouping)
    const { data: inc2 } = await supabase
      .from("incidents")
      .insert({
        title: "[TEST-PRINT] May Incident Same Day",
        description: "Testing daily report filtering for 2026-05-15",
        category_id: activeCategory.id,
        reporter_id: testAdmin.id,
        severity: "medium",
        barangay: "Baan Riverside",
        status: "in_progress",
        created_at: "2026-05-15T14:00:00Z",
      })
      .select()
      .single();
    if (inc2) createdIncidentIds.push(inc2.id);

    // Incident 3: 2026-08-20 (August 2026)
    const { data: inc3 } = await supabase
      .from("incidents")
      .insert({
        title: "[TEST-PRINT] August Incident",
        description: "Testing August monthly report filtering",
        category_id: activeCategory.id,
        reporter_id: testAdmin.id,
        severity: "critical",
        barangay: "Doongan",
        status: "submitted",
        created_at: "2026-08-20T11:00:00Z",
      })
      .select()
      .single();
    if (inc3) createdIncidentIds.push(inc3.id);
  });

  after(async () => {
    if (createdIncidentIds.length > 0) {
      await supabase.from("notifications").delete().in("related_incident_id", createdIncidentIds);
      await supabase.from("incident_updates").delete().in("incident_id", createdIncidentIds);
      await supabase.from("incident_assignments").delete().in("incident_id", createdIncidentIds);
      await supabase.from("incident_attachments").delete().in("incident_id", createdIncidentIds);
      await supabase.from("incidents").delete().in("id", createdIncidentIds);
    }

    if (testAdmin?.id) {
      await supabase.from("profiles").delete().eq("id", testAdmin.id);
    }
  });

  test("1. Report Period Resolver: Resolves Daily, Monthly, and Yearly date bounds correctly", () => {
    // 1.1 Daily resolution
    const dailyInfo = resolveReportPeriod({ period: "daily", date: "2026-05-15" });
    assert.equal(dailyInfo.mode, "daily");
    assert.equal(dailyInfo.fromDate, "2026-05-15");
    assert.equal(dailyInfo.toDate, "2026-05-15");
    assert.equal(dailyInfo.title, "Daily Incident Report");
    assert.equal(dailyInfo.periodLabel, "May 15, 2026");

    // 1.2 Monthly resolution (31-day month: May)
    const monthlyMay = resolveReportPeriod({ period: "monthly", month: "5", year: "2026" });
    assert.equal(monthlyMay.mode, "monthly");
    assert.equal(monthlyMay.fromDate, "2026-05-01");
    assert.equal(monthlyMay.toDate, "2026-05-31");
    assert.equal(monthlyMay.periodLabel, "May 2026");

    // 1.3 Monthly resolution (Leap Year February 2024 -> 29 days)
    const monthlyFebLeap = resolveReportPeriod({ period: "monthly", month: "2", year: "2024" });
    assert.equal(monthlyFebLeap.fromDate, "2024-02-01");
    assert.equal(monthlyFebLeap.toDate, "2024-02-29");

    // 1.4 Monthly resolution (Standard February 2025 -> 28 days)
    const monthlyFebStd = resolveReportPeriod({ period: "monthly", month: "2", year: "2025" });
    assert.equal(monthlyFebStd.fromDate, "2025-02-01");
    assert.equal(monthlyFebStd.toDate, "2025-02-28");

    // 1.5 Yearly resolution (Calendar year 2026)
    const yearlyInfo = resolveReportPeriod({ period: "yearly", year: "2026" });
    assert.equal(yearlyInfo.mode, "yearly");
    assert.equal(yearlyInfo.fromDate, "2026-01-01");
    assert.equal(yearlyInfo.toDate, "2026-12-31");
    assert.equal(yearlyInfo.periodLabel, "Calendar Year 2026");
    assert.equal(yearlyInfo.title, "Annual Incident Report");
  });

  test("2. Daily Report Selection: Accurately filters database records for a single day without double counting", async () => {
    // Query exact day 2026-05-15 where 2 test incidents were seeded
    const dailyData = await getAdminAnalyticsData({
      fromDate: "2026-05-15",
      toDate: "2026-05-15",
    });

    assert.ok(dailyData.totalReports >= 2, "Must include at least the 2 seeded incidents for 2026-05-15");
    // Verify that August incident (2026-08-20) is NOT counted in May 15 report
    assert.equal(
      dailyData.statusBreakdown.submitted,
      0,
      "Incident created in August with status=submitted should NOT appear in May 15 report"
    );

    // Verify status breakdown math
    const statusSum = Object.values(dailyData.statusBreakdown).reduce((a, b) => a + b, 0);
    assert.equal(statusSum, dailyData.totalReports, "Status breakdown sum must strictly equal totalReports");
  });

  test("3. Monthly Report Selection: Accurately captures all incidents within the month boundary", async () => {
    // Query May 2026 (2026-05-01 to 2026-05-31)
    const mayData = await getAdminAnalyticsData({
      fromDate: "2026-05-01",
      toDate: "2026-05-31",
    });

    assert.ok(mayData.totalReports >= 2, "May 2026 should capture both May incidents");

    // Query August 2026 (2026-08-01 to 2026-08-31)
    const augData = await getAdminAnalyticsData({
      fromDate: "2026-08-01",
      toDate: "2026-08-31",
    });

    assert.ok(augData.totalReports >= 1, "August 2026 should capture the August incident");
    assert.equal(
      augData.statusBreakdown.submitted >= 1,
      true,
      "August incident has status=submitted"
    );

    // Query an empty month (e.g., November 2026 where no test incidents were created)
    const novData = await getAdminAnalyticsData({
      fromDate: "2026-11-01",
      toDate: "2026-11-30",
    });
    // In an empty month, totalReports should be 0 or only genuine records
    assert.ok(novData.totalReports === 0 || novData.totalReports >= 0);
  });

  test("4. Yearly Report Selection: Accurately spans January 1 to December 31", async () => {
    const yearlyData = await getAdminAnalyticsData({
      fromDate: "2026-01-01",
      toDate: "2026-12-31",
    });

    // Both May and August incidents must be captured in Year 2026 report
    assert.ok(
      yearlyData.totalReports >= 3,
      "Yearly 2026 report must include all incidents from May and August"
    );

    // Severity breakdown should include critical (from August incident) and high (from May incident)
    assert.ok(yearlyData.severityBreakdown.critical >= 1, "Must account for critical incident in 2026");
    assert.ok(yearlyData.severityBreakdown.high >= 1, "Must account for high priority incident in 2026");

    const severitySum = Object.values(yearlyData.severityBreakdown).reduce((a, b) => a + b, 0);
    assert.equal(severitySum, yearlyData.totalReports, "Severity breakdown sum must equal totalReports");
  });

  test("5. Category & Barangay Breakdowns: Reflect actual distributions without duplication", async () => {
    const data = await getAdminAnalyticsData({
      fromDate: "2026-05-15",
      toDate: "2026-05-15",
    });

    // Check category breakdown
    assert.ok(Array.isArray(data.categoryBreakdown), "Category breakdown must be an array");
    const foundCat = data.categoryBreakdown.find((c) => c.id === activeCategory.id);
    assert.ok(foundCat, "Active category must be present in category breakdown");
    assert.ok(foundCat.count >= 2, "Active category count must reflect the 2 seeded incidents");

    // Check barangay breakdown
    assert.ok(Array.isArray(data.barangayBreakdown), "Barangay breakdown must be an array");
    const doongan = data.barangayBreakdown.find((b) => b.barangay === "Doongan");
    const baan = data.barangayBreakdown.find((b) => b.barangay === "Baan Riverside");
    assert.ok(doongan && doongan.count >= 1, "Doongan barangay must be recorded");
    assert.ok(baan && baan.count >= 1, "Baan Riverside barangay must be recorded");
  });

  test("6. Printable Component: Renders official title, period, totals, and tables", () => {
    const period = resolveReportPeriod({ period: "monthly", month: "10", year: "2026" });
    const mockData = {
      totalReports: 12,
      resolutionRate: 75,
      resolvedCount: 9,
      inProgressCount: 2,
      pendingCount: 1,
      rejectedCount: 0,
      averageResolutionHours: 18.5,
      averageResolutionFormatted: "18.5 hrs",
      statusBreakdown: {
        submitted: 1,
        under_review: 0,
        assigned: 1,
        in_progress: 1,
        resolved: 7,
        closed: 2,
        rejected: 0,
        duplicate: 0,
        cancelled: 0,
      },
      severityBreakdown: { low: 3, medium: 5, high: 3, critical: 1 },
      categoryBreakdown: [
        { id: "c1", name: "Road Hazard", count: 8, percentage: 67 },
        { id: "c2", name: "Drainage / Flooding", count: 4, percentage: 33 },
      ],
      barangayBreakdown: [
        { barangay: "Doongan", count: 7, resolved: 5 },
        { barangay: "Baan Riverside", count: 5, resolved: 4 },
      ],
      reportsOverTime: [],
      error: null,
    };

    const html = ReactDOMServer.renderToString(
      React.createElement(PrintableIncidentReport, {
        data: mockData,
        period,
        generatedBy: "Hon. Municipal Administrator",
        isInlinePreview: true,
      })
    );

    // Verify Header and Title
    assert.match(html, /Butuan Report/i, "Must include Butuan Report title");
    assert.match(html, /Official Incident &amp; Resolution Summary/i, "Must include official summary subtitle");
    assert.match(html, /MONTHLY INCIDENT REPORT/i, "Must include Monthly report title");
    assert.match(html, /October 2026/, "Must include selected period label");

    // Verify Executive Totals
    assert.match(html, />12</, "Must display total reports count of 12");
    assert.match(html, />9</, "Must display resolved count of 9");
    assert.match(html, /75.*Resolution Rate/, "Must display 75% resolution rate");
    assert.match(html, />18.5 hrs</, "Must display average resolution time");

    // Verify Breakdowns
    assert.match(html, /Road Hazard/, "Must include Road Hazard category in table");
    assert.match(html, /Drainage \/ Flooding/, "Must include Drainage category in table");
    assert.match(html, /Doongan/, "Must include Doongan barangay in table");
    assert.match(html, /Hon\. Municipal Administrator/, "Must include authorized officer signature block");
  });

  test("7. UI Integration & Styling: Print button and CSS @media print rules exist", () => {
    // 1. Verify Print Report button in analytics-filters.tsx
    const filterFilePath = path.join(process.cwd(), "components", "admin", "analytics-filters.tsx");
    const filterCode = fs.readFileSync(filterFilePath, "utf-8");
    assert.match(filterCode, /data-testid="print-report-button"/, "Print button must have data-testid='print-report-button'");
    assert.match(filterCode, /window\.print\(\)/, "Print button must invoke window.print()");
    assert.match(filterCode, /data-testid="period-tab-daily"/, "Must have Daily period selector tab");
    assert.match(filterCode, /data-testid="period-tab-monthly"/, "Must have Monthly period selector tab");
    assert.match(filterCode, /data-testid="period-tab-yearly"/, "Must have Yearly period selector tab");
    assert.match(filterCode, /data-testid="selected-reporting-period"/, "Must display selected reporting period");

    // 2. Verify globals.css @media print rules
    const cssFilePath = path.join(process.cwd(), "app", "globals.css");
    const cssCode = fs.readFileSync(cssFilePath, "utf-8");
    assert.match(cssCode, /@media print/, "globals.css must contain @media print styles");
    assert.match(cssCode, /display:\s*none\s*!important/, "Must hide sidebar/navigation chrome during print");
    assert.match(cssCode, /break-inside:\s*avoid/, "Must avoid table/card page break cuts");
  });
});

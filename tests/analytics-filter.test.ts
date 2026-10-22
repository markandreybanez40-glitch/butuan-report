import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { getAdminAnalyticsData, getAdminCategories } from "@/lib/data/admin";

describe("Admin Analytics — Category Filtering & Time Series Rendering", () => {
  const supabase = createAdminSupabaseClient();

  test("1. All Categories filter returns total incident volume with continuous time points", async () => {
    const dataDefault = await getAdminAnalyticsData();
    const dataAll = await getAdminAnalyticsData({ categoryId: "all" });
    const dataAllCategoriesText = await getAdminAnalyticsData({ categoryId: "All Categories" });

    assert.ok(dataDefault.totalReports >= 4, "Default query should return all incidents");
    assert.equal(dataAll.totalReports, dataDefault.totalReports, "categoryId='all' should match default total");
    assert.equal(dataAllCategoriesText.totalReports, dataDefault.totalReports, "categoryId='All Categories' should not fail or filter out reports");

    // Verify chart points are continuous
    assert.ok(dataDefault.reportsOverTime.length >= 7, "Chart data should have continuous points for 30d range");
    const sumSubmitted = dataDefault.reportsOverTime.reduce((sum, p) => sum + p.submitted, 0);
    assert.equal(sumSubmitted, dataDefault.totalReports, "Sum of timeline submitted reports must equal totalReports");
  });

  test("2. Individual category filters return exact incident counts and never collapse to a single point", async () => {
    const categories = await getAdminCategories();
    const roadHazard = categories.find((c) => c.name === "Road Hazard");
    assert.ok(roadHazard, "Road Hazard category must exist");

    const dataRoad = await getAdminAnalyticsData({ categoryId: roadHazard.id });
    assert.ok(dataRoad.totalReports >= 1, "Road Hazard should have at least 1 report");
    assert.ok(
      dataRoad.reportsOverTime.length >= 7,
      "Categories with reports must return continuous time buckets to prevent chart disappearance"
    );

    // Empty category
    const landslide = categories.find((c) => c.name === "Landslide");
    assert.ok(landslide, "Landslide category must exist");
    const dataLandslide = await getAdminAnalyticsData({ categoryId: landslide.id });
    assert.equal(dataLandslide.totalReports, 0);
    assert.equal(dataLandslide.reportsOverTime.length, 0, "Genuinely empty categories should return 0 points for clear empty state");
  });

  test("3. Other category handles aliases ('other', 'Other', UUID) and captures reports", async () => {
    const categories = await getAdminCategories();
    const otherCat = categories.find((c) => c.name.toLowerCase().includes("other"));
    assert.ok(otherCat, "Other category must exist in incident_categories");

    // Retrieve an existing profile for reporter_id
    const { data: profile } = await supabase.from("profiles").select("id").limit(1).single();
    assert.ok(profile, "Profile must exist");

    // Insert a test incident under Other
    const { data: testOtherInc, error: insertErr } = await supabase
      .from("incidents")
      .insert({
        title: "[TEST-ANALYTICS] Other Category Automated Verification",
        description: "Verifying that Other category queries and charts render accurately.",
        category_id: otherCat.id,
        reporter_id: profile.id,
        severity: "low",
        barangay: "Baan Riverside",
        status: "submitted",
      })
      .select()
      .single();

    assert.equal(insertErr, null, "Inserting test incident under Other should succeed");

    try {
      const dataOtherLower = await getAdminAnalyticsData({ categoryId: "other" });
      const dataOtherUpper = await getAdminAnalyticsData({ categoryId: "Other" });
      const dataOtherUuid = await getAdminAnalyticsData({ categoryId: otherCat.id });
      const dataOtherFullName = await getAdminAnalyticsData({ categoryId: otherCat.name });

      assert.ok(dataOtherLower.totalReports >= 1, "categoryId='other' should find the Other incident");
      assert.equal(dataOtherLower.totalReports, dataOtherUpper.totalReports);
      assert.equal(dataOtherLower.totalReports, dataOtherUuid.totalReports);
      assert.equal(dataOtherLower.totalReports, dataOtherFullName.totalReports);
      assert.ok(dataOtherLower.reportsOverTime.length >= 7, "Timeline points must exist for Other category");
    } finally {
      if (testOtherInc?.id) {
        await supabase.from("incidents").delete().eq("id", testOtherInc.id);
      }
    }
  });

  test("4. Date ranges generate continuous daily/monthly timelines", async () => {
    const { data: profile } = await supabase.from("profiles").select("id").limit(1).single();
    assert.ok(profile, "Profile must exist");
    const { data: cat } = await supabase.from("incident_categories").select("id").limit(1).single();
    assert.ok(cat, "Category must exist");

    const { data: testInc } = await supabase
      .from("incidents")
      .insert({
        title: "[TEST-ANALYTICS] Date Range Verification",
        description: "Ensures incidents within 7d window generate continuous timeline.",
        category_id: cat.id,
        reporter_id: profile.id,
        severity: "low",
        barangay: "Doongan",
        status: "submitted",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    try {
      const data7d = await getAdminAnalyticsData({ dateRange: "7d" });
      assert.equal(data7d.reportsOverTime.length, 7, "7d range should have exactly 7 daily points");

      const data30d = await getAdminAnalyticsData({ dateRange: "30d" });
      assert.equal(data30d.reportsOverTime.length, 30, "30d range should have exactly 30 daily points");
    } finally {
      if (testInc?.id) {
        await supabase.from("incidents").delete().eq("id", testInc.id);
      }
    }
  });

  test("5. Summary cards math is accurate and accounts for every incident record", async () => {
    const data = await getAdminAnalyticsData();
    assert.ok(data.totalReports >= 4, "Total reports should match database count");

    // Pending = submitted + under_review
    assert.equal(
      data.pendingCount,
      data.statusBreakdown.submitted + data.statusBreakdown.under_review,
      "Pending count must exactly equal submitted + under_review"
    );

    // In Progress = assigned + in_progress
    assert.equal(
      data.inProgressCount,
      data.statusBreakdown.assigned + data.statusBreakdown.in_progress,
      "In progress count must exactly equal assigned + in_progress"
    );

    // Resolved = resolved + closed
    assert.equal(
      data.resolvedCount,
      data.statusBreakdown.resolved + data.statusBreakdown.closed,
      "Resolved count must exactly equal resolved + closed"
    );

    // Total must equal the sum of all operational buckets
    const sumAllStatuses =
      data.pendingCount +
      data.inProgressCount +
      data.resolvedCount +
      data.rejectedCount;

    assert.equal(
      sumAllStatuses,
      data.totalReports,
      "Sum of all status categories must equal totalReports"
    );
  });

  test("6. Category distribution accounts for every category in the system", async () => {
    const categories = await getAdminCategories();
    const data = await getAdminAnalyticsData();

    // Every category from system should be present in breakdown
    assert.ok(
      data.categoryBreakdown.length >= categories.length,
      "Category breakdown must include all system categories"
    );

    const sumCategoryCounts = data.categoryBreakdown.reduce((sum, c) => sum + c.count, 0);
    assert.equal(
      sumCategoryCounts,
      data.totalReports,
      "Sum of all category counts must equal totalReports without double counting"
    );
  });

  test("7. Combined filters work together consistently (Category + Status + Date range)", async () => {
    // 1. Filter by status: resolved
    const dataResolved = await getAdminAnalyticsData({ status: "resolved" });
    assert.ok(dataResolved.totalReports >= 1, "Should find resolved incidents");
    assert.equal(dataResolved.pendingCount, 0, "When status='resolved', pendingCount must be 0");
    assert.equal(dataResolved.inProgressCount, 0, "When status='resolved', inProgressCount must be 0");
    assert.equal(
      dataResolved.resolvedCount,
      dataResolved.totalReports,
      "When status='resolved', resolvedCount must equal totalReports"
    );

    // 2. Filter by combined category and status
    const categories = await getAdminCategories();
    const sanitation = categories.find((c) => c.name === "Sanitation")!;
    assert.ok(sanitation, "Sanitation category must exist");

    const { data: profile } = await supabase.from("profiles").select("id").limit(1).single();
    assert.ok(profile, "Profile must exist");

    const { data: testInc } = await supabase
      .from("incidents")
      .insert({
        title: "[TEST-ANALYTICS] Sanitation Resolved Report",
        description: "Verifying combined analytics filtering.",
        category_id: sanitation.id,
        reporter_id: profile.id,
        severity: "medium",
        barangay: "Doongan",
        status: "resolved",
        resolved_at: new Date().toISOString(),
      })
      .select()
      .single();

    try {
      const dataCombined = await getAdminAnalyticsData({
        categoryId: sanitation.id,
        status: "resolved",
        dateRange: "30d",
      });

      assert.ok(dataCombined.totalReports >= 1, "Should find sanitation resolved report");
      assert.equal(dataCombined.resolvedCount, dataCombined.totalReports);
      assert.equal(dataCombined.reportsOverTime.length, 30, "Must maintain 30d continuous timeline");
    } finally {
      if (testInc?.id) {
        await supabase.from("incidents").delete().eq("id", testInc.id);
      }
    }
  });

  test("8. Barangay breakdown counts match incident locations without duplicates", async () => {
    const data = await getAdminAnalyticsData();
    assert.ok(data.barangayBreakdown.length > 0, "Barangay breakdown should have entries");

    const sumBarangayCounts = data.barangayBreakdown.reduce((sum, b) => sum + b.count, 0);
    assert.equal(
      sumBarangayCounts,
      data.totalReports,
      "Sum of barangay counts must equal totalReports"
    );
  });
});

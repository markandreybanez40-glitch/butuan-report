import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { assertSafeTestEnvironment } from "./test-safety-guard";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { setTestAuthContext } from "@/lib/data/profiles";
import {
  createResidentIncident,
  getMyPaginatedIncidents,
  getMyIncidentWithDetails,
} from "@/lib/data/incidents";
import { getStaffIncidentPaginatedQueue } from "@/lib/data/staff";
import { uploadIncidentAttachment } from "@/lib/data/attachments";
import { submitIncidentAction } from "@/app/dashboard/new/actions";
import type { Profile, IncidentCategory } from "@/types";

const TEST_RESIDENT_CLERK_ID = "test_resident_submit_audit_clerk_id";
const TEST_ADMIN_CLERK_ID = "test_admin_submit_audit_clerk_id";
const TEST_OTHER_RESIDENT_CLERK_ID = "test_other_resident_submit_audit_clerk_id";

describe("Butuan Report — Submit Report Form Audit & Verification", () => {
  const supabase = createAdminSupabaseClient();
  let residentProfile: Profile;
  let adminProfile: Profile;
  let activeCategory: IncidentCategory;
  const createdIncidentIds: string[] = [];

  before(async () => {
    assertSafeTestEnvironment("submit-report-form-verification");
    setTestAuthContext(null);

    // Clean up any existing test records
    await supabase.from("profiles").delete().in("clerk_user_id", [
      TEST_RESIDENT_CLERK_ID,
      TEST_ADMIN_CLERK_ID,
      TEST_OTHER_RESIDENT_CLERK_ID,
    ]);

    // Setup resident profile
    const { data: p1 } = await supabase
      .from("profiles")
      .insert({
        clerk_user_id: TEST_RESIDENT_CLERK_ID,
        full_name: "Audit Resident Juan",
        role: "resident",
        barangay: "Doongan",
      })
      .select()
      .single();
    assert.ok(p1, "Resident profile created");
    residentProfile = p1;

    // Setup admin profile
    const { data: pAdmin } = await supabase
      .from("profiles")
      .insert({
        clerk_user_id: TEST_ADMIN_CLERK_ID,
        full_name: "Audit Admin Maria",
        role: "admin",
      })
      .select()
      .single();
    assert.ok(pAdmin, "Admin profile created");
    adminProfile = pAdmin;

    // Setup another resident profile
    const { data: pOther } = await supabase
      .from("profiles")
      .insert({
        clerk_user_id: TEST_OTHER_RESIDENT_CLERK_ID,
        full_name: "Audit Other Resident Pedro",
        role: "resident",
        barangay: "Dagohoy",
      })
      .select()
      .single();
    assert.ok(pOther, "Other resident profile created");

    // Fetch active category
    const { data: categories } = await supabase
      .from("incident_categories")
      .select("*")
      .eq("is_active", true)
      .limit(1);
    assert.ok(categories && categories.length > 0, "Active category found");
    activeCategory = categories[0];
  });

  after(async () => {
    setTestAuthContext(null);

    if (createdIncidentIds.length > 0) {
      await supabase.from("notifications").delete().in("related_incident_id", createdIncidentIds);
      await supabase.from("incident_updates").delete().in("incident_id", createdIncidentIds);
      await supabase.from("incident_assignments").delete().in("incident_id", createdIncidentIds);
      await supabase.from("incident_attachments").delete().in("incident_id", createdIncidentIds);
      await supabase.from("incidents").delete().in("id", createdIncidentIds);
    }

    await supabase.from("profiles").delete().in("clerk_user_id", [
      TEST_RESIDENT_CLERK_ID,
      TEST_ADMIN_CLERK_ID,
      TEST_OTHER_RESIDENT_CLERK_ID,
    ]);
  });

  test("1. Required-field validation: Server actions reject missing or invalid fields", async () => {
    setTestAuthContext(TEST_RESIDENT_CLERK_ID);

    // Test missing category
    const fdNoCategory = new FormData();
    fdNoCategory.append("title", "Valid Incident Title");
    fdNoCategory.append("description", "Valid Incident Description with sufficient length");
    fdNoCategory.append("barangay", "Doongan");
    const resNoCategory = await submitIncidentAction(null, fdNoCategory);
    assert.equal(resNoCategory.success, false);
    assert.match(resNoCategory.error || "", /category/i);

    // Test title too short (< 5 chars)
    const fdShortTitle = new FormData();
    fdShortTitle.append("category_id", activeCategory.id);
    fdShortTitle.append("title", "Bad");
    fdShortTitle.append("description", "Valid Incident Description with sufficient length");
    fdShortTitle.append("barangay", "Doongan");
    const resShortTitle = await submitIncidentAction(null, fdShortTitle);
    assert.equal(resShortTitle.success, false);
    assert.match(resShortTitle.error || "", /title.*5 characters/i);

    // Test description too short (< 15 chars)
    const fdShortDesc = new FormData();
    fdShortDesc.append("category_id", activeCategory.id);
    fdShortDesc.append("title", "Valid Incident Title");
    fdShortDesc.append("description", "Too short");
    fdShortDesc.append("barangay", "Doongan");
    const resShortDesc = await submitIncidentAction(null, fdShortDesc);
    assert.equal(resShortDesc.success, false);
    assert.match(resShortDesc.error || "", /description.*15 characters/i);

    // Test missing barangay
    const fdNoBarangay = new FormData();
    fdNoBarangay.append("category_id", activeCategory.id);
    fdNoBarangay.append("title", "Valid Incident Title");
    fdNoBarangay.append("description", "Valid Incident Description with sufficient length");
    fdNoBarangay.append("barangay", "");
    const resNoBarangay = await submitIncidentAction(null, fdNoBarangay);
    assert.equal(resNoBarangay.success, false);
    assert.match(resNoBarangay.error || "", /barangay/i);

    // Test invalid latitude (> 90)
    const fdBadLat = new FormData();
    fdBadLat.append("category_id", activeCategory.id);
    fdBadLat.append("title", "Valid Incident Title");
    fdBadLat.append("description", "Valid Incident Description with sufficient length");
    fdBadLat.append("barangay", "Doongan");
    fdBadLat.append("latitude", "95.5");
    const resBadLat = await submitIncidentAction(null, fdBadLat);
    assert.equal(resBadLat.success, false);
    assert.match(resBadLat.error || "", /latitude.*between -90 and 90/i);

    // Test invalid longitude (> 180)
    const fdBadLng = new FormData();
    fdBadLng.append("category_id", activeCategory.id);
    fdBadLng.append("title", "Valid Incident Title");
    fdBadLng.append("description", "Valid Incident Description with sufficient length");
    fdBadLng.append("barangay", "Doongan");
    fdBadLng.append("longitude", "195.5");
    const resBadLng = await submitIncidentAction(null, fdBadLng);
    assert.equal(resBadLng.success, false);
    assert.match(resBadLng.error || "", /longitude.*between -180 and 180/i);
  });

  test("2. File type, size, and quantity validation", async () => {
    setTestAuthContext(TEST_RESIDENT_CLERK_ID);

    // Oversize file (> 10MB)
    const fdOversize = new FormData();
    fdOversize.append("category_id", activeCategory.id);
    fdOversize.append("title", "Oversize Attachment Incident");
    fdOversize.append("description", "Valid description for oversize attachment test");
    fdOversize.append("barangay", "Doongan");

    const hugeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
    const oversizeFile = new File([hugeBuffer], "huge_file.png", { type: "image/png" });
    fdOversize.append("attachments", oversizeFile);

    const resOversize = await submitIncidentAction(null, fdOversize);
    assert.equal(resOversize.success, false);
    assert.match(resOversize.error || "", /exceeds the 10 MB limit/i);

    // Unsupported MIME format (.exe / application/x-msdownload)
    const fdUnsupported = new FormData();
    fdUnsupported.append("category_id", activeCategory.id);
    fdUnsupported.append("title", "Unsupported Attachment Incident");
    fdUnsupported.append("description", "Valid description for unsupported attachment test");
    fdUnsupported.append("barangay", "Doongan");

    const exeFile = new File([Buffer.from("MZfake")], "malware.exe", {
      type: "application/x-msdownload",
    });
    fdUnsupported.append("attachments", exeFile);

    const resUnsupported = await submitIncidentAction(null, fdUnsupported);
    assert.equal(resUnsupported.success, false);
    assert.match(resUnsupported.error || "", /unsupported format/i);

    // Spoofed magic bytes
    const fdSpoofed = new FormData();
    fdSpoofed.append("category_id", activeCategory.id);
    fdSpoofed.append("title", "Spoofed Attachment Incident");
    fdSpoofed.append("description", "Valid description for spoofed attachment test");
    fdSpoofed.append("barangay", "Doongan");

    const spoofedFile = new File([Buffer.from("MZ...fake-executable")], "fake_image.png", {
      type: "image/png",
    });
    fdSpoofed.append("attachments", spoofedFile);

    const resSpoofed = await submitIncidentAction(null, fdSpoofed);
    assert.equal(resSpoofed.success, false);
    assert.match(
      resSpoofed.error || "",
      /Signature check failed|content does not match|validation failed/i
    );

    // Too many attachments (> 5)
    const fdTooMany = new FormData();
    fdTooMany.append("category_id", activeCategory.id);
    fdTooMany.append("title", "Too Many Attachments Incident");
    fdTooMany.append("description", "Valid description for too many attachments test");
    fdTooMany.append("barangay", "Doongan");

    const validPngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    for (let i = 0; i < 6; i++) {
      fdTooMany.append(
        "attachments",
        new File([validPngBuffer], `photo_${i}.png`, { type: "image/png" })
      );
    }
    const resTooMany = await submitIncidentAction(null, fdTooMany);
    assert.equal(resTooMany.success, false);
    assert.match(resTooMany.error || "", /Too many attachments/i);
  });

  test("3. Successful report submission without attachments & unique report number", async () => {
    setTestAuthContext(TEST_RESIDENT_CLERK_ID);

    const fd = new FormData();
    fd.append("category_id", activeCategory.id);
    fd.append("severity", "medium");
    fd.append("title", "[TEST] Road Hazard at Baan Km 3");
    fd.append("description", "Overgrown branches obstructing street lights and vision at night.");
    fd.append("barangay", "Baan Riverside");
    fd.append("street_area", "Purok 4");
    fd.append("landmark", "Near Baan Elementary School");
    fd.append("latitude", "8.9567");
    fd.append("longitude", "125.5398");

    const result = await submitIncidentAction(null, fd);
    assert.equal(result.success, true, `Submission failed: ${result.error}`);
    assert.ok(result.incidentId, "Must return incidentId");
    assert.match(
      result.reportNumber || "",
      /^BR-\d{8}-\d{5}$/,
      "Report number must follow BR-YYYYMMDD-XXXXX"
    );
    createdIncidentIds.push(result.incidentId!);

    // Verify row in Supabase
    const { data: incident } = await supabase
      .from("incidents")
      .select("*")
      .eq("id", result.incidentId)
      .single();

    assert.ok(incident, "Incident record exists");
    assert.equal(incident.reporter_id, residentProfile.id, "reporter_id must match authenticated resident");
    assert.equal(incident.status, "submitted");
    assert.equal(incident.severity, "medium");
    assert.equal(incident.barangay, "Baan Riverside");
    assert.equal(incident.latitude, 8.9567);
    assert.equal(incident.longitude, 125.5398);
  });

  test("4. Successful report submission with photo and document evidence attachments", async () => {
    setTestAuthContext(TEST_RESIDENT_CLERK_ID);

    const validPngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89,
    ]);
    const validPdfBuffer = Buffer.from("%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF");

    const fd = new FormData();
    fd.append("category_id", activeCategory.id);
    fd.append("severity", "critical");
    fd.append("title", "[TEST] Broken Main Water Pipe Flooding Street");
    fd.append("description", "High pressure water pipe leaking heavily, eroding the road base.");
    fd.append("barangay", "Doongan");
    fd.append("street_area", "Montilla Blvd ext");
    fd.append("landmark", "Beside Water District Station");
    fd.append("latitude", "8.9491");
    fd.append("longitude", "125.5422");
    fd.append(
      "attachments",
      new File([validPngBuffer], "pipe_burst_photo.png", { type: "image/png" })
    );
    fd.append(
      "attachments",
      new File([validPdfBuffer], "water_assessment.pdf", { type: "application/pdf" })
    );

    const result = await submitIncidentAction(null, fd);
    assert.equal(result.success, true, `Submission with attachments failed: ${result.error}`);
    assert.ok(result.incidentId);
    createdIncidentIds.push(result.incidentId!);

    // Verify attachments in Supabase
    const { data: attachments } = await supabase
      .from("incident_attachments")
      .select("*")
      .eq("incident_id", result.incidentId);

    assert.equal(attachments?.length, 2, "Must have exactly 2 attached records");
    for (const att of attachments || []) {
      assert.equal(att.uploader_id, residentProfile.id, "Uploader ID must match submitting resident");
      assert.ok(att.storage_path.includes(result.incidentId!), "Storage path must contain incidentId");
    }
  });

  test("5. Duplicate submission prevention within 30 seconds", async () => {
    setTestAuthContext(TEST_RESIDENT_CLERK_ID);

    const duplicateTitle = `[TEST] Duplicate Pothole Incident ${Date.now()}`;

    // First submission
    const fd1 = new FormData();
    fd1.append("category_id", activeCategory.id);
    fd1.append("title", duplicateTitle);
    fd1.append("description", "First instance of the report with complete description.");
    fd1.append("barangay", "Doongan");

    const res1 = await submitIncidentAction(null, fd1);
    assert.equal(res1.success, true);
    createdIncidentIds.push(res1.incidentId!);

    // Immediate second submission with identical title
    const fd2 = new FormData();
    fd2.append("category_id", activeCategory.id);
    fd2.append("title", duplicateTitle);
    fd2.append("description", "Second duplicate submission attempt immediately following first.");
    fd2.append("barangay", "Doongan");

    const res2 = await submitIncidentAction(null, fd2);
    assert.equal(res2.success, false, "Second immediate submission must be rejected as duplicate");
    assert.match(res2.error || "", /Duplicate report detected/i);
  });

  test("6. Ownership isolation: Resident can submit reports ONLY for themselves", async () => {
    // Attempting as resident 1
    setTestAuthContext(TEST_RESIDENT_CLERK_ID);
    const incident = await createResidentIncident({
      title: "[TEST] Resident 1 Ownership Isolation Test",
      description: "Testing that reporter_id cannot be spoofed to another user.",
      category_id: activeCategory.id,
      severity: "low",
      barangay: "Doongan",
    });

    assert.ok(incident);
    assert.equal(incident.reporter_id, residentProfile.id, "reporter_id must match caller resident 1");
    createdIncidentIds.push(incident.id);

    // Other resident cannot see Resident 1's report in My Reports
    setTestAuthContext(TEST_OTHER_RESIDENT_CLERK_ID);
    const otherResidentReports = await getMyPaginatedIncidents();
    const found = otherResidentReports.reports.find((r) => r.id === incident.id);
    assert.equal(found, undefined, "Other resident must NOT see Resident 1's report in My Reports");

    // Other resident cannot fetch details of Resident 1's report
    const otherDetails = await getMyIncidentWithDetails(incident.id);
    assert.equal(otherDetails, null, "Other resident cannot fetch Resident 1's report details");
  });

  test("7. Visibility: Submitted reports appear in resident My Reports and admin /admin/reports", async () => {
    setTestAuthContext(TEST_RESIDENT_CLERK_ID);

    const title = `[TEST] Visibility Check ${Date.now()}`;
    const fd = new FormData();
    fd.append("category_id", activeCategory.id);
    fd.append("severity", "medium");
    fd.append("title", title);
    fd.append("description", "Testing visibility across resident My Reports and admin queue.");
    fd.append("barangay", "Doongan");

    const res = await submitIncidentAction(null, fd);
    assert.equal(res.success, true);
    createdIncidentIds.push(res.incidentId!);

    // Check Resident My Reports
    const residentReports = await getMyPaginatedIncidents();
    const residentFound = residentReports.reports.find((r) => r.id === res.incidentId);
    assert.ok(residentFound, "Submitted report must appear in resident's My Reports");
    assert.equal(residentFound.title, title);

    // Check Admin Reports Queue
    const adminQueue = await getStaffIncidentPaginatedQueue(adminProfile, {
      search: title,
    });
    const adminFound = adminQueue.incidents.find((i) => i.id === res.incidentId);
    assert.ok(adminFound, "Submitted report must appear in admin queue /admin/reports");
    assert.equal(adminFound.report_number, res.reportNumber);
  });

  test("8. Failed upload resilience: Reports issues clearly if attachment upload fails", async () => {
    setTestAuthContext(TEST_RESIDENT_CLERK_ID);

    await assert.rejects(
      async () => {
        const validPngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
        const testFile = new File([validPngBuffer], "test.png", { type: "image/png" });
        await uploadIncidentAttachment("00000000-0000-0000-0000-000000000000", testFile);
      },
      /foreign key|violates|not found|error/i,
      "Upload to non-existent incident must throw error safely"
    );
  });
});

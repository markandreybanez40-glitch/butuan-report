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
import {
  getStaffIncidentPaginatedQueue,
  getStaffIncidentDetails,
} from "@/lib/data/staff";
import {
  uploadIncidentAttachment,
  validateFileBuffer,
  deleteIncidentAttachment,
} from "@/lib/data/attachments";
import {
  getMyNotifications,
  notifyIncidentSubmitted,
  notifyIncidentAssigned,
  notifyIncidentStatusChanged,
  notifyIncidentUpdateAdded,
} from "@/lib/data/notifications";
import { updateAdminReportQuickAction } from "@/app/admin/actions";
import { updateStaffIncidentStatusAction } from "@/app/staff/actions";
import { getAdminAnalyticsData } from "@/lib/data/admin";
import type { Profile, IncidentCategory, Department } from "@/types";

const TEST_RESIDENT_1_CLERK_ID = "test_resident_alpha_clerk_id";
const TEST_RESIDENT_2_CLERK_ID = "test_resident_beta_clerk_id";
const TEST_ADMIN_CLERK_ID = "test_admin_gamma_clerk_id";
const TEST_RESPONDER_CLERK_ID = "test_responder_delta_clerk_id";

describe("Butuan Report — End-to-End Incident Workflow, Security & Notifications", () => {
  assertSafeTestEnvironment("End-to-End Incident Workflow, Security & Notifications");
  const supabase = createAdminSupabaseClient();
  let resident1Profile: Profile;
  let resident2Profile: Profile;
  let adminProfile: Profile;
  let responderProfile: Profile;
  let activeCategory: IncidentCategory;
  let testDepartment: Department;
  let createdIncidentId: string;
  let uploadedAttachmentId: string;

  // Cleanup helper to keep database clean and non-destructive
  async function cleanupTestData() {
    setTestAuthContext(null);

    // 1. Delete notifications for test profiles
    const { data: testProfiles } = await supabase
      .from("profiles")
      .select("id")
      .in("clerk_user_id", [
        TEST_RESIDENT_1_CLERK_ID,
        TEST_RESIDENT_2_CLERK_ID,
        TEST_ADMIN_CLERK_ID,
        TEST_RESPONDER_CLERK_ID,
      ]);

    if (testProfiles && testProfiles.length > 0) {
      const pIds = testProfiles.map((p) => p.id);
      await supabase.from("notifications").delete().in("user_id", pIds);
    }

    // 2. Delete test incidents and related records
    const { data: testIncidents } = await supabase
      .from("incidents")
      .select("id")
      .ilike("title", "[TEST]%");

    if (testIncidents && testIncidents.length > 0) {
      const ids = testIncidents.map((i) => i.id);
      await supabase.from("notifications").delete().in("related_incident_id", ids);
      await supabase.from("incident_updates").delete().in("incident_id", ids);
      await supabase.from("incident_assignments").delete().in("incident_id", ids);
      await supabase.from("incident_attachments").delete().in("incident_id", ids);
      await supabase.from("incidents").delete().in("id", ids);
    }

    // 3. Delete test profiles
    await supabase
      .from("profiles")
      .delete()
      .in("clerk_user_id", [
        TEST_RESIDENT_1_CLERK_ID,
        TEST_RESIDENT_2_CLERK_ID,
        TEST_ADMIN_CLERK_ID,
        TEST_RESPONDER_CLERK_ID,
      ]);
  }

  before(async () => {
    await cleanupTestData();

    // 1. Create Isolated Test Profiles in Supabase
    const { data: p1, error: err1 } = await supabase
      .from("profiles")
      .insert({
        clerk_user_id: TEST_RESIDENT_1_CLERK_ID,
        full_name: "Test Resident Alpha",
        role: "resident",
        barangay: "Dagohoy",
      })
      .select()
      .single();

    assert.ok(p1 && !err1, `Failed to setup test resident 1: ${err1?.message}`);
    resident1Profile = p1;

    const { data: p2, error: err2 } = await supabase
      .from("profiles")
      .insert({
        clerk_user_id: TEST_RESIDENT_2_CLERK_ID,
        full_name: "Test Resident Beta",
        role: "resident",
        barangay: "Doongan",
      })
      .select()
      .single();

    assert.ok(p2 && !err2, `Failed to setup test resident 2: ${err2?.message}`);
    resident2Profile = p2;

    const { data: pAdmin, error: errAdmin } = await supabase
      .from("profiles")
      .insert({
        clerk_user_id: TEST_ADMIN_CLERK_ID,
        full_name: "Test Admin Gamma",
        role: "admin",
      })
      .select()
      .single();

    assert.ok(pAdmin && !errAdmin, `Failed to setup test admin: ${errAdmin?.message}`);
    adminProfile = pAdmin;

    const { data: pResp, error: errResp } = await supabase
      .from("profiles")
      .insert({
        clerk_user_id: TEST_RESPONDER_CLERK_ID,
        full_name: "Test Responder Delta",
        role: "responder",
        barangay: "Doongan",
      })
      .select()
      .single();

    assert.ok(pResp && !errResp, `Failed to setup test responder: ${errResp?.message}`);
    responderProfile = pResp;

    // 2. Get an active category
    const { data: categories, error: catErr } = await supabase
      .from("incident_categories")
      .select("*")
      .eq("is_active", true)
      .limit(1);

    assert.ok(categories && categories.length > 0 && !catErr, "No active category found");
    activeCategory = categories[0];

    // 3. Get or verify an active department
    const { data: depts, error: deptErr } = await supabase
      .from("departments")
      .select("*")
      .eq("is_active", true)
      .limit(1);

    assert.ok(depts && depts.length > 0 && !deptErr, "No active department found");
    testDepartment = depts[0];
  });

  after(async () => {
    await cleanupTestData();
  });

  test("Step 1 & 2: Resident submits a report with coordinates and attachments, persisted correctly", async () => {
    setTestAuthContext(TEST_RESIDENT_1_CLERK_ID);

    const testLatitude = 8.947512;
    const testLongitude = 125.540634;

    const incident = await createResidentIncident({
      title: "[TEST] Damaged Culvert along JC Aquino Ave",
      description: "Severe crack overflowing during heavy rain, creating road hazard.",
      category_id: activeCategory.id,
      severity: "high",
      barangay: "Dagohoy",
      street_area: "JC Aquino Ave, km 3",
      landmark: "Near DPWH Regional Office",
      latitude: testLatitude,
      longitude: testLongitude,
    });

    assert.ok(incident, "Incident creation should return created row");
    assert.ok(incident.id, "Incident must have a valid ID");
    createdIncidentId = incident.id;

    // Verify ownership and report number
    assert.equal(incident.reporter_id, resident1Profile.id, "Reporter ID must strictly match calling resident profile");
    assert.match(
      incident.report_number,
      /^BR-\d{8}-\d{5}$/,
      `Report number "${incident.report_number}" must follow municipal format BR-YYYYMMDD-XXXXX`
    );
    assert.equal(incident.status, "submitted", "Initial status must default to 'submitted'");
    assert.equal(incident.latitude, testLatitude, "Saved latitude must match input exactly");
    assert.equal(incident.longitude, testLongitude, "Saved longitude must match input exactly");

    // Upload attachment with magic byte inspection
    const validPngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
    const validation = validateFileBuffer(validPngBuffer, "image/png", "culvert_crack.png");
    assert.equal(validation.valid, true, "Magic byte inspection must validate legitimate PNG");

    const file = new File([validPngBuffer], "culvert_crack.png", { type: "image/png" });
    const attachment = await uploadIncidentAttachment(incident.id, file);

    assert.ok(attachment, "Attachment record must be created successfully");
    assert.equal(attachment.original_filename, "culvert_crack.png");
    assert.equal(attachment.incident_id, incident.id);
    assert.equal(attachment.uploader_id, resident1Profile.id);
    uploadedAttachmentId = attachment.id;

    // Trigger submission notification
    await notifyIncidentSubmitted({
      id: incident.id,
      report_number: incident.report_number,
      title: incident.title,
      barangay: incident.barangay,
      reporter_id: incident.reporter_id,
    });
  });

  test("Step 2b: Duplicate submission prevention rejects rapid identical reports", async () => {
    setTestAuthContext(TEST_RESIDENT_1_CLERK_ID);

    await assert.rejects(
      async () => {
        await createResidentIncident({
          title: "[TEST] Damaged Culvert along JC Aquino Ave",
          description: "Severe crack overflowing during heavy rain, creating road hazard.",
          category_id: activeCategory.id,
          severity: "high",
          barangay: "Dagohoy",
        });
      },
      /Duplicate report detected/i,
      "Rapid duplicate submission with identical title within 30s must be rejected"
    );
  });

  test("Step 3: Admin sees the report in /admin/reports queue", async () => {
    setTestAuthContext(TEST_ADMIN_CLERK_ID);

    const queueResult = await getStaffIncidentPaginatedQueue(adminProfile, {
      page: 1,
      pageSize: 20,
    });

    assert.ok(queueResult.totalCount >= 1, "Admin queue should return incidents");
    const found = queueResult.incidents.find((i) => i.id === createdIncidentId);
    assert.ok(found, "Admin must see Resident 1's submitted report in the queue");
    assert.equal(found?.reporter?.id, resident1Profile.id, "Admin queue must preserve correct reporter details");
  });

  test("Step 4: Admin assigns report to department & responder, advancing status to 'assigned'", async () => {
    setTestAuthContext(TEST_ADMIN_CLERK_ID);

    // 1. Create assignment record
    const { error: assignErr } = await supabase.from("incident_assignments").insert({
      incident_id: createdIncidentId,
      department_id: testDepartment.id,
      assigned_user_id: responderProfile.id,
      assigned_by: adminProfile.id,
    });
    assert.equal(assignErr, null, "Assigning incident should succeed");

    // 2. Advance incident status to 'assigned'
    const { error: statusErr } = await supabase
      .from("incidents")
      .update({ status: "assigned", updated_at: new Date().toISOString() })
      .eq("id", createdIncidentId);
    assert.equal(statusErr, null, "Advancing status to 'assigned' should succeed");

    // 3. Dispatch assignment notification
    await notifyIncidentAssigned({
      incidentId: createdIncidentId,
      departmentId: testDepartment.id,
      assignedUserId: responderProfile.id,
      actorId: adminProfile.id,
    });
  });

  test("Step 5: Admin posts a public progress update and a confidential internal note", async () => {
    setTestAuthContext(TEST_ADMIN_CLERK_ID);

    // 1. Update status to 'in_progress'
    await supabase
      .from("incidents")
      .update({ status: "in_progress", updated_at: new Date().toISOString() })
      .eq("id", createdIncidentId);

    await notifyIncidentStatusChanged({
      incidentId: createdIncidentId,
      newStatus: "in_progress",
      actorId: adminProfile.id,
      note: "Work crews are deploying heavy equipment.",
    });

    // 2. Official Public Update
    const publicMsg = "Dispatch crew deployed. Reconstruction of culvert begins immediately.";
    const { error: pubErr } = await supabase.from("incident_updates").insert({
      incident_id: createdIncidentId,
      author_id: adminProfile.id,
      message: publicMsg,
      visibility: "public",
    });
    assert.equal(pubErr, null);

    await notifyIncidentUpdateAdded({
      incidentId: createdIncidentId,
      authorId: adminProfile.id,
      message: publicMsg,
      visibility: "public",
    });

    // 3. Confidential Internal Note
    const internalMsg = "CONFIDENTIAL: Internal work order #8491. Equipment unit #3 assigned.";
    const { error: privErr } = await supabase.from("incident_updates").insert({
      incident_id: createdIncidentId,
      author_id: adminProfile.id,
      message: internalMsg,
      visibility: "internal",
    });
    assert.equal(privErr, null);

    await notifyIncidentUpdateAdded({
      incidentId: createdIncidentId,
      authorId: adminProfile.id,
      message: internalMsg,
      visibility: "internal",
    });
  });

  test("Step 6: Resident sees latest status and public update in My Reports, but internal notes remain staff-only", async () => {
    setTestAuthContext(TEST_RESIDENT_1_CLERK_ID);

    // List view
    const { reports } = await getMyPaginatedIncidents({ page: 1, pageSize: 10 });
    const myReport = reports.find((r) => r.id === createdIncidentId);
    assert.ok(myReport, "Resident 1 must see their report in My Reports");
    assert.equal(myReport?.status, "in_progress", "Resident must see the updated 'in_progress' status");

    // Detail view with attachments and updates
    const details = await getMyIncidentWithDetails(createdIncidentId);
    assert.ok(details, "Resident 1 must be able to load report details");
    assert.equal(details.status, "in_progress");

    // Attachment signed URL
    assert.ok(details.attachments.length >= 1, "Resident must see their uploaded attachment");
    assert.ok(details.attachments[0].signed_url, "Attachment must have an accessible signed URL");

    // Updates visibility check
    const hasPublicUpdate = details.updates.some((u) => u.message.includes("Dispatch crew deployed"));
    assert.ok(hasPublicUpdate, "Resident must see the public milestone update");

    const hasInternalNote = details.updates.some(
      (u) => u.visibility === "internal" || u.message.includes("CONFIDENTIAL")
    );
    assert.equal(hasInternalNote, false, "Internal notes must NEVER be exposed to resident");
  });

  test("Step 6b: Admin sees BOTH public updates and internal notes in report details", async () => {
    setTestAuthContext(TEST_ADMIN_CLERK_ID);

    const adminDetails = await getStaffIncidentDetails(createdIncidentId, adminProfile);
    assert.ok(adminDetails, "Admin must be able to load full incident details");

    const hasPublic = adminDetails.updates.some((u) => u.visibility === "public");
    const hasInternal = adminDetails.updates.some((u) => u.visibility === "internal");

    assert.ok(hasPublic, "Admin must see public updates");
    assert.ok(hasInternal, "Admin must see confidential internal notes");
  });

  test("Step 7: Resident receives appropriate notifications with complete isolation and deduplication", async () => {
    setTestAuthContext(TEST_RESIDENT_1_CLERK_ID);

    const notifications = await getMyNotifications(50);
    assert.ok(notifications.length >= 3, "Resident 1 should receive lifecycle notifications");

    const types = notifications.map((n) => n.type);
    assert.ok(types.includes("report_submitted"), "Must contain 'report_submitted' notification");
    assert.ok(types.includes("report_assigned"), "Must contain 'report_assigned' notification");
    assert.ok(types.includes("status_changed"), "Must contain 'status_changed' notification");
    assert.ok(types.includes("public_update"), "Must contain 'public_update' notification");

    // Verify deduplication: re-triggering notification should not insert duplicates
    const initialCount = notifications.length;
    await notifyIncidentSubmitted({
      id: createdIncidentId,
      report_number: "BR-TEST-DUPE",
      title: "Duplicate Test",
      barangay: "Dagohoy",
      reporter_id: resident1Profile.id,
    });
    const afterCount = (await getMyNotifications(50)).length;
    assert.equal(afterCount, initialCount, "Re-notifying submission should not duplicate notification records");
  });

  test("Security & Boundary: Resident 2 has zero access to Resident 1's report, attachments, or notifications", async () => {
    setTestAuthContext(TEST_RESIDENT_2_CLERK_ID);
    assert.equal(resident2Profile.role, "resident");

    // 1. My Reports isolation
    const { reports, totalCount } = await getMyPaginatedIncidents({ page: 1, pageSize: 10 });
    assert.equal(totalCount, 0, "Resident 2 has no reports and must see 0");
    assert.equal(reports.find((r) => r.id === createdIncidentId), undefined);

    // 2. Direct detail access boundary
    const details = await getMyIncidentWithDetails(createdIncidentId);
    assert.equal(details, null, "Resident 2 must receive null when querying Resident 1's report");

    // 3. Attachment deletion boundary
    const deleteRes = await deleteIncidentAttachment(uploadedAttachmentId);
    assert.equal(deleteRes.success, false, "Resident 2 must not be able to delete Resident 1's attachment");
    assert.match(deleteRes.error || "", /Forbidden|Security Policy/i);

    // 4. Notifications isolation
    const notifs = await getMyNotifications(50);
    assert.equal(notifs.length, 0, "Resident 2 must receive 0 notifications belonging to Resident 1");
  });

  test("Step 8: Admin marks report as resolved -> automatically closes, sets timestamps, records audit events, notifies resident once", async () => {
    // 1. Security Check: Resident cannot resolve or close incidents via admin quick actions or staff action
    setTestAuthContext(TEST_RESIDENT_1_CLERK_ID);
    const unauthorizedAttempt = await updateAdminReportQuickAction({
      incidentId: createdIncidentId,
      markResolved: true,
      adminRemarks: "Unauthorized attempt",
    });
    assert.equal(unauthorizedAttempt.success, false, "Residents must be forbidden from resolving/closing incidents");
    assert.match(unauthorizedAttempt.error || "", /Forbidden|Administrator credentials required/i);

    const residentStaffFormData = new FormData();
    residentStaffFormData.append("incident_id", createdIncidentId);
    residentStaffFormData.append("status", "resolved");
    residentStaffFormData.append("note", "Resident unauthorized resolve");
    const unauthorizedStaffAttempt = await updateStaffIncidentStatusAction(residentStaffFormData);
    assert.equal(unauthorizedStaffAttempt.success, false, "Residents must be forbidden from staff status actions");
    assert.match(unauthorizedStaffAttempt.error || "", /Forbidden/i);

    // 2. Admin marks report as resolved via trusted server action
    setTestAuthContext(TEST_ADMIN_CLERK_ID);
    const resolveResult = await updateAdminReportQuickAction({
      incidentId: createdIncidentId,
      markResolved: true,
      adminRemarks: "Culvert repair completed successfully and tested under drainage runoff.",
      isInternalNote: false, // public update so resident sees remarks
    });

    assert.equal(resolveResult.success, true, "Admin marking incident as resolved must succeed");

    // 3. Database Integrity: Check database directly to confirm status is 'closed' and both timestamps are set
    const { data: dbIncident, error: dbErr } = await supabase
      .from("incidents")
      .select("status, resolved_at, closed_at")
      .eq("id", createdIncidentId)
      .single();

    assert.equal(dbErr, null);
    assert.equal(dbIncident?.status, "closed", "Marking incident as resolved must automatically transition database status to 'closed'");
    assert.ok(dbIncident?.resolved_at, "resolved_at timestamp must be set");
    assert.ok(dbIncident?.closed_at, "closed_at timestamp must be set");

    // 4. Audit Log Integrity: Confirm both resolution and closure events are recorded
    const { data: auditLogs } = await supabase
      .from("audit_logs")
      .select("action, metadata")
      .eq("entity_id", createdIncidentId);

    const auditActions = auditLogs?.map((l) => l.action) || [];
    assert.ok(auditActions.includes("incident_resolved"), "Audit logs must preserve 'incident_resolved' event");
    assert.ok(auditActions.includes("incident_closed"), "Audit logs must preserve 'incident_closed' event");

    // 5. Resident Verification: Resident sees 'closed' status and resolution details
    setTestAuthContext(TEST_RESIDENT_1_CLERK_ID);
    const finalDetails = await getMyIncidentWithDetails(createdIncidentId);
    assert.ok(finalDetails, "Resident must be able to load resolved/closed report");
    assert.equal(finalDetails.status, "closed", "Resident must see the final 'closed' status");
    assert.ok(finalDetails.resolved_at, "Resident must see resolved_at timestamp");
    assert.ok(finalDetails.assignments, "Assignments must be preserved");

    // Check that timeline preserves BOTH resolution and closure events
    const hasResolutionUpdate = finalDetails.updates.some((u) =>
      u.message.includes("Culvert repair completed") || u.message.toLowerCase().includes("resolved")
    );
    const hasClosureUpdate = finalDetails.updates.some((u) =>
      u.message.toLowerCase().includes("closed")
    );
    assert.ok(hasResolutionUpdate, "Resident timeline must display resolution event");
    assert.ok(hasClosureUpdate, "Resident timeline must display automatic closure event");

    // 6. Notification Integrity: Resident receives final status notification without duplicate
    const notifs = await getMyNotifications(50);
    const terminalNotifs = notifs.filter(
      (n) => n.related_incident_id === createdIncidentId && (n.type === "report_resolved" || n.type === "report_closed")
    );
    assert.equal(terminalNotifs.length, 1, "Resident must receive exactly ONE notification for final resolution/closure (no duplicates)");
    assert.equal(terminalNotifs[0].type, "report_closed");

    // 7. Admin Queue Verification: Report remains visible in default queue (status='all')
    setTestAuthContext(TEST_ADMIN_CLERK_ID);
    const adminQueue = await getStaffIncidentPaginatedQueue(adminProfile, {});
    const foundResolved = adminQueue.incidents.find((i) => i.id === createdIncidentId);
    assert.ok(foundResolved, "Closed report must NOT be hidden from admin default report list");
    assert.equal(foundResolved?.status, "closed");
  });

  test("Step 9: Idempotency & Analytics — Repeated requests prevent duplicate entries & analytics counts auto-closed incidents as resolved", async () => {
    // 1. Idempotency test: Repeated request to mark as resolved
    setTestAuthContext(TEST_ADMIN_CLERK_ID);
    const repeatedResult = await updateAdminReportQuickAction({
      incidentId: createdIncidentId,
      markResolved: true,
      adminRemarks: "Duplicate click attempt",
      isInternalNote: true,
    });
    assert.equal(repeatedResult.success, true, "Repeated quick action should return cleanly");

    // Verify audit logs did NOT create duplicate resolution or closure entries
    const { data: auditLogsAfterRepeat } = await supabase
      .from("audit_logs")
      .select("action")
      .eq("entity_id", createdIncidentId);

    const resolvedAuditCount = (auditLogsAfterRepeat || []).filter((l) => l.action === "incident_resolved").length;
    const closedAuditCount = (auditLogsAfterRepeat || []).filter((l) => l.action === "incident_closed").length;
    assert.equal(resolvedAuditCount, 1, "There must be exactly ONE incident_resolved audit log entry (no duplicates on repeated request)");
    assert.equal(closedAuditCount, 1, "There must be exactly ONE incident_closed audit log entry (no duplicates on repeated request)");

    // Verify resident did NOT receive duplicate notifications
    setTestAuthContext(TEST_RESIDENT_1_CLERK_ID);
    const notifsAfterRepeat = await getMyNotifications(50);
    const terminalNotifsAfterRepeat = notifsAfterRepeat.filter(
      (n) => n.related_incident_id === createdIncidentId && (n.type === "report_resolved" || n.type === "report_closed")
    );
    assert.equal(terminalNotifsAfterRepeat.length, 1, "Resident must still have exactly ONE terminal notification after repeated admin action");

    // 2. Analytics Integration Test:
    // When filtering by status='resolved', the automatically closed incident with resolved_at MUST be matched
    const analyticsResolvedFilter = await getAdminAnalyticsData({
      status: "resolved",
      dateRange: "all",
    });
    assert.ok(
      analyticsResolvedFilter.totalReports >= 1,
      "Analytics filter for status='resolved' must match automatically closed incidents with resolved_at timestamps"
    );

    // Verify global analytics resolution count and rate
    const analyticsAll = await getAdminAnalyticsData({ dateRange: "all" });
    assert.ok(analyticsAll.resolvedCount >= 1, "Global analytics resolvedCount must include automatically closed resolved incidents");
    assert.ok(analyticsAll.resolutionRate > 0, "Global resolution rate must be greater than 0");

    // Verify reportsOverTime timeline attributes resolution using resolution timestamp
    const sumResolvedTimeline = analyticsAll.reportsOverTime.reduce((sum, p) => sum + p.resolved, 0);
    assert.ok(sumResolvedTimeline >= 1, "reportsOverTime timeline must attribute resolution count using resolved_at timestamp");
  });
});

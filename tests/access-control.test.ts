import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { assertSafeTestEnvironment } from "./test-safety-guard";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { setTestAuthContext, getCurrentProfile } from "@/lib/data/profiles";
import {
  createResidentIncident,
  getMyPaginatedIncidents,
} from "@/lib/data/incidents";
import {
  validateFileBuffer,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_MIME_TYPES,
} from "@/lib/data/attachments";
import { updateUserRoleAction, createDepartmentAction } from "@/app/admin/actions";
import {
  fetchUnreadCountAction,
  fetchNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  deleteNotificationAction,
} from "@/app/notifications/actions";
import type { Profile, IncidentCategory } from "@/types";

const TEST_RESIDENT_CLERK_ID = "test_sec_resident_clerk_id";
const TEST_ADMIN_CLERK_ID = "test_sec_admin_clerk_id";

describe("Butuan Report — Access Control, Boundaries & Coordinate Persistence", () => {
  assertSafeTestEnvironment("Access Control, Boundaries & Coordinate Persistence");
  const supabase = createAdminSupabaseClient();
  let residentProfile: Profile;
  let adminProfile: Profile;
  let activeCategory: IncidentCategory;
  const createdIncidentIds: string[] = [];

  async function cleanup() {
    setTestAuthContext(null);

    if (createdIncidentIds.length > 0) {
      await supabase.from("incident_updates").delete().in("incident_id", createdIncidentIds);
      await supabase.from("incidents").delete().in("id", createdIncidentIds);
    }

    const { data: existingProfiles } = await supabase
      .from("profiles")
      .select("id")
      .in("clerk_user_id", [TEST_RESIDENT_CLERK_ID, TEST_ADMIN_CLERK_ID]);

    if (existingProfiles && existingProfiles.length > 0) {
      const pIds = existingProfiles.map((p) => p.id);
      await supabase.from("notifications").delete().in("user_id", pIds);
      await supabase.from("incident_updates").delete().in("author_id", pIds);
      await supabase.from("incident_assignments").delete().in("assigned_user_id", pIds);
      await supabase.from("incidents").delete().in("reporter_id", pIds);
    }

    await supabase
      .from("profiles")
      .delete()
      .in("clerk_user_id", [TEST_RESIDENT_CLERK_ID, TEST_ADMIN_CLERK_ID]);
  }

  before(async () => {
    await cleanup();

    // Setup 1 resident and 1 admin profile
    const { data: pRes } = await supabase
      .from("profiles")
      .insert({
        clerk_user_id: TEST_RESIDENT_CLERK_ID,
        full_name: "Test Security Resident",
        role: "resident",
        barangay: "Baan Riverside",
      })
      .select()
      .single();

    assert.ok(pRes);
    residentProfile = pRes;

    const { data: pAdm } = await supabase
      .from("profiles")
      .insert({
        clerk_user_id: TEST_ADMIN_CLERK_ID,
        full_name: "Test Security Admin",
        role: "admin",
      })
      .select()
      .single();

    assert.ok(pAdm);
    adminProfile = pAdm;

    const { data: categories } = await supabase
      .from("incident_categories")
      .select("*")
      .eq("is_active", true)
      .limit(1);

    assert.ok(categories && categories.length > 0);
    activeCategory = categories[0];
  });

  after(async () => {
    await cleanup();
  });

  test("1. Unauthenticated requests are rejected gracefully", async () => {
    setTestAuthContext(null);

    // Profile check
    const profile = await getCurrentProfile();
    assert.equal(profile, null, "Unauthenticated profile must be null");

    // My reports check
    const reportsResult = await getMyPaginatedIncidents();
    assert.equal(reportsResult.totalCount, 0, "Unauthenticated user has 0 reports");
    assert.deepEqual(reportsResult.reports, [], "Unauthenticated user gets empty reports array");

    // Submission check
    await assert.rejects(
      async () => {
        await createResidentIncident({
          title: "Unauthorized report",
          description: "Should fail because user is not authenticated",
          category_id: activeCategory.id,
          severity: "low",
          barangay: "Baan Riverside",
        });
      },
      /User profile not found/i,
      "createResidentIncident must reject unauthenticated caller"
    );

    // Notification actions unauthenticated checks
    const unreadCount = await fetchUnreadCountAction();
    assert.equal(unreadCount, 0, "Unauthenticated user gets 0 unread notifications");

    const notifs = await fetchNotificationsAction();
    assert.deepEqual(notifs, [], "Unauthenticated user gets empty notifications list");

    const markReadRes = await markNotificationAsReadAction("00000000-0000-0000-0000-000000000000");
    assert.equal(markReadRes.success, false, "Unauthenticated mark as read must fail");
    assert.equal(markReadRes.error, "Unauthorized");

    const markAllRes = await markAllNotificationsAsReadAction();
    assert.equal(markAllRes.success, false, "Unauthenticated mark all as read must fail");
    assert.equal(markAllRes.error, "Unauthorized");

    const delNotifRes = await deleteNotificationAction("00000000-0000-0000-0000-000000000000");
    assert.equal(delNotifRes.success, false, "Unauthenticated delete notification must fail");
    assert.equal(delNotifRes.error, "Unauthorized");
  });

  test("2. Non-admin users cannot access administrative mutation actions", async () => {
    assert.equal(adminProfile.role, "admin");
    // Act as resident
    setTestAuthContext(TEST_RESIDENT_CLERK_ID);

    // Try modifying user roles
    const roleFormData = new FormData();
    roleFormData.append("user_id", residentProfile.id);
    roleFormData.append("role", "admin");

    const roleResult = await updateUserRoleAction(roleFormData);
    assert.equal(roleResult.success, false, "Resident must not be permitted to modify user roles");
    assert.match(roleResult.error || "", /Forbidden|Administrator/i);

    // Try creating departments
    const deptFormData = new FormData();
    deptFormData.append("name", "Illegal Rogue Department");
    deptFormData.append("description", "Unauthorized department creation attempt");

    const deptResult = await createDepartmentAction(deptFormData);
    assert.equal(deptResult.success, false, "Resident must not be permitted to create departments");
    assert.match(deptResult.error || "", /Forbidden|Administrator/i);
  });

  test("3. Exact GPS coordinates persist without drift or hardcoded fallbacks", async () => {
    setTestAuthContext(TEST_RESIDENT_CLERK_ID);

    const highPrecisionLat = 8.9512345;
    const highPrecisionLng = 125.5345678;

    const incident = await createResidentIncident({
      title: "[TEST] High Precision Coordinate Verification",
      description: "Testing exact floating-point GPS coordinate retention without coordinate substitution.",
      category_id: activeCategory.id,
      severity: "medium",
      barangay: "Baan Riverside",
      latitude: highPrecisionLat,
      longitude: highPrecisionLng,
    });

    assert.ok(incident);
    createdIncidentIds.push(incident.id);

    // Verify stored values match exact coordinates
    assert.equal(Number(incident.latitude?.toFixed(6)), Number(highPrecisionLat.toFixed(6)));
    assert.equal(Number(incident.longitude?.toFixed(6)), Number(highPrecisionLng.toFixed(6)));
  });

  test("4. Missing coordinates are saved as null and never replaced with default coordinates", async () => {
    setTestAuthContext(TEST_RESIDENT_CLERK_ID);

    const incident = await createResidentIncident({
      title: "[TEST] Descriptive Location Without GPS",
      description: "Testing that reports without GPS preserve null coordinates instead of hardcoding Butuan Hall coordinates.",
      category_id: activeCategory.id,
      severity: "low",
      barangay: "Baan Riverside",
      street_area: "Purok 4A near river bank",
      landmark: "Old Wooden Chapel",
      latitude: null,
      longitude: null,
    });

    assert.ok(incident);
    createdIncidentIds.push(incident.id);

    // Coordinates must be null — never replaced by default (8.9475, 125.5406)
    assert.equal(incident.latitude, null, "Latitude must remain null when omitted");
    assert.equal(incident.longitude, null, "Longitude must remain null when omitted");
    assert.equal(incident.street_area, "Purok 4A near river bank");
    assert.equal(incident.landmark, "Old Wooden Chapel");
  });

  test("5. Attachment security: Magic byte signature and MIME inspection", () => {
    // 1. Genuine PNG header: 89 50 4E 47 0D 0A 1A 0A
    const validPngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    ]);
    const pngResult = validateFileBuffer(validPngBuffer, "image/png", "sample.png");
    assert.equal(pngResult.valid, true);
    assert.equal(pngResult.detectedMime, "image/png");

    // 2. Genuine JPEG header: FF D8 FF
    const validJpgBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const jpgResult = validateFileBuffer(validJpgBuffer, "image/jpeg", "sample.jpg");
    assert.equal(jpgResult.valid, true);
    assert.equal(jpgResult.detectedMime, "image/jpeg");

    // 3. Genuine PDF header: %PDF
    const validPdfBuffer = Buffer.from("%PDF-1.7 and test content", "ascii");
    const pdfResult = validateFileBuffer(validPdfBuffer, "application/pdf", "document.pdf");
    assert.equal(pdfResult.valid, true);
    assert.equal(pdfResult.detectedMime, "application/pdf");

    // 4. Malicious Spoofed Executable disguised with .png filename and MIME type
    // Windows MZ executable signature: 4D 5A
    const spoofedExeBuffer = Buffer.from([
      0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00,
    ]);
    const spoofResult = validateFileBuffer(spoofedExeBuffer, "image/png", "exploit.png");
    assert.equal(spoofResult.valid, false, "Executable payload disguised as PNG must be rejected");
    assert.match(spoofResult.error || "", /Signature check failed|content does not match/i);
  });

  test("6. Attachment configuration limits and MIME constraints", () => {
    assert.equal(MAX_FILE_SIZE_BYTES, 10 * 1024 * 1024, "File size limit must be 10 MB");
    assert.ok(ALLOWED_MIME_TYPES.includes("image/jpeg"));
    assert.ok(ALLOWED_MIME_TYPES.includes("image/png"));
    assert.ok(ALLOWED_MIME_TYPES.includes("image/webp"));
    assert.ok(ALLOWED_MIME_TYPES.includes("application/pdf"));
    assert.equal(
      ALLOWED_MIME_TYPES.includes("application/x-msdownload"),
      false,
      "Executable formats must not be allowed"
    );
  });

  test("7. Notification actions: Authenticated user operations, isolation & lifecycle", async () => {
    // Clean any prior test notifications
    await supabase.from("notifications").delete().in("user_id", [residentProfile.id, adminProfile.id]);

    // 1. Act as resident
    setTestAuthContext(TEST_RESIDENT_CLERK_ID);

    // Initial count should be 0
    const initialCount = await fetchUnreadCountAction();
    assert.equal(initialCount, 0, "Initial unread count for resident should be 0");

    // Insert 1 unread notification for resident and 1 for admin
    const { data: resNotif, error: notifErr1 } = await supabase
      .from("notifications")
      .insert({
        user_id: residentProfile.id,
        title: "Test Resident Alert",
        message: "Your report has been acknowledged.",
        type: "status_change",
      })
      .select()
      .single();

    assert.ok(resNotif, "Resident notification must insert successfully");
    assert.equal(notifErr1, null);

    const { data: admNotif, error: notifErr2 } = await supabase
      .from("notifications")
      .insert({
        user_id: adminProfile.id,
        title: "Test Admin Alert",
        message: "New incident submitted.",
        type: "new_incident",
      })
      .select()
      .single();

    assert.ok(admNotif, "Admin notification must insert successfully");
    assert.equal(notifErr2, null);

    // Resident unread count should now be 1 (admin's notif is isolated)
    const countAfterInsert = await fetchUnreadCountAction();
    assert.equal(countAfterInsert, 1, "Resident unread count must only reflect own notifications");

    // Resident fetchNotificationsAction returns only resident's notification
    const residentNotifs = await fetchNotificationsAction();
    assert.equal(residentNotifs.length, 1);
    assert.equal(residentNotifs[0].id, resNotif.id);
    assert.equal(residentNotifs[0].title, "Test Resident Alert");

    // Resident cannot mark admin's notification as read (ownership protection)
    const illegalMark = await markNotificationAsReadAction(admNotif.id);
    assert.equal(illegalMark.success, false, "Resident cannot mark another user's notification as read");

    // Resident cannot delete admin's notification
    const illegalDelete = await deleteNotificationAction(admNotif.id);
    assert.equal(illegalDelete.success, false, "Resident cannot delete another user's notification");

    // Resident marks own notification as read
    const legalMark = await markNotificationAsReadAction(resNotif.id);
    assert.equal(legalMark.success, true, "Resident can mark own notification as read");

    // Count should now be 0
    const countAfterRead = await fetchUnreadCountAction();
    assert.equal(countAfterRead, 0, "Unread count must be 0 after marking as read");

    // Admin should see their own notification isolated
    setTestAuthContext(TEST_ADMIN_CLERK_ID);
    const adminNotifs = await fetchNotificationsAction();
    const adminCount = await fetchUnreadCountAction();
    assert.equal(adminCount, adminNotifs.length, "Admin sees their own unread notifications");

    // Clean up notifications
    await supabase.from("notifications").delete().in("id", [resNotif.id, admNotif.id]);
    setTestAuthContext(null);
  });
});

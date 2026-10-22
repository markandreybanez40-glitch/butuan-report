import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { setTestAuthContext, getCurrentProfile } from "@/lib/data/profiles";
import {
  fetchUnreadCountAction,
  fetchNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  deleteNotificationAction,
} from "@/app/notifications/actions";
import {
  notifyIncidentAssigned,
  notifyIncidentStatusChanged,
} from "@/lib/data/notifications";
import { updateUserRoleAction } from "@/app/admin/actions";
import { updateStaffIncidentStatusAction } from "@/app/staff/actions";
import type { Profile, IncidentCategory, Incident } from "@/types";

const TEST_RESIDENT_CLERK_ID = "test_reg_resident_clerk_id";
const TEST_RESPONDER_CLERK_ID = "test_reg_responder_clerk_id";
const TEST_DISPATCHER_CLERK_ID = "test_reg_dispatcher_clerk_id";
const TEST_ADMIN_CLERK_ID = "test_reg_admin_clerk_id";

describe("Butuan Report — Notifications & Portals Regression Suite", () => {
  const supabase = createAdminSupabaseClient();
  let residentProfile: Profile;
  let responderProfile: Profile;
  let dispatcherProfile: Profile;
  let adminProfile: Profile;
  let testCategory: IncidentCategory;
  let testIncident: Incident;
  const createdNotificationIds: string[] = [];

  async function cleanup() {
    setTestAuthContext(null);

    const { data: existingProfiles } = await supabase
      .from("profiles")
      .select("id")
      .in("clerk_user_id", [
        TEST_RESIDENT_CLERK_ID,
        TEST_RESPONDER_CLERK_ID,
        TEST_DISPATCHER_CLERK_ID,
        TEST_ADMIN_CLERK_ID,
      ]);

    if (existingProfiles && existingProfiles.length > 0) {
      const profileIds = existingProfiles.map((p) => p.id);
      await supabase.from("notifications").delete().in("user_id", profileIds);
      await supabase.from("incident_updates").delete().in("author_id", profileIds);
      await supabase.from("incident_assignments").delete().in("assigned_user_id", profileIds);
      await supabase.from("incidents").delete().in("reporter_id", profileIds);
    }

    if (testIncident?.id) {
      await supabase.from("notifications").delete().eq("related_incident_id", testIncident.id);
      await supabase.from("incident_assignments").delete().eq("incident_id", testIncident.id);
      await supabase.from("incident_updates").delete().eq("incident_id", testIncident.id);
      await supabase.from("incidents").delete().eq("id", testIncident.id);
    }

    await supabase
      .from("profiles")
      .delete()
      .in("clerk_user_id", [
        TEST_RESIDENT_CLERK_ID,
        TEST_RESPONDER_CLERK_ID,
        TEST_DISPATCHER_CLERK_ID,
        TEST_ADMIN_CLERK_ID,
      ]);
  }

  before(async () => {
    await cleanup();

    // 1. Create 4 test profiles representing all 4 portals
    const { data: res } = await supabase
      .from("profiles")
      .insert({
        clerk_user_id: TEST_RESIDENT_CLERK_ID,
        full_name: "Regression Test Resident",
        role: "resident",
        barangay: "Doongan",
      })
      .select()
      .single();
    assert.ok(res);
    residentProfile = res;

    const { data: resp } = await supabase
      .from("profiles")
      .insert({
        clerk_user_id: TEST_RESPONDER_CLERK_ID,
        full_name: "Regression Test Responder",
        role: "responder",
        barangay: "Baan Riverside",
      })
      .select()
      .single();
    assert.ok(resp);
    responderProfile = resp;

    const { data: disp } = await supabase
      .from("profiles")
      .insert({
        clerk_user_id: TEST_DISPATCHER_CLERK_ID,
        full_name: "Regression Test Dispatcher",
        role: "dispatcher",
        barangay: "Libertad",
      })
      .select()
      .single();
    assert.ok(disp);
    dispatcherProfile = disp;

    const { data: adm } = await supabase
      .from("profiles")
      .insert({
        clerk_user_id: TEST_ADMIN_CLERK_ID,
        full_name: "Regression Test Admin",
        role: "admin",
        barangay: "San Vicente",
      })
      .select()
      .single();
    assert.ok(adm);
    adminProfile = adm;

    // 2. Fetch or verify active category
    const { data: categories } = await supabase
      .from("incident_categories")
      .select("*")
      .eq("is_active", true)
      .limit(1);
    assert.ok(categories && categories.length > 0);
    testCategory = categories[0];

    // 3. Create a test incident for workflow event notifications
    const { data: inc } = await supabase
      .from("incidents")
      .insert({
        title: "Regression Notification Incident",
        description: "Testing notification trigger lifecycle across all portals",
        category_id: testCategory.id,
        severity: "medium",
        barangay: "Doongan",
        reporter_id: residentProfile.id,
        status: "submitted",
        report_number: `REG-${Date.now().toString().slice(-6)}`,
      })
      .select()
      .single();
    assert.ok(inc);
    testIncident = inc;
  });

  after(async () => {
    await cleanup();
  });

  test("1. Signed-out users: Safe handling across all notification actions without exceptions", async () => {
    setTestAuthContext(null);

    // Profile must be null
    const profile = await getCurrentProfile();
    assert.equal(profile, null);

    // Unread count must safely return 0
    const count = await fetchUnreadCountAction();
    assert.equal(count, 0, "Signed-out unread count must safely return 0");

    // Notifications list must safely return empty array
    const items = await fetchNotificationsAction();
    assert.deepEqual(items, [], "Signed-out notifications list must safely return []");

    // Mutations must return Unauthorized safely
    const markReadRes = await markNotificationAsReadAction("00000000-0000-0000-0000-000000000000");
    assert.equal(markReadRes.success, false);
    assert.equal(markReadRes.error, "Unauthorized");

    const markAllRes = await markAllNotificationsAsReadAction();
    assert.equal(markAllRes.success, false);
    assert.equal(markAllRes.error, "Unauthorized");

    const deleteRes = await deleteNotificationAction("00000000-0000-0000-0000-000000000000");
    assert.equal(deleteRes.success, false);
    assert.equal(deleteRes.error, "Unauthorized");
  });

  test("2. Authenticated users across all four portals can fetch unread counts accurately", async () => {
    // 1. Resident (Portal 1: /dashboard)
    setTestAuthContext(TEST_RESIDENT_CLERK_ID);
    const resBase = await fetchUnreadCountAction();
    const { data: resIns } = await supabase.from("notifications").insert([
      { user_id: residentProfile.id, title: "Res Alert 1", message: "Notice 1", type: "status_change" },
      { user_id: residentProfile.id, title: "Res Alert 2", message: "Notice 2", type: "status_change" },
    ]).select();
    assert.ok(resIns);
    resIns?.forEach((n) => createdNotificationIds.push(n.id));
    const resAfter = await fetchUnreadCountAction();
    assert.ok(resAfter >= resBase + 2, "Resident unread count incremented by at least 2");
    const resItems = await fetchNotificationsAction();
    assert.ok(resItems.some((n) => n.id === resIns[0].id));
    assert.ok(resItems.some((n) => n.id === resIns[1].id));

    // 2. Responder (Portal 2: /staff)
    setTestAuthContext(TEST_RESPONDER_CLERK_ID);
    const respBase = await fetchUnreadCountAction();
    const { data: respIns } = await supabase.from("notifications").insert([
      { user_id: responderProfile.id, title: "Resp Alert 1", message: "Assignment 1", type: "assignment" },
    ]).select();
    assert.ok(respIns);
    respIns?.forEach((n) => createdNotificationIds.push(n.id));
    const respAfter = await fetchUnreadCountAction();
    assert.ok(respAfter >= respBase + 1, "Responder unread count incremented by at least 1");
    const respItems = await fetchNotificationsAction();
    assert.ok(respItems.some((n) => n.id === respIns[0].id));

    // 3. Dispatcher (Portal 3: /dispatcher)
    setTestAuthContext(TEST_DISPATCHER_CLERK_ID);
    const dispBase = await fetchUnreadCountAction();
    const { data: dispIns } = await supabase.from("notifications").insert([
      { user_id: dispatcherProfile.id, title: "Disp Alert 1", message: "Triage 1", type: "new_incident" },
    ]).select();
    assert.ok(dispIns);
    dispIns?.forEach((n) => createdNotificationIds.push(n.id));
    const dispAfter = await fetchUnreadCountAction();
    assert.ok(dispAfter >= dispBase + 1, "Dispatcher unread count incremented by at least 1");
    const dispItems = await fetchNotificationsAction();
    assert.ok(dispItems.some((n) => n.id === dispIns[0].id));

    // 4. Admin (Portal 4: /admin)
    setTestAuthContext(TEST_ADMIN_CLERK_ID);
    const admBase = await fetchUnreadCountAction();
    const { data: admIns } = await supabase.from("notifications").insert([
      { user_id: adminProfile.id, title: "Adm Alert 1", message: "Admin 1", type: "new_incident" },
      { user_id: adminProfile.id, title: "Adm Alert 2", message: "Admin 2", type: "new_incident" },
    ]).select();
    assert.ok(admIns);
    admIns?.forEach((n) => createdNotificationIds.push(n.id));
    const admAfter = await fetchUnreadCountAction();
    assert.ok(admAfter >= admBase + 2, "Admin unread count incremented by at least 2");
    const admItems = await fetchNotificationsAction();
    assert.ok(admItems.some((n) => n.id === admIns[0].id));
  });

  test("3. Mark-as-read and mark-all-as-read work correctly across roles", async () => {
    // 1. Resident marks single notification as read
    setTestAuthContext(TEST_RESIDENT_CLERK_ID);
    const resNotifs = await fetchNotificationsAction({ unreadOnly: true });
    assert.ok(resNotifs.length >= 2);
    const targetNotif = resNotifs[0];
    const resCountBefore = await fetchUnreadCountAction();

    const singleReadRes = await markNotificationAsReadAction(targetNotif.id);
    assert.equal(singleReadRes.success, true, "Mark single notification as read succeeds");

    const resCountAfterSingle = await fetchUnreadCountAction();
    assert.equal(resCountAfterSingle, resCountBefore - 1, "Resident unread count decreased by 1");

    // 2. Resident marks all remaining as read
    const allReadRes = await markAllNotificationsAsReadAction();
    assert.equal(allReadRes.success, true, "Mark all notifications as read succeeds");

    const resCountAfterAll = await fetchUnreadCountAction();
    assert.equal(resCountAfterAll, 0, "Resident unread count decreased to 0");

    // 3. Admin marks all as read
    setTestAuthContext(TEST_ADMIN_CLERK_ID);
    const admCountBefore = await fetchUnreadCountAction();
    assert.ok(admCountBefore > 0);
    const admAllRes = await markAllNotificationsAsReadAction();
    assert.equal(admAllRes.success, true);
    assert.equal(await fetchUnreadCountAction(), 0, "Admin unread count decreased to 0");
  });

  test("4. Strict ownership isolation: Users can only access and modify their own notifications", async () => {
    // Insert 1 fresh notification for responder and 1 for resident
    const { data: inserted } = await supabase
      .from("notifications")
      .insert([
        { user_id: responderProfile.id, title: "Resp Isolation Test", message: "Notice", type: "assignment" },
        { user_id: residentProfile.id, title: "Res Isolation Test", message: "Notice", type: "status_change" },
      ])
      .select();

    const respNotif = inserted?.find((n) => n.user_id === responderProfile.id);
    const resNotif = inserted?.find((n) => n.user_id === residentProfile.id);
    assert.ok(respNotif);
    assert.ok(resNotif);
    createdNotificationIds.push(respNotif.id, resNotif.id);

    // Resident attempts to mark responder's notification as read -> must fail
    setTestAuthContext(TEST_RESIDENT_CLERK_ID);
    const illegalMark = await markNotificationAsReadAction(respNotif.id);
    assert.equal(illegalMark.success, false, "Resident cannot mark responder notification as read");

    // Resident attempts to delete responder's notification -> must fail
    const illegalDelete = await deleteNotificationAction(respNotif.id);
    assert.equal(illegalDelete.success, false, "Resident cannot delete responder notification");

    // Dispatcher attempts to delete responder's notification -> must fail
    setTestAuthContext(TEST_DISPATCHER_CLERK_ID);
    const illegalDispDelete = await deleteNotificationAction(respNotif.id);
    assert.equal(illegalDispDelete.success, false, "Dispatcher cannot delete responder notification");

    // Responder can delete own notification
    setTestAuthContext(TEST_RESPONDER_CLERK_ID);
    const respCountBefore = await fetchUnreadCountAction();
    const legalDelete = await deleteNotificationAction(respNotif.id);
    assert.equal(legalDelete.success, true, "Responder can delete own notification");
    const respCountAfter = await fetchUnreadCountAction();
    assert.equal(respCountAfter, respCountBefore - 1);

    const respItemsAfter = await fetchNotificationsAction();
    assert.equal(respItemsAfter.some((n) => n.id === respNotif.id), false);
  });

  test("5. Notifications update after relevant incident lifecycle events", async () => {
    // Create dedicated incident for lifecycle test to avoid any interference
    const { data: lifecycleInc } = await supabase
      .from("incidents")
      .insert({
        title: "Lifecycle Test Incident",
        description: "Testing notification lifecycle",
        category_id: testCategory.id,
        severity: "medium",
        barangay: "Doongan",
        reporter_id: residentProfile.id,
        status: "submitted",
        report_number: `REG-LIFE-${Date.now().toString().slice(-6)}`,
      })
      .select()
      .single();
    assert.ok(lifecycleInc);

    try {
      // 1. Trigger incident status change for resident's incident
      setTestAuthContext(TEST_RESIDENT_CLERK_ID);
      const resCountBefore = await fetchUnreadCountAction();

      await notifyIncidentStatusChanged({
        incidentId: lifecycleInc.id,
        newStatus: "in_progress",
        actorId: adminProfile.id,
        note: "Field crew dispatched to site",
      });

      const resCountAfter = await fetchUnreadCountAction();
      assert.ok(resCountAfter >= resCountBefore + 1, "Resident unread count increments after status change");

      const residentNotifs = await fetchNotificationsAction();
      const statusNotif = residentNotifs.find((n) => n.related_incident_id === lifecycleInc.id);
      assert.ok(statusNotif, "Resident receives the status change notification");
      assert.equal(statusNotif.type, "status_changed");

      // 2. Trigger assignment notification for responder
      setTestAuthContext(TEST_RESPONDER_CLERK_ID);
      const respCountBefore = await fetchUnreadCountAction();

      await notifyIncidentAssigned({
        incidentId: lifecycleInc.id,
        assignedUserId: responderProfile.id,
        actorId: dispatcherProfile.id,
        note: "Assigned to drainage team",
      });

      const respCountAfter = await fetchUnreadCountAction();
      assert.ok(respCountAfter >= respCountBefore + 1, "Responder unread count increments after assignment");

      const respNotifs = await fetchNotificationsAction();
      const assignNotif = respNotifs.find((n) => n.related_incident_id === lifecycleInc.id);
      assert.ok(assignNotif, "Responder receives assignment notification");
    } finally {
      await supabase.from("notifications").delete().eq("related_incident_id", lifecycleInc.id);
      await supabase.from("incident_updates").delete().eq("incident_id", lifecycleInc.id);
      await supabase.from("incidents").delete().eq("id", lifecycleInc.id);
    }
  });

  test("6. Protected portal boundaries and role-based permissions", async () => {
    // 1. Resident cannot perform admin actions
    setTestAuthContext(TEST_RESIDENT_CLERK_ID);
    const roleFormData = new FormData();
    roleFormData.append("user_id", residentProfile.id);
    roleFormData.append("role", "admin");
    const residentAdminAttempt = await updateUserRoleAction(roleFormData);
    assert.equal(residentAdminAttempt.success, false);
    assert.match(residentAdminAttempt.error || "", /Forbidden|Administrator/i);

    // 2. Resident cannot perform staff/responder actions
    const staffFormData = new FormData();
    staffFormData.append("incident_id", testIncident.id);
    staffFormData.append("status", "in_progress");
    const residentStaffAttempt = await updateStaffIncidentStatusAction(staffFormData);
    assert.equal(residentStaffAttempt.success, false);
    assert.match(residentStaffAttempt.error || "", /Forbidden/i);

    // 3. Responder cannot perform admin actions
    setTestAuthContext(TEST_RESPONDER_CLERK_ID);
    const responderAdminAttempt = await updateUserRoleAction(roleFormData);
    assert.equal(responderAdminAttempt.success, false);
    assert.match(responderAdminAttempt.error || "", /Forbidden|Administrator/i);

    // 4. Dispatcher cannot perform admin actions
    setTestAuthContext(TEST_DISPATCHER_CLERK_ID);
    const dispatcherAdminAttempt = await updateUserRoleAction(roleFormData);
    assert.equal(dispatcherAdminAttempt.success, false);
    assert.match(dispatcherAdminAttempt.error || "", /Forbidden|Administrator/i);
  });
});

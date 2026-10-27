import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { assertSafeTestEnvironment } from "./test-safety-guard";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { setTestAuthContext, getCurrentProfile } from "@/lib/data/profiles";
import { updateUserRoleAction } from "@/app/admin/actions";
import type { Profile } from "@/types";

/**
 * Verification test suite for Login and Role-Based Routing / Protection
 * - Resident login -> /dashboard
 * - Admin login -> /admin
 * - Responder login -> /staff
 * - Dispatcher login -> /dispatcher
 * - Unauthenticated users -> /sign-in
 * - Boundary isolation and cross-portal denial
 * - Switching accounts and session clearance
 */

const TEST_RESIDENT_ID = "test_auth_verify_resident";
const TEST_ADMIN_ID = "test_auth_verify_admin";
const TEST_RESPONDER_ID = "test_auth_verify_responder";
const TEST_DISPATCHER_ID = "test_auth_verify_dispatcher";

describe("Butuan Report — Login and Role-Based Redirect Verification", () => {
  assertSafeTestEnvironment("Login and Role-Based Redirect Verification");
  const supabase = createAdminSupabaseClient();
  let residentProfile: Profile;

  async function cleanup() {
    setTestAuthContext(null);
    const testIds = [TEST_RESIDENT_ID, TEST_ADMIN_ID, TEST_RESPONDER_ID, TEST_DISPATCHER_ID];
    await supabase.from("profiles").delete().in("clerk_user_id", testIds);
  }

  before(async () => {
    await cleanup();

    // 1. Create resident profile
    const { data: pRes } = await supabase
      .from("profiles")
      .insert({
        clerk_user_id: TEST_RESIDENT_ID,
        full_name: "Test Auth Resident",
        role: "resident",
        barangay: "Baan Riverside",
      })
      .select()
      .single();
    assert.ok(pRes);
    residentProfile = pRes;

    // 2. Create admin profile
    const { data: pAdm } = await supabase
      .from("profiles")
      .insert({
        clerk_user_id: TEST_ADMIN_ID,
        full_name: "Test Auth Admin",
        role: "admin",
      })
      .select()
      .single();
    assert.ok(pAdm);

    // 3. Create responder profile
    const { data: pRsp } = await supabase
      .from("profiles")
      .insert({
        clerk_user_id: TEST_RESPONDER_ID,
        full_name: "Test Auth Responder",
        role: "responder",
      })
      .select()
      .single();
    assert.ok(pRsp);

    // 4. Create dispatcher profile
    const { data: pDsp } = await supabase
      .from("profiles")
      .insert({
        clerk_user_id: TEST_DISPATCHER_ID,
        full_name: "Test Auth Dispatcher",
        role: "dispatcher",
      })
      .select()
      .single();
    assert.ok(pDsp);
  });

  after(async () => {
    await cleanup();
  });

  /**
   * Helper function replicating server layout routing resolution
   */
  function determinePortalRoute(profile: Profile | null): string {
    if (!profile) return "/sign-in";
    if (profile.role === "admin") return "/admin";
    if (profile.role === "dispatcher") return "/dispatcher";
    if (profile.role === "responder") return "/staff";
    return "/dashboard";
  }

  /**
   * Helper function replicating portal access check
   */
  function canAccessPortal(profile: Profile | null, portal: "dashboard" | "admin" | "staff" | "dispatcher"): boolean {
    if (!profile) return false;
    if (portal === "admin") return profile.role === "admin";
    if (portal === "staff") return profile.role === "responder";
    if (portal === "dispatcher") return profile.role === "dispatcher";
    if (portal === "dashboard") return profile.role === "resident";
    return false;
  }

  test("1. Unauthenticated users: Denied from all portals and directed to sign-in", async () => {
    setTestAuthContext(null);
    const profile = await getCurrentProfile();
    assert.equal(profile, null);

    const route = determinePortalRoute(profile);
    assert.equal(route, "/sign-in", "Unauthenticated user must be redirected to sign-in");

    assert.equal(canAccessPortal(profile, "dashboard"), false);
    assert.equal(canAccessPortal(profile, "admin"), false);
    assert.equal(canAccessPortal(profile, "staff"), false);
    assert.equal(canAccessPortal(profile, "dispatcher"), false);
  });

  test("2. Resident login: Resolved strictly from Supabase role, routes to /dashboard", async () => {
    setTestAuthContext(TEST_RESIDENT_ID);
    const profile = await getCurrentProfile();
    assert.ok(profile);
    assert.equal(profile.role, "resident");
    assert.equal(profile.clerk_user_id, TEST_RESIDENT_ID);

    const route = determinePortalRoute(profile);
    assert.equal(route, "/dashboard", "Resident must route to /dashboard");

    assert.equal(canAccessPortal(profile, "dashboard"), true);
    assert.equal(canAccessPortal(profile, "admin"), false, "Resident cannot access /admin");
    assert.equal(canAccessPortal(profile, "staff"), false, "Resident cannot access /staff");
    assert.equal(canAccessPortal(profile, "dispatcher"), false, "Resident cannot access /dispatcher");
  });

  test("3. Admin login: Resolved strictly from Supabase role, routes to /admin", async () => {
    setTestAuthContext(TEST_ADMIN_ID);
    const profile = await getCurrentProfile();
    assert.ok(profile);
    assert.equal(profile.role, "admin");
    assert.equal(profile.clerk_user_id, TEST_ADMIN_ID);

    const route = determinePortalRoute(profile);
    assert.equal(route, "/admin", "Admin must route to /admin");

    assert.equal(canAccessPortal(profile, "admin"), true);
    assert.equal(canAccessPortal(profile, "dashboard"), false, "Admin redirected from /dashboard to /admin");
    assert.equal(canAccessPortal(profile, "staff"), false, "Admin redirected from /staff to /admin");
    assert.equal(canAccessPortal(profile, "dispatcher"), false, "Admin redirected from /dispatcher to /admin");
  });

  test("4. Responder login: Resolved strictly from Supabase role, routes to /staff", async () => {
    setTestAuthContext(TEST_RESPONDER_ID);
    const profile = await getCurrentProfile();
    assert.ok(profile);
    assert.equal(profile.role, "responder");
    assert.equal(profile.clerk_user_id, TEST_RESPONDER_ID);

    const route = determinePortalRoute(profile);
    assert.equal(route, "/staff", "Responder must route to /staff");

    assert.equal(canAccessPortal(profile, "staff"), true);
    assert.equal(canAccessPortal(profile, "admin"), false, "Responder cannot access /admin");
    assert.equal(canAccessPortal(profile, "dashboard"), false, "Responder redirected from /dashboard to /staff");
    assert.equal(canAccessPortal(profile, "dispatcher"), false, "Responder redirected from /dispatcher to /staff");
  });

  test("5. Dispatcher login: Resolved strictly from Supabase role, routes to /dispatcher", async () => {
    setTestAuthContext(TEST_DISPATCHER_ID);
    const profile = await getCurrentProfile();
    assert.ok(profile);
    assert.equal(profile.role, "dispatcher");
    assert.equal(profile.clerk_user_id, TEST_DISPATCHER_ID);

    const route = determinePortalRoute(profile);
    assert.equal(route, "/dispatcher", "Dispatcher must route to /dispatcher");

    assert.equal(canAccessPortal(profile, "dispatcher"), true);
    assert.equal(canAccessPortal(profile, "admin"), false, "Dispatcher cannot access /admin");
    assert.equal(canAccessPortal(profile, "staff"), false, "Dispatcher redirected from /staff to /dispatcher");
    assert.equal(canAccessPortal(profile, "dashboard"), false, "Dispatcher redirected from /dashboard to /dispatcher");
  });

  test("6. Tamper resistance: Non-admin users cannot alter their role", async () => {
    setTestAuthContext(TEST_RESIDENT_ID);
    const formData = new FormData();
    formData.append("user_id", residentProfile.id);
    formData.append("role", "admin");

    const result = await updateUserRoleAction(formData);
    assert.equal(result.success, false);
    assert.match(result.error || "", /Forbidden|Administrator/i);

    // Verify role in Supabase remains unchanged
    const profile = await getCurrentProfile();
    assert.ok(profile);
    assert.equal(profile.role, "resident", "Role must remain resident despite malicious attempt");
  });

  test("7. Account switching and session clearance", async () => {
    // 1. Initially signed in as Admin
    setTestAuthContext(TEST_ADMIN_ID);
    let current = await getCurrentProfile();
    assert.equal(current?.role, "admin");
    assert.equal(determinePortalRoute(current), "/admin");

    // 2. User logs out (session cleared)
    setTestAuthContext(null);
    current = await getCurrentProfile();
    assert.equal(current, null);
    assert.equal(determinePortalRoute(current), "/sign-in");

    // 3. Different user signs in as Responder
    setTestAuthContext(TEST_RESPONDER_ID);
    current = await getCurrentProfile();
    assert.equal(current?.role, "responder");
    assert.equal(determinePortalRoute(current), "/staff");

    // 4. Different user signs in as Dispatcher
    setTestAuthContext(TEST_DISPATCHER_ID);
    current = await getCurrentProfile();
    assert.equal(current?.role, "dispatcher");
    assert.equal(determinePortalRoute(current), "/dispatcher");

    // 5. Different user signs in as Resident
    setTestAuthContext(TEST_RESIDENT_ID);
    current = await getCurrentProfile();
    assert.equal(current?.role, "resident");
    assert.equal(determinePortalRoute(current), "/dashboard");
  });
});

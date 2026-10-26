import { createAdminSupabaseClient } from "../lib/supabase/server";

/**
 * Controlled, secure CLI script to bootstrap an administrator account in Butuan Report.
 * Uses SUPABASE_SECRET_KEY to interact with Supabase profiles table without weakening RLS or exposing credentials.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/bootstrap-admin.ts <clerk_user_id>
 */
async function bootstrapAdmin() {
  const clerkUserId = process.argv[2] || process.env.INITIAL_ADMIN_CLERK_USER_ID;

  if (!clerkUserId || !clerkUserId.trim()) {
    console.error("=================================================");
    console.error("Butuan Report — Initial Administrator Bootstrap");
    console.error("=================================================");
    console.error("Error: Target Clerk User ID is required.");
    console.error("");
    console.error("Usage:");
    console.error("  npm run bootstrap:admin <clerk_user_id>");
    console.error("");
    console.error("Or configure INITIAL_ADMIN_CLERK_USER_ID in .env.local / hosting platform.");
    process.exit(1);
  }

  const targetId = clerkUserId.trim();
  const supabase = createAdminSupabaseClient();

  console.log(`[BOOTSTRAP] Querying profile for Clerk User ID: ${targetId}...`);
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, clerk_user_id")
    .eq("clerk_user_id", targetId)
    .maybeSingle();

  if (error) {
    console.error("[BOOTSTRAP ERROR] Database query failed:", error.message);
    process.exit(1);
  }

  if (profile) {
    if (profile.role === "admin") {
      console.log(`[BOOTSTRAP INFO] User "${profile.full_name}" (${profile.clerk_user_id}) is ALREADY an administrator.`);
      process.exit(0);
    }

    const { data: updated, error: updateErr } = await supabase
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", profile.id)
      .select()
      .single();

    if (updateErr) {
      console.error("[BOOTSTRAP ERROR] Failed to elevate user to admin:", updateErr.message);
      process.exit(1);
    }

    // Insert an audit log record
    await supabase.from("audit_logs").insert({
      actor_id: profile.id,
      action: "first_admin_bootstrapped",
      entity_type: "profile",
      entity_id: profile.id,
      metadata: {
        clerk_user_id: targetId,
        previous_role: profile.role,
        new_role: "admin",
        method: "cli_bootstrap_script",
      },
    });

    console.log(`[BOOTSTRAP SUCCESS] Elevated "${updated.full_name}" (${updated.clerk_user_id}) from "${profile.role}" to "admin".`);
  } else {
    console.log(`[BOOTSTRAP INFO] No profile found for ${targetId}. Creating pre-provisioned administrator profile...`);
    const { data: created, error: createErr } = await supabase
      .from("profiles")
      .insert({
        clerk_user_id: targetId,
        full_name: "Initial Administrator",
        role: "admin",
      })
      .select()
      .single();

    if (createErr) {
      console.error("[BOOTSTRAP ERROR] Failed to create admin profile:", createErr.message);
      process.exit(1);
    }

    // Insert an audit log record
    await supabase.from("audit_logs").insert({
      actor_id: created.id,
      action: "first_admin_bootstrapped",
      entity_type: "profile",
      entity_id: created.id,
      metadata: {
        clerk_user_id: targetId,
        new_role: "admin",
        method: "cli_bootstrap_script_preprovision",
      },
    });

    console.log(`[BOOTSTRAP SUCCESS] Successfully created initial administrator profile for ${created.clerk_user_id}.`);
  }
}

bootstrapAdmin().catch((err) => {
  console.error("[BOOTSTRAP FATAL ERROR]", err);
  process.exit(1);
});

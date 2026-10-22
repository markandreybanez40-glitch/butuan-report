import { auth, currentUser } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import type { Profile, ProfileInsert, ProfileUpdate } from "@/types";

/**
 * Server-side data access for user profile.
 * Authenticated via Clerk's verified server session, queried against Supabase profiles.
 */

let testAuthUserId: string | null = null;

/**
 * Test utility to set an active Clerk user ID context during automated testing.
 * Strictly disabled in production.
 */
export function setTestAuthContext(userId: string | null) {
  if (process.env.NODE_ENV !== "production") {
    testAuthUserId = userId;
  }
}

export async function getCurrentProfile(): Promise<Profile | null> {
  let userId: string | null = null;
  if (process.env.NODE_ENV !== "production" && testAuthUserId) {
    userId = testAuthUserId;
  } else {
    try {
      const authObj = await auth();
      userId = authObj?.userId || null;
    } catch {
      userId = null;
    }
  }
  if (!userId) return null;

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching user profile:", error.message);
    return null;
  }

  return data;
}

/**
 * Ensures a profile row exists for the currently authenticated Clerk user.
 * Initializes default role to 'resident' if profile does not exist.
 * Concurrency-safe: handles potential 23505 unique conflict by returning existing profile.
 */
export async function getOrCreateCurrentProfile(): Promise<Profile | null> {
  const existing = await getCurrentProfile();
  if (existing) return existing;

  let user = null;
  try {
    user = await currentUser();
  } catch {
    user = null;
  }
  if (!user) return null;

  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.username ||
    user.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
    "Citizen";

  const newProfile: ProfileInsert = {
    clerk_user_id: user.id,
    full_name: fullName,
    role: "resident",
  };

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .insert(newProfile)
    .select()
    .single();

  if (error) {
    // If concurrent insert occurred, fetch the existing profile
    if (error.code === "23505") {
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("clerk_user_id", user.id)
        .maybeSingle();
      if (existingProfile) return existingProfile;
    }
    console.error("Error creating initial profile:", error.message);
    return null;
  }

  return data;
}

export async function updateCurrentProfile(updates: ProfileUpdate): Promise<Profile | null> {
  let userId: string | null = null;
  if (process.env.NODE_ENV !== "production" && testAuthUserId) {
    userId = testAuthUserId;
  } else {
    try {
      const authObj = await auth();
      userId = authObj?.userId || null;
    } catch {
      userId = null;
    }
  }
  if (!userId) return null;

  const supabase = createAdminSupabaseClient();
  // Safe update: cannot alter role, id, or clerk_user_id via ordinary profile update
  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: updates.full_name,
      phone: updates.phone,
      barangay: updates.barangay,
    })
    .eq("clerk_user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating profile:", error.message);
    throw new Error(error.message);
  }

  return data;
}

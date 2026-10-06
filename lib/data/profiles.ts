import { auth, currentUser } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Profile, ProfileInsert, ProfileUpdate } from "@/types";

/**
 * Server-side data access for user profile.
 * Follows: UI -> server/data-access layer -> Supabase (with Clerk RLS token)
 */

export async function getCurrentProfile(): Promise<Profile | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = createServerSupabaseClient();
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
 */
export async function getOrCreateCurrentProfile(): Promise<Profile | null> {
  const existing = await getCurrentProfile();
  if (existing) return existing;

  const user = await currentUser();
  if (!user) return null;

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.username ||
    user.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
    "Citizen";

  const newProfile: ProfileInsert = {
    clerk_user_id: user.id,
    full_name: fullName,
    role: "resident",
  };

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .insert(newProfile)
    .select()
    .single();

  if (error) {
    console.error("Error creating initial profile:", error.message);
    return null;
  }

  return data;
}

export async function updateCurrentProfile(updates: ProfileUpdate): Promise<Profile | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = createServerSupabaseClient();
  // Safe update: cannot alter role via ordinary user update due to RLS check
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

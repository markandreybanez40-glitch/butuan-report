import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { IncidentCategory } from "@/types";

/**
 * Server data-access layer for incident categories.
 */
export async function getActiveCategories(): Promise<IncidentCategory[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("incident_categories")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      console.warn("Notice: Active categories unavailable from current session, fallback applied:", error.message);
      return [];
    }

    return data ?? [];
  } catch (err) {
    console.warn("Exception while loading categories:", err);
    return [];
  }
}

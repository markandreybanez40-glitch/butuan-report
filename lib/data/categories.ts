import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { IncidentCategory } from "@/types";

/**
 * Server data-access layer for incident categories.
 */
export async function getActiveCategories(): Promise<IncidentCategory[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("incident_categories")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching active categories:", error.message);
    return [];
  }

  return data ?? [];
}

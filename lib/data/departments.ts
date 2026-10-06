import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Department } from "@/types";

/**
 * Server data-access layer for departments.
 */
export async function getActiveDepartments(): Promise<Department[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("departments")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      console.warn("Notice: Active departments unavailable from current session, fallback applied:", error.message);
      return [];
    }

    return data ?? [];
  } catch (err) {
    console.warn("Exception while loading departments:", err);
    return [];
  }
}

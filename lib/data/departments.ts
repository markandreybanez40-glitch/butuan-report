import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Department } from "@/types";

/**
 * Server data-access layer for departments.
 */
export async function getActiveDepartments(): Promise<Department[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching active departments:", error.message);
    return [];
  }

  return data ?? [];
}

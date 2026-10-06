import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { AuditLog, AuditLogInsert } from "@/types";

/**
 * Server data-access helper for audit logging.
 * Normal residents are prohibited by database RLS from inserting arbitrary audit records.
 * Audit entries are strictly append-only and written through authorized server operations.
 */
export async function createAuditLogEntry(entry: AuditLogInsert): Promise<AuditLog | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .insert(entry)
    .select()
    .single();

  if (error) {
    console.error("Failed to create audit log entry:", error.message);
    return null;
  }

  return data;
}

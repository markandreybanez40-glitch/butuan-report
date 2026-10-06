import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  Profile,
  Department,
  IncidentCategory,
  AuditLog,
} from "@/types";

export interface AdminDashboardStats {
  totalIncidents: number;
  openIncidents: number;
  resolvedIncidents: number;
  totalUsers: number;
  totalStaff: number;
  activeDepartments: number;
  activeCategories: number;
  recentActivity: (AuditLog & {
    actor: { id: string; full_name: string; role: string } | null;
  })[];
}

export interface AdminAuditLogItem extends AuditLog {
  actor: { id: string; full_name: string; role: string } | null;
}

/**
 * Fetches high-level summary KPIs and recent audit activity for the admin dashboard.
 * Enforced by Supabase RLS (admin-only).
 */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const supabase = createServerSupabaseClient();

  // 1. Incidents Stats
  const { data: incidents, error: incError } = await supabase
    .from("incidents")
    .select("status");

  if (incError) {
    console.error("Error fetching admin incident stats:", incError.message);
  }

  const allIncidents = incidents || [];
  const totalIncidents = allIncidents.length;
  const openIncidents = allIncidents.filter((i) =>
    ["submitted", "under_review", "assigned", "in_progress"].includes(i.status)
  ).length;
  const resolvedIncidents = allIncidents.filter((i) =>
    ["resolved", "closed"].includes(i.status)
  ).length;

  // 2. Users Stats
  const { data: profiles, error: profError } = await supabase
    .from("profiles")
    .select("role");

  if (profError) {
    console.error("Error fetching admin profile stats:", profError.message);
  }

  const allProfiles = profiles || [];
  const totalUsers = allProfiles.length;
  const totalStaff = allProfiles.filter((p) =>
    ["responder", "dispatcher", "admin"].includes(p.role)
  ).length;

  // 3. Active Departments & Categories
  const { count: deptCount } = await supabase
    .from("departments")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  const { count: catCount } = await supabase
    .from("incident_categories")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  // 4. Recent Audit Activity
  const { data: logs, error: logError } = await supabase
    .from("audit_logs")
    .select(`
      *,
      actor:profiles!actor_id(id, full_name, role)
    `)
    .order("created_at", { ascending: false })
    .limit(8);

  if (logError) {
    console.error("Error fetching admin audit activity:", logError.message);
  }

  return {
    totalIncidents,
    openIncidents,
    resolvedIncidents,
    totalUsers,
    totalStaff,
    activeDepartments: deptCount || 0,
    activeCategories: catCount || 0,
    recentActivity: (logs as unknown as AdminAuditLogItem[]) || [],
  };
}

/**
 * Fetches user profiles with optional search and role filtering.
 */
export async function getAdminUsers(options?: {
  search?: string;
  role?: string;
  limit?: number;
}): Promise<Profile[]> {
  const supabase = createServerSupabaseClient();

  let query = supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (options?.role && options.role !== "all") {
    query = query.eq("role", options.role);
  }

  if (options?.search && options.search.trim()) {
    const term = `%${options.search.trim()}%`;
    query = query.or(`full_name.ilike.${term},phone.ilike.${term},barangay.ilike.${term}`);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching admin users:", error.message);
    return [];
  }

  return data || [];
}

/**
 * Fetches all departments (active and inactive) for admin management.
 */
export async function getAdminDepartments(): Promise<Department[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching admin departments:", error.message);
    return [];
  }

  return data || [];
}

/**
 * Fetches all incident categories (active and inactive) for admin management.
 */
export async function getAdminCategories(): Promise<IncidentCategory[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("incident_categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching admin categories:", error.message);
    return [];
  }

  return data || [];
}

/**
 * Fetches audit log records with optional filtering (action, entityType, search).
 * Strictly read-only; no modification or deletion possible.
 */
export async function getAdminAuditLogs(options?: {
  action?: string;
  entityType?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
}): Promise<AdminAuditLogItem[]> {
  const supabase = createServerSupabaseClient();

  let query = supabase
    .from("audit_logs")
    .select(`
      *,
      actor:profiles!actor_id(id, full_name, role)
    `)
    .order("created_at", { ascending: false });

  if (options?.action && options.action !== "all") {
    query = query.eq("action", options.action);
  }

  if (options?.entityType && options.entityType !== "all") {
    query = query.eq("entity_type", options.entityType);
  }

  if (options?.fromDate && options.fromDate.trim()) {
    query = query.gte("created_at", `${options.fromDate.trim()}T00:00:00Z`);
  }

  if (options?.toDate && options.toDate.trim()) {
    query = query.lte("created_at", `${options.toDate.trim()}T23:59:59Z`);
  }

  if (options?.search && options.search.trim()) {
    const term = `%${options.search.trim()}%`;
    query = query.or(`action.ilike.${term},entity_type.ilike.${term}`);
  }

  query = query.limit(options?.limit || 100);

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching admin audit logs:", error.message);
    return [];
  }

  return (data as unknown as AdminAuditLogItem[]) || [];
}

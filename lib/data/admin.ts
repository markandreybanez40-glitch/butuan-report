import { createAdminSupabaseClient } from "@/lib/supabase/server";
import type {
  Profile,
  Department,
  IncidentCategory,
  AuditLog,
  Incident,
} from "@/types";

export interface AdminResidentIncidentItem {
  id: string;
  report_number: string;
  title: string;
  description: string;
  status: string;
  severity: string;
  barangay: string;
  landmark: string | null;
  created_at: string;
  category: { id: string; name: string } | null;
  reporter: { id: string; full_name: string; phone: string | null; barangay: string | null } | null;
}

export interface AdminDashboardStats {
  totalReports: number;
  pendingReports: number;
  underReview: number;
  inProgress: number;
  resolved: number;
  rejected: number;
  totalUsers: number;
  totalResidents: number;
  totalStaff: number;
  activeDepartments: number;
  activeCategories: number;
  recentResidentIncidents: AdminResidentIncidentItem[];
  recentActivity: (AuditLog & {
    actor: { id: string; full_name: string; role: string } | null;
  })[];
}

export interface AdminAuditLogItem extends AuditLog {
  actor: { id: string; full_name: string; role: string } | null;
}

/**
 * Fetches high-level summary KPIs, recent resident incident reports, and audit activity for the admin dashboard.
 * Enforced by Supabase RLS (admin-only).
 */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const supabase = createAdminSupabaseClient();

  // 1. Parallel lightweight metadata count queries
  const [
    { count: totalReports },
    { count: pendingReports },
    { count: underReview },
    { count: inProgress },
    { count: resolved },
    { count: rejected },
    { count: totalUsers },
    { count: totalStaff },
    { count: deptCount },
    { count: catCount },
  ] = await Promise.all([
    supabase.from("incidents").select("*", { count: "exact", head: true }),
    supabase.from("incidents").select("*", { count: "exact", head: true }).eq("status", "submitted"),
    supabase.from("incidents").select("*", { count: "exact", head: true }).eq("status", "under_review"),
    supabase.from("incidents").select("*", { count: "exact", head: true }).in("status", ["assigned", "in_progress"]),
    supabase.from("incidents").select("*", { count: "exact", head: true }).in("status", ["resolved", "closed"]),
    supabase.from("incidents").select("*", { count: "exact", head: true }).in("status", ["rejected", "cancelled", "duplicate"]),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .in("role", ["responder", "dispatcher", "admin"]),
    supabase.from("departments").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("incident_categories").select("*", { count: "exact", head: true }).eq("is_active", true),
  ]);

  const totalResidents = Math.max(0, (totalUsers || 0) - (totalStaff || 0));

  // 4. Recent & Priority Resident Incidents (Live Citizen Queue)
  const { data: recentIncidentsData, error: recentIncError } = await supabase
    .from("incidents")
    .select(`
      id,
      report_number,
      title,
      description,
      status,
      severity,
      barangay,
      landmark,
      created_at,
      category:incident_categories(id, name),
      reporter:profiles!reporter_id(id, full_name, phone, barangay)
    `)
    .order("created_at", { ascending: false })
    .limit(10);

  if (recentIncError) {
    console.error("Error fetching admin recent resident incidents:", recentIncError.message);
  }

  // 5. Recent Audit Activity
  const { data: logs, error: logError } = await supabase
    .from("audit_logs")
    .select(`
      *,
      actor:profiles!actor_id(id, full_name, role)
    `)
    .order("created_at", { ascending: false })
    .limit(6);

  if (logError) {
    console.error("Error fetching admin audit activity:", logError.message);
  }

  return {
    totalReports: totalReports || 0,
    pendingReports: pendingReports || 0,
    underReview: underReview || 0,
    inProgress: inProgress || 0,
    resolved: resolved || 0,
    rejected: rejected || 0,
    totalUsers: totalUsers || 0,
    totalResidents,
    totalStaff: totalStaff || 0,
    activeDepartments: deptCount || 0,
    activeCategories: catCount || 0,
    recentResidentIncidents: (recentIncidentsData as unknown as AdminResidentIncidentItem[]) || [],
    recentActivity: (logs as unknown as AdminAuditLogItem[]) || [],
  };
}

export interface AdminResidentItem extends Profile {
  email?: string | null;
  report_count: number;
  resolved_count: number;
  active_count: number;
}

/**
 * Fetches user profiles with optional search and role filtering.
 */
export async function getAdminUsers(options?: {
  search?: string;
  role?: string;
  limit?: number;
}): Promise<Profile[]> {
  const supabase = createAdminSupabaseClient();

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
 * Fetches paginated residents/profiles for the Residents Management workspace.
 * Allows filtering by search term (name, phone, barangay, clerk_id), barangay, and role.
 * Includes submitted report counts per resident.
 */
export async function getAdminResidentsPaginated(options?: {
  search?: string;
  barangay?: string;
  role?: string;
  page?: number;
  pageSize?: number;
}): Promise<{
  residents: AdminResidentItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const supabase = createAdminSupabaseClient();
  const page = Math.max(1, options?.page || 1);
  const pageSize = Math.min(100, Math.max(1, options?.pageSize || 12));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("profiles")
    .select("*", { count: "exact" });

  if (options?.role && options.role !== "all") {
    query = query.eq("role", options.role);
  }

  if (options?.barangay && options.barangay !== "all") {
    query = query.eq("barangay", options.barangay);
  }

  if (options?.search && options.search.trim()) {
    const term = `%${options.search.trim()}%`;
    query = query.or(`full_name.ilike.${term},phone.ilike.${term},barangay.ilike.${term},clerk_user_id.ilike.${term}`);
  }

  query = query.order("created_at", { ascending: false }).range(from, to);

  const { data: profiles, count, error } = await query;

  if (error) {
    console.error("Error fetching admin residents paginated:", error.message);
    return {
      residents: [],
      totalCount: 0,
      page,
      pageSize,
      totalPages: 1,
    };
  }

  const totalCount = count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const profileList = profiles || [];

  if (profileList.length === 0) {
    return {
      residents: [],
      totalCount,
      page,
      pageSize,
      totalPages,
    };
  }

  // Fetch report counts for these profiles
  const profileIds = profileList.map((p) => p.id);
  const { data: incidentRows, error: incidentErr } = await supabase
    .from("incidents")
    .select("id, reporter_id, status")
    .in("reporter_id", profileIds);

  if (incidentErr) {
    console.error("Error fetching resident incident counts:", incidentErr.message);
  }

  const countsMap = new Map<
    string,
    { total: number; resolved: number; active: number }
  >();

  for (const p of profileList) {
    countsMap.set(p.id, { total: 0, resolved: 0, active: 0 });
  }

  if (incidentRows) {
    for (const inc of incidentRows) {
      const stats = countsMap.get(inc.reporter_id);
      if (stats) {
        stats.total += 1;
        if (inc.status === "resolved" || inc.status === "closed") {
          stats.resolved += 1;
        } else if (["submitted", "under_review", "assigned", "in_progress"].includes(inc.status)) {
          stats.active += 1;
        }
      }
    }
  }

  const residents: AdminResidentItem[] = profileList.map((p) => {
    const stats = countsMap.get(p.id) || { total: 0, resolved: 0, active: 0 };
    return {
      ...p,
      report_count: stats.total,
      resolved_count: stats.resolved,
      active_count: stats.active,
    };
  });

  return {
    residents,
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Fetches all departments (active and inactive) for admin management.
 */
export async function getAdminDepartments(): Promise<Department[]> {
  const supabase = createAdminSupabaseClient();
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
  const supabase = createAdminSupabaseClient();
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
  const supabase = createAdminSupabaseClient();

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
    query = query.or(`action.ilike.${term},entity_type.ilike.${term},entity_id.ilike.${term}`);
  }

  query = query.limit(options?.limit || 100);

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching admin audit logs:", error.message);
    return [];
  }

  return (data as unknown as AdminAuditLogItem[]) || [];
}

/**
 * Fetches paginated audit logs with search, action, entity_type, actor, and date filters.
 */
export async function getAdminAuditLogsPaginated(options?: {
  action?: string;
  entityType?: string;
  actorId?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}): Promise<{
  logs: AdminAuditLogItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const supabase = createAdminSupabaseClient();
  const page = Math.max(1, options?.page || 1);
  const pageSize = Math.min(100, Math.max(1, options?.pageSize || 15));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("audit_logs")
    .select(
      `
      *,
      actor:profiles!actor_id(id, full_name, role)
    `,
      { count: "exact" }
    );

  if (options?.action && options.action !== "all") {
    query = query.eq("action", options.action);
  }

  if (options?.entityType && options.entityType !== "all") {
    query = query.eq("entity_type", options.entityType);
  }

  if (options?.actorId && options.actorId !== "all") {
    query = query.eq("actor_id", options.actorId);
  }

  if (options?.fromDate && options.fromDate.trim()) {
    query = query.gte("created_at", `${options.fromDate.trim()}T00:00:00Z`);
  }

  if (options?.toDate && options.toDate.trim()) {
    query = query.lte("created_at", `${options.toDate.trim()}T23:59:59Z`);
  }

  if (options?.search && options.search.trim()) {
    const term = `%${options.search.trim()}%`;
    query = query.or(`action.ilike.${term},entity_type.ilike.${term},entity_id.ilike.${term}`);
  }

  query = query.order("created_at", { ascending: false }).range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error("Error fetching admin audit logs paginated:", error.message);
    return {
      logs: [],
      totalCount: 0,
      page,
      pageSize,
      totalPages: 1,
    };
  }

  const totalCount = count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const logs = (data as unknown as AdminAuditLogItem[]) || [];

  return {
    logs,
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}

export interface AdminAssignmentQueueItem extends Incident {
  category: { id: string; name: string } | null;
  reporter: { id: string; full_name: string; phone: string | null; barangay: string | null } | null;
  assignments: {
    id: string;
    department_id: string | null;
    assigned_user_id: string | null;
    field_responder?: string | null;
    instruction?: string | null;
    dispatch_vehicle?: string | null;
    assigned_at: string;
    unassigned_at: string | null;
    department: { id: string; name: string } | null;
    assigned_user: { id: string; full_name: string; role: string; phone: string | null } | null;
  }[];
}

/**
 * Fetches the paginated incident assignments queue for the admin assignments workspace.
 * Allows filtering by department, responder, status, search, and assigned/unassigned state.
 */
export async function getAdminAssignmentsPaginatedQueue(options?: {
  search?: string;
  departmentId?: string;
  responderId?: string;
  status?: string;
  assignmentFilter?: string;
  page?: number;
  pageSize?: number;
}): Promise<{
  incidents: AdminAssignmentQueueItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const supabase = createAdminSupabaseClient();
  const page = Math.max(1, options?.page || 1);
  const pageSize = Math.min(100, Math.max(1, options?.pageSize || 15));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Filter 1: Department filter
  let targetIncidentIds: string[] | null = null;
  if (options?.departmentId && options.departmentId !== "all") {
    const { data: deptAssignments } = await supabase
      .from("incident_assignments")
      .select("incident_id")
      .eq("department_id", options.departmentId)
      .is("unassigned_at", null);

    const ids = deptAssignments?.map((a) => a.incident_id) || [];
    if (ids.length === 0) {
      return { incidents: [], totalCount: 0, page, pageSize, totalPages: 1 };
    }
    targetIncidentIds = ids;
  }

  // Filter 2: Responder filter (Supports Responder 1–5 and user IDs)
  if (options?.responderId && options.responderId !== "all") {
    let ids: string[] = [];
    if (options.responderId.startsWith("Responder ")) {
      const { data: respAssignments } = await supabase
        .from("incident_assignments")
        .select("incident_id")
        .eq("field_responder", options.responderId)
        .is("unassigned_at", null);
      if (respAssignments && respAssignments.length > 0) {
        ids = respAssignments.map((a) => a.incident_id);
      } else {
        const { data: updateMatches } = await supabase
          .from("incident_updates")
          .select("incident_id")
          .eq("visibility", "internal")
          .ilike("message", `%${options.responderId}%`);
        ids = Array.from(new Set(updateMatches?.map((u) => u.incident_id) || []));
      }
    } else {
      const { data: userAssignments } = await supabase
        .from("incident_assignments")
        .select("incident_id")
        .eq("assigned_user_id", options.responderId)
        .is("unassigned_at", null);
      ids = userAssignments?.map((a) => a.incident_id) || [];
    }

    if (ids.length === 0) {
      return { incidents: [], totalCount: 0, page, pageSize, totalPages: 1 };
    }
    targetIncidentIds = targetIncidentIds !== null
      ? targetIncidentIds.filter((id) => ids.includes(id))
      : ids;

    if (targetIncidentIds.length === 0) {
      return { incidents: [], totalCount: 0, page, pageSize, totalPages: 1 };
    }
  }

  // Filter 3: Assignment state (assigned vs unassigned)
  let excludeIncidentIds: string[] | null = null;
  if (options?.assignmentFilter === "assigned") {
    const { data: activeAssignments } = await supabase
      .from("incident_assignments")
      .select("incident_id")
      .is("unassigned_at", null);

    const ids = Array.from(new Set(activeAssignments?.map((a) => a.incident_id) || []));
    if (ids.length === 0) {
      return { incidents: [], totalCount: 0, page, pageSize, totalPages: 1 };
    }
    targetIncidentIds = targetIncidentIds !== null
      ? targetIncidentIds.filter((id) => ids.includes(id))
      : ids;

    if (targetIncidentIds.length === 0) {
      return { incidents: [], totalCount: 0, page, pageSize, totalPages: 1 };
    }
  } else if (options?.assignmentFilter === "unassigned") {
    const { data: activeAssignments } = await supabase
      .from("incident_assignments")
      .select("incident_id")
      .is("unassigned_at", null);

    const ids = Array.from(new Set(activeAssignments?.map((a) => a.incident_id) || []));
    if (ids.length > 0) {
      excludeIncidentIds = ids;
    }
  }

  let query = supabase
    .from("incidents")
    .select(
      `
      *,
      category:incident_categories(id, name),
      reporter:profiles!reporter_id(id, full_name, phone, barangay),
      assignments:incident_assignments(
        id,
        department_id,
        assigned_user_id,
        assigned_at,
        unassigned_at,
        department:departments(id, name),
        assigned_user:profiles!incident_assignments_assigned_user_id_fkey(id, full_name, role, phone)
      )
    `,
      { count: "exact" }
    );

  if (targetIncidentIds !== null && targetIncidentIds.length > 0) {
    query = query.in("id", targetIncidentIds);
  }

  if (excludeIncidentIds !== null && excludeIncidentIds.length > 0) {
    query = query.not("id", "in", `(${excludeIncidentIds.join(",")})`);
  }

  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }

  if (options?.search && options.search.trim()) {
    const term = `%${options.search.trim()}%`;
    query = query.or(`title.ilike.${term},report_number.ilike.${term},barangay.ilike.${term}`);
  }

  query = query.order("created_at", { ascending: false }).range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error("Error fetching admin assignments paginated queue:", error.message);
    return {
      incidents: [],
      totalCount: 0,
      page,
      pageSize,
      totalPages: 1,
    };
  }

  const totalCount = count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const rawIncidents = (data as unknown as AdminAssignmentQueueItem[]) || [];

  const incidentIds = rawIncidents.map((i) => i.id);
  let internalUpdates: { incident_id: string; message: string; visibility: string }[] = [];
  if (incidentIds.length > 0) {
    const { data: updatesData } = await supabase
      .from("incident_updates")
      .select("incident_id, message, visibility")
      .in("incident_id", incidentIds)
      .eq("visibility", "internal")
      .order("created_at", { ascending: false });
    if (updatesData) {
      internalUpdates = updatesData;
    }
  }

  const { DISPATCH_INSTRUCTIONS } = await import("@/types");

  const incidents = rawIncidents.map((incident) => {
    if (incident.assignments && incident.assignments.length > 0) {
      const incUpdates = internalUpdates.filter((u) => u.incident_id === incident.id);
      incident.assignments = incident.assignments.map((a) => {
        let field_responder = a.field_responder || null;
        let instruction = a.instruction || null;
        let dispatch_vehicle = (a as unknown as { dispatch_vehicle?: string | null }).dispatch_vehicle || null;

        if (incUpdates.length > 0) {
          let targetUpdates = incUpdates;
          if (a.unassigned_at !== null && a.assigned_at) {
            const aTime = new Date(a.assigned_at).getTime();
            targetUpdates = [...incUpdates].sort((x, y) => {
              const diffX = Math.abs(new Date((x as unknown as { created_at?: string }).created_at || 0).getTime() - aTime);
              const diffY = Math.abs(new Date((y as unknown as { created_at?: string }).created_at || 0).getTime() - aTime);
              return diffX - diffY;
            });
          }

          if (!field_responder) {
            const match = targetUpdates
              .map((u) => u.message.match(/Field Responder:\s*(Responder [1-5])/i))
              .find(Boolean);
            if (match && match[1]) {
              field_responder = match[1];
            }
          }

          if (!dispatch_vehicle) {
            const matchVeh = targetUpdates
              .map((u) => u.message.match(/Dispatch Vehicle:\s*(Vehicle [1-5])/i))
              .find(Boolean);
            if (matchVeh && matchVeh[1]) {
              dispatch_vehicle = matchVeh[1];
            }
          }

          if (!instruction) {
            for (const u of targetUpdates) {
              const matchInst = DISPATCH_INSTRUCTIONS.find(
                (opt) =>
                  u.message.includes(`Dispatch Instruction: ${opt}`) ||
                  u.message.includes(opt)
              );
              if (matchInst) {
                instruction = matchInst;
                break;
              }
            }
          }
        }

        return {
          ...a,
          field_responder,
          instruction,
          dispatch_vehicle,
        };
      });
    }
    return incident;
  });

  return {
    incidents,
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}

export interface AdminAnalyticsFilterOptions {
  dateRange?: string; // "7d" | "30d" | "90d" | "1y" | "all"
  fromDate?: string;
  toDate?: string;
  categoryId?: string;
  status?: string;
  severity?: string;
  barangay?: string;
}

export interface AdminAnalyticsData {
  totalReports: number;
  resolutionRate: number;
  resolvedCount: number;
  inProgressCount: number;
  pendingCount: number;
  rejectedCount: number;
  averageResolutionHours: number | null;
  averageResolutionFormatted: string;
  statusBreakdown: {
    submitted: number;
    under_review: number;
    assigned: number;
    in_progress: number;
    resolved: number;
    closed: number;
    rejected: number;
    duplicate: number;
    cancelled: number;
  };
  severityBreakdown: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  categoryBreakdown: {
    id: string;
    name: string;
    count: number;
    percentage: number;
  }[];
  barangayBreakdown: {
    barangay: string;
    count: number;
    resolved: number;
  }[];
  reportsOverTime: {
    date: string;
    label: string;
    submitted: number;
    resolved: number;
  }[];
  error?: string | null;
}

/**
 * Fetches comprehensive real-time analytics data across all incidents matching active filters.
 * Computes status, category, severity, barangay distributions, timeline volume, and resolution durations.
 */
export async function getAdminAnalyticsData(
  options?: AdminAnalyticsFilterOptions
): Promise<AdminAnalyticsData> {
  const supabase = createAdminSupabaseClient();

  let query = supabase.from("incidents").select(`
    id,
    report_number,
    title,
    status,
    severity,
    barangay,
    created_at,
    resolved_at,
    closed_at,
    category_id,
    category:incident_categories(id, name)
  `);

  const now = new Date();
  const dateRange = options?.dateRange || "30d";

  // Date Range Filtering
  if (options?.fromDate && options.fromDate.trim()) {
    query = query.gte("created_at", `${options.fromDate.trim()}T00:00:00Z`);
  } else if (dateRange !== "all") {
    let daysAgo = 30;
    if (dateRange === "7d") daysAgo = 7;
    else if (dateRange === "30d") daysAgo = 30;
    else if (dateRange === "90d") daysAgo = 90;
    else if (dateRange === "1y") daysAgo = 365;

    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (daysAgo - 1), 0, 0, 0, 0);
    query = query.gte("created_at", startDate.toISOString());
  }

  if (options?.toDate && options.toDate.trim()) {
    query = query.lte("created_at", `${options.toDate.trim()}T23:59:59Z`);
  }

  // 1. Fetch categories for safe mapping and "Other" category resolution
  const { data: allCategoriesList } = await supabase
    .from("incident_categories")
    .select("id, name");

  const otherCategory = (allCategoriesList || []).find(
    (c) =>
      c.name.toLowerCase().includes("other") ||
      c.name.toLowerCase() === "other civic concern"
  );
  const otherCatId = otherCategory?.id;

  // 2. Normalize category filter input
  const rawCat = options?.categoryId?.trim();
  const isAllCategories =
    !rawCat ||
    rawCat.toLowerCase() === "all" ||
    rawCat.toLowerCase() === "all categories" ||
    rawCat.toLowerCase() === "all-categories" ||
    rawCat.toLowerCase() === "all_categories";

  const isOther =
    !isAllCategories &&
    (rawCat.toLowerCase() === "other" ||
      rawCat.toLowerCase() === "other civic concern" ||
      rawCat.toLowerCase() === "uncategorized");

  const isOtherById =
    !isAllCategories &&
    Boolean(otherCatId && rawCat.toLowerCase() === otherCatId.toLowerCase());

  if (!isAllCategories) {
    if (isOther || isOtherById) {
      if (otherCatId) {
        query = query.or(`category_id.eq.${otherCatId},category_id.is.null`);
      } else {
        query = query.is("category_id", null);
      }
    } else {
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          rawCat
        );
      if (isUuid) {
        query = query.eq("category_id", rawCat);
      } else {
        const matched = (allCategoriesList || []).find(
          (c) => c.name.toLowerCase() === rawCat.toLowerCase()
        );
        if (matched) {
          if (
            otherCatId &&
            matched.id.toLowerCase() === otherCatId.toLowerCase()
          ) {
            query = query.or(`category_id.eq.${otherCatId},category_id.is.null`);
          } else {
            query = query.eq("category_id", matched.id);
          }
        } else {
          // Unknown category name; query a dummy non-matching UUID instead of throwing a UUID parse error
          query = query.eq(
            "category_id",
            "00000000-0000-0000-0000-000000000000"
          );
        }
      }
    }
  }

  // 3. Normalize Status Filter
  const rawStatus = options?.status?.trim();
  const isAllStatuses =
    !rawStatus ||
    rawStatus.toLowerCase() === "all" ||
    rawStatus.toLowerCase().startsWith("all status");

  if (!isAllStatuses) {
    if (rawStatus.toLowerCase() === "resolved") {
      // Automatically closed incidents have status='closed' and resolved_at IS NOT NULL.
      // When filtering for 'resolved', match incidents marked resolved or with a valid resolution timestamp.
      query = query.or("status.eq.resolved,and(status.eq.closed,resolved_at.not.is.null)");
    } else {
      query = query.eq("status", rawStatus);
    }
  }

  // 4. Normalize Severity Filter
  const rawSeverity = options?.severity?.trim();
  const isAllSeverities =
    !rawSeverity ||
    rawSeverity.toLowerCase() === "all" ||
    rawSeverity.toLowerCase().startsWith("all severit");

  if (!isAllSeverities) {
    query = query.eq("severity", rawSeverity);
  }

  // 5. Normalize Barangay Filter
  const rawBarangay = options?.barangay?.trim();
  const isAllBarangays =
    !rawBarangay ||
    rawBarangay.toLowerCase() === "all" ||
    rawBarangay.toLowerCase().startsWith("all barangay");

  if (!isAllBarangays) {
    query = query.eq("barangay", rawBarangay);
  }

  query = query.order("created_at", { ascending: true });

  const { data: rawIncidents, error } = await query;

  if (error) {
    console.error("Error fetching analytics data:", error.message);
    return {
      totalReports: 0,
      resolutionRate: 0,
      resolvedCount: 0,
      inProgressCount: 0,
      pendingCount: 0,
      rejectedCount: 0,
      averageResolutionHours: null,
      averageResolutionFormatted: "N/A",
      statusBreakdown: {
        submitted: 0,
        under_review: 0,
        assigned: 0,
        in_progress: 0,
        resolved: 0,
        closed: 0,
        rejected: 0,
        duplicate: 0,
        cancelled: 0,
      },
      severityBreakdown: { low: 0, medium: 0, high: 0, critical: 0 },
      categoryBreakdown: [],
      barangayBreakdown: [],
      reportsOverTime: [],
      error: error.message,
    };
  }

  interface IncidentRecord {
    id: string;
    report_number: string;
    title: string;
    status: string;
    severity: string;
    barangay: string;
    created_at: string;
    resolved_at: string | null;
    closed_at: string | null;
    category_id: string | null;
    category: { id: string; name: string } | null;
  }

  const incidents: IncidentRecord[] = (rawIncidents as unknown as IncidentRecord[]) || [];
  const totalReports = incidents.length;

  // 1. Status Breakdown
  const statusBreakdown = {
    submitted: 0,
    under_review: 0,
    assigned: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
    rejected: 0,
    duplicate: 0,
    cancelled: 0,
  };

  for (const inc of incidents) {
    const s = inc.status as keyof typeof statusBreakdown;
    if (statusBreakdown[s] !== undefined) {
      statusBreakdown[s] += 1;
    }
  }

  const resolvedCount = statusBreakdown.resolved + statusBreakdown.closed;
  const inProgressCount = statusBreakdown.assigned + statusBreakdown.in_progress;
  const pendingCount = statusBreakdown.submitted + statusBreakdown.under_review;
  const rejectedCount = statusBreakdown.rejected + statusBreakdown.duplicate + statusBreakdown.cancelled;

  const resolutionRate = totalReports > 0 ? Math.round((resolvedCount / totalReports) * 100) : 0;

  // 2. Average Resolution Time Calculation
  let totalResolutionHours = 0;
  let resolvedWithTimestampCount = 0;

  for (const inc of incidents) {
    const resolutionTimestamp = inc.resolved_at || inc.closed_at;
    if (resolutionTimestamp && inc.created_at) {
      const createdTime = new Date(inc.created_at).getTime();
      const resolvedTime = new Date(resolutionTimestamp).getTime();
      const diffHours = Math.max(0, (resolvedTime - createdTime) / (1000 * 60 * 60));
      totalResolutionHours += diffHours;
      resolvedWithTimestampCount += 1;
    }
  }

  const averageResolutionHours =
    resolvedWithTimestampCount > 0 ? totalResolutionHours / resolvedWithTimestampCount : null;

  let averageResolutionFormatted = "N/A";
  if (averageResolutionHours !== null) {
    if (averageResolutionHours >= 24) {
      const days = averageResolutionHours / 24;
      averageResolutionFormatted = `${days.toFixed(1)} days`;
    } else {
      averageResolutionFormatted = `${averageResolutionHours.toFixed(1)} hrs`;
    }
  }

  // 3. Severity Breakdown
  const severityBreakdown = { low: 0, medium: 0, high: 0, critical: 0 };
  for (const inc of incidents) {
    const sev = (inc.severity || "medium") as keyof typeof severityBreakdown;
    if (severityBreakdown[sev] !== undefined) {
      severityBreakdown[sev] += 1;
    }
  }

  // 4. Category Breakdown (pre-populates all categories so every category is represented)
  const categoryMap = new Map<string, { id: string; name: string; count: number }>();

  // If viewing all categories, initialize all system categories
  if (isAllCategories) {
    for (const cat of allCategoriesList || []) {
      const isOtherCat =
        cat.name.toLowerCase().includes("other") ||
        cat.name.toLowerCase() === "other civic concern";
      const displayName = isOtherCat ? "Other (Civic Concern)" : cat.name;
      categoryMap.set(cat.id, { id: cat.id, name: displayName, count: 0 });
    }
  }

  for (const inc of incidents) {
    const isIncidentOther =
      !inc.category ||
      !inc.category.id ||
      inc.category.name.toLowerCase().includes("other") ||
      inc.category.name.toLowerCase() === "uncategorized";

    const catId = isIncidentOther
      ? (otherCatId || "other")
      : (inc.category?.id || inc.category_id || "other");

    const catName = isIncidentOther
      ? (otherCategory?.name || "Other (Civic Concern)")
      : (inc.category?.name || "Other");

    const existing = categoryMap.get(catId);
    if (existing) {
      existing.count += 1;
    } else {
      categoryMap.set(catId, { id: catId, name: catName, count: 1 });
    }
  }

  const categoryBreakdown = Array.from(categoryMap.values())
    .map((c) => ({
      ...c,
      percentage: totalReports > 0 ? Math.round((c.count / totalReports) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // 5. Barangay Breakdown (all reported barangays without artificial limit)
  const barangayMap = new Map<string, { barangay: string; count: number; resolved: number }>();
  for (const inc of incidents) {
    const bName = inc.barangay || "Unknown Barangay";
    const existing = barangayMap.get(bName) || { barangay: bName, count: 0, resolved: 0 };
    existing.count += 1;
    if (inc.status === "resolved" || inc.status === "closed" || Boolean(inc.resolved_at)) {
      existing.resolved += 1;
    }
    barangayMap.set(bName, existing);
  }

  const barangayBreakdown = Array.from(barangayMap.values())
    .sort((a, b) => b.count - a.count);

  // 6. Reports Over Time Timeline
  // If no incidents match the active filters, return empty array to trigger the clear empty state
  if (totalReports === 0) {
    return {
      totalReports: 0,
      resolutionRate: 0,
      resolvedCount: 0,
      inProgressCount: 0,
      pendingCount: 0,
      rejectedCount: 0,
      averageResolutionHours: null,
      averageResolutionFormatted: "N/A",
      statusBreakdown,
      severityBreakdown,
      categoryBreakdown: [],
      barangayBreakdown: [],
      reportsOverTime: [],
      error: null,
    };
  }

  // When reports exist, build continuous time buckets so the AreaChart has multiple data points,
  // a clean zero-baseline, and never collapses to an invisible single-point area.
  const timeBuckets = new Map<string, { submitted: number; resolved: number; label: string }>();
  const isMonthGrouping = dateRange === "1y";

  let rangeStart: Date;
  let rangeEnd: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (options?.fromDate && options.fromDate.trim()) {
    rangeStart = new Date(`${options.fromDate.trim()}T00:00:00Z`);
  } else if (dateRange === "7d") {
    rangeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
  } else if (dateRange === "30d") {
    rangeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
  } else if (dateRange === "90d") {
    rangeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 89);
  } else if (dateRange === "1y") {
    rangeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 364);
  } else {
    // "all" time: span from earliest incident to today
    const earliestTime = incidents.reduce((min, i) => {
      const t = new Date(i.created_at).getTime();
      return t < min ? t : min;
    }, now.getTime());
    rangeStart = new Date(earliestTime);
  }

  if (options?.toDate && options.toDate.trim()) {
    rangeEnd = new Date(`${options.toDate.trim()}T23:59:59Z`);
  }

  // Pre-populate continuous intervals
  if (isMonthGrouping) {
    const cur = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
    const end = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), 1);
    while (cur <= end) {
      const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}`;
      const label = cur.toLocaleDateString("en-PH", { month: "short", year: "2-digit" });
      timeBuckets.set(key, { submitted: 0, resolved: 0, label });
      cur.setMonth(cur.getMonth() + 1);
    }
  } else {
    const cur = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate());
    const end = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), rangeEnd.getDate());
    const dayDiff = Math.max(1, Math.round((end.getTime() - cur.getTime()) / (1000 * 60 * 60 * 24)));

    if (dayDiff > 90) {
      // Monthly buckets for spans exceeding 90 days
      const curM = new Date(cur.getFullYear(), cur.getMonth(), 1);
      const endM = new Date(end.getFullYear(), end.getMonth(), 1);
      while (curM <= endM) {
        const key = `${curM.getFullYear()}-${String(curM.getMonth() + 1).padStart(2, "0")}`;
        const label = curM.toLocaleDateString("en-PH", { month: "short", year: "2-digit" });
        timeBuckets.set(key, { submitted: 0, resolved: 0, label });
        curM.setMonth(curM.getMonth() + 1);
      }
    } else {
      while (cur <= end) {
        const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`;
        const label = cur.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
        timeBuckets.set(key, { submitted: 0, resolved: 0, label });
        cur.setDate(cur.getDate() + 1);
      }
    }
  }

  // Accurately attribute submissions to created_at and resolutions to resolved_at / closed_at
  for (const inc of incidents) {
    // 1. Attributed Submission
    const createdDate = new Date(inc.created_at);
    const dayKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, "0")}-${String(createdDate.getDate()).padStart(2, "0")}`;
    const monthKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, "0")}`;

    let submitBucket = timeBuckets.get(dayKey) || timeBuckets.get(monthKey);
    if (!submitBucket) {
      const label = createdDate.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
      submitBucket = { submitted: 0, resolved: 0, label };
      timeBuckets.set(dayKey, submitBucket);
    }
    submitBucket.submitted += 1;

    // 2. Attributed Resolution (using resolution timestamp rather than relying only on current status)
    if (inc.status === "resolved" || inc.status === "closed" || Boolean(inc.resolved_at)) {
      const resolutionDate = inc.resolved_at
        ? new Date(inc.resolved_at)
        : (inc.closed_at ? new Date(inc.closed_at) : createdDate);
      const resDayKey = `${resolutionDate.getFullYear()}-${String(resolutionDate.getMonth() + 1).padStart(2, "0")}-${String(resolutionDate.getDate()).padStart(2, "0")}`;
      const resMonthKey = `${resolutionDate.getFullYear()}-${String(resolutionDate.getMonth() + 1).padStart(2, "0")}`;

      const resBucket = timeBuckets.get(resDayKey) || timeBuckets.get(resMonthKey);
      if (resBucket) {
        resBucket.resolved += 1;
      } else {
        submitBucket.resolved += 1;
      }
    }
  }

  const reportsOverTime = Array.from(timeBuckets.entries())
    .map(([date, data]) => ({
      date,
      label: data.label,
      submitted: data.submitted,
      resolved: data.resolved,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalReports,
    resolutionRate,
    resolvedCount,
    inProgressCount,
    pendingCount,
    rejectedCount,
    averageResolutionHours,
    averageResolutionFormatted,
    statusBreakdown,
    severityBreakdown,
    categoryBreakdown,
    barangayBreakdown,
    reportsOverTime,
    error: null,
  };
}

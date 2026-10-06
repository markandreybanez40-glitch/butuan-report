import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  Profile,
  Incident,
  IncidentAttachment,
  IncidentUpdateEntry,
  IncidentAssignment,
} from "@/types";

export interface StaffIncidentSummary {
  total: number;
  submitted: number;
  underReview: number;
  assigned: number;
  inProgress: number;
  resolved: number;
  closed: number;
  critical: number;
}

export interface StaffIncidentListItem extends Incident {
  category: { id: string; name: string } | null;
  reporter: { id: string; full_name: string; phone: string | null; barangay: string | null } | null;
  assignments: {
    id: string;
    department_id: string | null;
    assigned_user_id: string | null;
    assigned_at: string;
    unassigned_at: string | null;
    department: { id: string; name: string } | null;
    assigned_user: { id: string; full_name: string; role: string } | null;
  }[];
}

export interface StaffIncidentFullDetails extends Incident {
  category: { id: string; name: string; description: string | null } | null;
  reporter: { id: string; full_name: string; phone: string | null; barangay: string | null } | null;
  attachments: (IncidentAttachment & { signed_url?: string | null })[];
  updates: (IncidentUpdateEntry & {
    author: { id: string; full_name: string; role: string } | null;
  })[];
  assignments: (IncidentAssignment & {
    department: { id: string; name: string } | null;
    assigned_user: { id: string; full_name: string; role: string } | null;
    assigner: { id: string; full_name: string; role: string } | null;
  })[];
}

/**
 * Fetches computed stats for the staff dashboard based on role:
 * - Dispatcher & Admin: Full city-wide incident counts
 * - Responder: Scoped only to incidents assigned to this responder
 */
export async function getStaffIncidentStats(profile: Profile): Promise<StaffIncidentSummary> {
  const supabase = createServerSupabaseClient();

  if (profile.role === "responder") {
    // 1. Get active incident IDs assigned to this responder
    const { data: assignments, error: assignError } = await supabase
      .from("incident_assignments")
      .select("incident_id")
      .eq("assigned_user_id", profile.id)
      .is("unassigned_at", null);

    if (assignError || !assignments || assignments.length === 0) {
      return {
        total: 0,
        submitted: 0,
        underReview: 0,
        assigned: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0,
        critical: 0,
      };
    }

    const incidentIds = assignments.map((a) => a.incident_id);

    const { data: incidents, error: incError } = await supabase
      .from("incidents")
      .select("status, severity")
      .in("id", incidentIds);

    if (incError || !incidents) {
      return {
        total: 0,
        submitted: 0,
        underReview: 0,
        assigned: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0,
        critical: 0,
      };
    }

    return {
      total: incidents.length,
      submitted: incidents.filter((i) => i.status === "submitted").length,
      underReview: incidents.filter((i) => i.status === "under_review").length,
      assigned: incidents.filter((i) => i.status === "assigned").length,
      inProgress: incidents.filter((i) => i.status === "in_progress").length,
      resolved: incidents.filter((i) => i.status === "resolved").length,
      closed: incidents.filter((i) => i.status === "closed").length,
      critical: incidents.filter(
        (i) => i.severity === "critical" && !["resolved", "closed", "cancelled"].includes(i.status)
      ).length,
    };
  }

  // Dispatchers and Admins see city-wide stats
  const { data: incidents, error } = await supabase
    .from("incidents")
    .select("status, severity");

  if (error || !incidents) {
    return {
      total: 0,
      submitted: 0,
      underReview: 0,
      assigned: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
      critical: 0,
    };
  }

  return {
    total: incidents.length,
    submitted: incidents.filter((i) => i.status === "submitted").length,
    underReview: incidents.filter((i) => i.status === "under_review").length,
    assigned: incidents.filter((i) => i.status === "assigned").length,
    inProgress: incidents.filter((i) => i.status === "in_progress").length,
    resolved: incidents.filter((i) => i.status === "resolved").length,
    closed: incidents.filter((i) => i.status === "closed").length,
    critical: incidents.filter(
      (i) => i.severity === "critical" && !["resolved", "closed", "cancelled"].includes(i.status)
    ).length,
  };
}

/**
 * Fetches the incident queue for staff.
 * - Responders see only their assigned incidents
 * - Dispatchers and Admins see the municipal queue
 * Supports search and filters (status, severity, category, barangay).
 */
export async function getStaffIncidentQueue(
  profile: Profile,
  options?: {
    search?: string;
    status?: string;
    severity?: string;
    categoryId?: string;
    barangay?: string;
    limit?: number;
  }
): Promise<StaffIncidentListItem[]> {
  const supabase = createServerSupabaseClient();

  // If responder, restrict to assigned incident IDs
  let responderIncidentIds: string[] | null = null;
  if (profile.role === "responder") {
    const { data: assignments } = await supabase
      .from("incident_assignments")
      .select("incident_id")
      .eq("assigned_user_id", profile.id)
      .is("unassigned_at", null);

    if (!assignments || assignments.length === 0) {
      return [];
    }
    responderIncidentIds = assignments.map((a) => a.incident_id);
  }

  let query = supabase
    .from("incidents")
    .select(`
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
        assigned_user:profiles!incident_assignments_assigned_user_id_fkey(id, full_name, role)
      )
    `)
    .order("created_at", { ascending: false });

  if (responderIncidentIds !== null) {
    query = query.in("id", responderIncidentIds);
  }

  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }

  if (options?.severity && options.severity !== "all") {
    query = query.eq("severity", options.severity);
  }

  if (options?.categoryId && options.categoryId !== "all") {
    query = query.eq("category_id", options.categoryId);
  }

  if (options?.barangay && options.barangay !== "all") {
    query = query.eq("barangay", options.barangay);
  }

  if (options?.search && options.search.trim()) {
    const term = `%${options.search.trim()}%`;
    query = query.or(`title.ilike.${term},report_number.ilike.${term},barangay.ilike.${term}`);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching staff incident queue:", error.message);
    return [];
  }

  return (data as unknown as StaffIncidentListItem[]) ?? [];
}

/**
 * Fetches full details of a single incident for staff view:
 * Includes location, signed attachments, public updates, internal notes, and assignment history.
 * Responders may only access incidents assigned to them.
 */
export async function getStaffIncidentDetails(
  id: string,
  profile: Profile
): Promise<StaffIncidentFullDetails | null> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("incidents")
    .select(`
      *,
      category:incident_categories(id, name, description),
      reporter:profiles!reporter_id(id, full_name, phone, barangay),
      attachments:incident_attachments(*),
      updates:incident_updates(*, author:profiles!incident_updates_author_id_fkey(id, full_name, role)),
      assignments:incident_assignments(
        *,
        department:departments(id, name),
        assigned_user:profiles!incident_assignments_assigned_user_id_fkey(id, full_name, role),
        assigner:profiles!incident_assignments_assigned_by_fkey(id, full_name, role)
      )
    `)
    .eq("id", id)
    .order("created_at", { referencedTable: "incident_updates", ascending: true })
    .order("assigned_at", { referencedTable: "incident_assignments", ascending: false })
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("Error fetching staff incident details:", error.message);
    return null;
  }

  const incident = data as unknown as StaffIncidentFullDetails;

  // Responder authorization check: Responders may only access incidents assigned to them
  if (profile.role === "responder") {
    const isAssigned = incident.assignments.some(
      (a) => a.assigned_user_id === profile.id && a.unassigned_at === null
    );
    if (!isAssigned) {
      return null;
    }
  }

  // Generate temporary signed URLs for attachments (expires in 1 hour)
  if (incident.attachments && incident.attachments.length > 0) {
    const attachmentsWithUrls = await Promise.all(
      incident.attachments.map(async (att) => {
        const { data: signedData } = await supabase.storage
          .from("incident-attachments")
          .createSignedUrl(att.storage_path, 3600);
        return {
          ...att,
          signed_url: signedData?.signedUrl || null,
        };
      })
    );
    incident.attachments = attachmentsWithUrls;
  }

  return incident;
}

/**
 * Fetches all staff members (responders, dispatchers, admins) for assignment dropdowns.
 */
export async function getAssignableStaff(): Promise<
  { id: string; full_name: string; role: string; phone: string | null }[]
> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, phone")
    .in("role", ["responder", "dispatcher", "admin"])
    .order("full_name", { ascending: true });

  if (error) {
    console.error("Error fetching assignable staff:", error.message);
    return [];
  }

  return data ?? [];
}

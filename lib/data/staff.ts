import { createAdminSupabaseClient } from "@/lib/supabase/server";
import {
  DISPATCH_INSTRUCTIONS,
  type Profile,
  type Incident,
  type IncidentAttachment,
  type IncidentUpdateEntry,
  type IncidentAssignment,
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
    field_responder?: string | null;
    instruction?: string | null;
    dispatch_vehicle?: string | null;
    assigned_at: string;
    unassigned_at: string | null;
    department: { id: string; name: string } | null;
    assigned_user: {
      id: string;
      full_name: string;
      role: string;
      phone?: string | null;
      department_id?: string | null;
      department?: { id: string; name: string } | null;
    } | null;
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
    assigned_user: {
      id: string;
      full_name: string;
      role: string;
      phone?: string | null;
      department_id?: string | null;
      department?: { id: string; name: string } | null;
    } | null;
    assigner: { id: string; full_name: string; role: string } | null;
  })[];
}

/**
 * Fetches computed stats for the staff dashboard based on role:
 * - Dispatcher & Admin: Full city-wide incident counts using fast metadata count queries
 * - Responder: Scoped only to incidents assigned to this responder
 */
export async function getStaffIncidentStats(profile: Profile): Promise<StaffIncidentSummary> {
  const supabase = createAdminSupabaseClient();

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
      .select("status, severity, resolved_at")
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
      resolved: incidents.filter((i) => i.status === "resolved" || Boolean(i.resolved_at)).length,
      closed: incidents.filter((i) => i.status === "closed").length,
      critical: incidents.filter(
        (i) => i.severity === "critical" && !["resolved", "closed", "cancelled"].includes(i.status)
      ).length,
    };
  }

  // Dispatchers and Admins see city-wide stats via high-performance concurrent HEAD queries
  const [
    { count: totalCount },
    { count: submittedCount },
    { count: underReviewCount },
    { count: assignedCount },
    { count: inProgressCount },
    { count: resolvedCount },
    { count: closedCount },
    { count: criticalCount },
  ] = await Promise.all([
    supabase.from("incidents").select("*", { count: "exact", head: true }),
    supabase.from("incidents").select("*", { count: "exact", head: true }).eq("status", "submitted"),
    supabase.from("incidents").select("*", { count: "exact", head: true }).eq("status", "under_review"),
    supabase.from("incidents").select("*", { count: "exact", head: true }).eq("status", "assigned"),
    supabase.from("incidents").select("*", { count: "exact", head: true }).eq("status", "in_progress"),
    supabase.from("incidents").select("*", { count: "exact", head: true }).or("status.eq.resolved,resolved_at.not.is.null"),
    supabase.from("incidents").select("*", { count: "exact", head: true }).eq("status", "closed"),
    supabase.from("incidents").select("*", { count: "exact", head: true }).eq("severity", "critical").not("status", "in", '("resolved","closed","cancelled")'),
  ]);

  return {
    total: totalCount || 0,
    submitted: submittedCount || 0,
    underReview: underReviewCount || 0,
    assigned: assignedCount || 0,
    inProgress: inProgressCount || 0,
    resolved: resolvedCount || 0,
    closed: closedCount || 0,
    critical: criticalCount || 0,
  };
}

export interface PaginatedIncidentQueueResult {
  incidents: StaffIncidentListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Fetches paginated incident queue with server-side range queries and exact total count.
 */
export async function getStaffIncidentPaginatedQueue(
  profile: Profile,
  options?: {
    search?: string;
    status?: string;
    severity?: string;
    categoryId?: string;
    barangay?: string;
    sort?: "newest" | "oldest" | "priority" | string;
    page?: number;
    pageSize?: number;
  }
): Promise<PaginatedIncidentQueueResult> {
  const supabase = createAdminSupabaseClient();
  const page = Math.max(1, options?.page || 1);
  const pageSize = Math.min(100, Math.max(1, options?.pageSize || 15));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // If responder, restrict to assigned incident IDs
  let responderIncidentIds: string[] | null = null;
  if (profile.role === "responder") {
    const { data: assignments } = await supabase
      .from("incident_assignments")
      .select("incident_id")
      .eq("assigned_user_id", profile.id)
      .is("unassigned_at", null);

    if (!assignments || assignments.length === 0) {
      return {
        incidents: [],
        totalCount: 0,
        page,
        pageSize,
        totalPages: 1,
      };
    }
    responderIncidentIds = assignments.map((a) => a.incident_id);
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
        assigned_user:profiles!incident_assignments_assigned_user_id_fkey(
          id,
          full_name,
          role,
          phone,
          department_id,
          department:departments(id, name)
        )
      )
    `,
      { count: "exact" }
    );

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

  if (options?.sort === "oldest") {
    query = query.order("created_at", { ascending: true });
  } else if (options?.sort === "priority") {
    query = query.order("severity", { ascending: true }).order("created_at", { ascending: false });
  } else {
    // Default to newest first (hits idx_incidents_created_at index)
    query = query.order("created_at", { ascending: false });
  }

  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error("Error fetching paginated staff incident queue:", error.message);
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
  const incidents = (data as unknown as StaffIncidentListItem[]) ?? [];

  return {
    incidents,
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Fetches the incident queue for staff.
 * Preserved for backwards compatibility with bounded calls.
 */
export async function getStaffIncidentQueue(
  profile: Profile,
  options?: {
    search?: string;
    status?: string;
    severity?: string;
    categoryId?: string;
    barangay?: string;
    sort?: "newest" | "oldest" | "priority" | string;
    limit?: number;
  }
): Promise<StaffIncidentListItem[]> {
  const result = await getStaffIncidentPaginatedQueue(profile, {
    ...options,
    page: 1,
    pageSize: options?.limit || 200,
  });
  return result.incidents;
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
  const supabase = createAdminSupabaseClient();

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
        assigned_user:profiles!incident_assignments_assigned_user_id_fkey(
          id,
          full_name,
          role,
          phone,
          department_id,
          department:departments(id, name)
        ),
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

  // Populate field_responder and instruction on assignments
  if (incident.assignments && incident.assignments.length > 0) {
    incident.assignments = incident.assignments.map((a) => {
      let field_responder = a.field_responder || null;
      let instruction = a.instruction || null;
      let dispatch_vehicle = (a as unknown as { dispatch_vehicle?: string | null }).dispatch_vehicle || null;

      if (incident.updates) {
        const internalUpdates = incident.updates.filter((u) => u.visibility === "internal");
        let targetUpdates = internalUpdates;
        if (a.unassigned_at === null) {
          targetUpdates = [...internalUpdates].reverse();
        } else if (a.assigned_at) {
          const aTime = new Date(a.assigned_at).getTime();
          targetUpdates = [...internalUpdates].sort((x, y) => {
            const diffX = Math.abs(new Date(x.created_at).getTime() - aTime);
            const diffY = Math.abs(new Date(y.created_at).getTime() - aTime);
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
}

export interface AssignableStaffMember {
  id: string;
  full_name: string;
  role: string;
  phone: string | null;
  department_id: string | null;
  department?: { id: string; name: string } | null;
}

/**
 * Fetches all staff members (responders, dispatchers, admins) for assignment dropdowns.
 */
export async function getAssignableStaff(): Promise<AssignableStaffMember[]> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, phone, department_id, department:departments(id, name)")
    .in("role", ["responder", "dispatcher", "admin"])
    .order("full_name", { ascending: true });

  if (error) {
    console.error("Error fetching assignable staff:", error.message);
    return [];
  }

  return (data as unknown as AssignableStaffMember[]) ?? [];
}

/**
 * Fetches eligible field responders, optionally filtered by a specific department.
 */
export async function getFieldRespondersByDepartment(
  departmentId?: string | null
): Promise<AssignableStaffMember[]> {
  const supabase = createAdminSupabaseClient();
  let query = supabase
    .from("profiles")
    .select("id, full_name, role, phone, department_id, department:departments(id, name)")
    .eq("role", "responder")
    .order("full_name", { ascending: true });

  if (departmentId) {
    query = query.eq("department_id", departmentId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching field responders by department:", error.message);
    return [];
  }

  return (data as unknown as AssignableStaffMember[]) ?? [];
}

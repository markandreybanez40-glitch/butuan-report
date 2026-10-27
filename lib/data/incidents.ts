import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { getOrCreateCurrentProfile } from "@/lib/data/profiles";
import type {
  Incident,
  IncidentInsert,
  IncidentAttachment,
  IncidentUpdateEntry,
} from "@/types";

export interface IncidentWithCategory extends Incident {
  category: {
    id: string;
    name: string;
    description: string | null;
  } | null;
}

export interface ResidentIncidentUpdateEntry extends IncidentUpdateEntry {
  author?: {
    id: string;
    full_name: string;
    role: string;
  } | null;
}

export interface ResidentIncidentAssignment {
  id: string;
  department_id: string | null;
  assigned_at: string;
  unassigned_at: string | null;
  department: {
    id: string;
    name: string;
  } | null;
}

export interface IncidentWithDetails extends IncidentWithCategory {
  attachments: (IncidentAttachment & { signed_url?: string | null })[];
  updates: ResidentIncidentUpdateEntry[];
  assignments?: ResidentIncidentAssignment[];
}

export interface ResidentIncidentStats {
  total: number;
  underReview: number;
  inProgress: number;
  resolved: number;
}

/**
 * Fetches computed stats for the signed-in resident's reports.
 * Strictly scoped to the signed-in resident's reporter_id.
 */
export async function getResidentIncidentStats(): Promise<ResidentIncidentStats> {
  const profile = await getOrCreateCurrentProfile();
  if (!profile) {
    return { total: 0, underReview: 0, inProgress: 0, resolved: 0 };
  }

  const supabase = createAdminSupabaseClient();

  const [
    { count: totalCount, error: err1 },
    { count: underReviewCount, error: err2 },
    { count: inProgressCount, error: err3 },
    { count: resolvedCount, error: err4 },
  ] = await Promise.all([
    supabase.from("incidents").select("*", { count: "exact", head: true }).eq("reporter_id", profile.id),
    supabase
      .from("incidents")
      .select("*", { count: "exact", head: true })
      .eq("reporter_id", profile.id)
      .in("status", ["submitted", "under_review"]),
    supabase
      .from("incidents")
      .select("*", { count: "exact", head: true })
      .eq("reporter_id", profile.id)
      .in("status", ["assigned", "in_progress"]),
    supabase
      .from("incidents")
      .select("*", { count: "exact", head: true })
      .eq("reporter_id", profile.id)
      .or("status.eq.resolved,and(status.eq.closed,resolved_at.not.is.null)"),
  ]);

  if (err1 || err2 || err3 || err4) {
    console.error("Error fetching resident incident stats via HEAD queries:", err1 || err2 || err3 || err4);
  }

  return {
    total: totalCount || 0,
    underReview: underReviewCount || 0,
    inProgress: inProgressCount || 0,
    resolved: resolvedCount || 0,
  };
}

export interface PaginatedResidentIncidentsResult {
  reports: IncidentWithCategory[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Fetches reports owned by the signed-in resident with server-side range pagination and search/filtering.
 */
export async function getMyPaginatedIncidents(options?: {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResidentIncidentsResult> {
  const profile = await getOrCreateCurrentProfile();
  const page = Math.max(1, options?.page || 1);
  const pageSize = Math.min(100, Math.max(1, options?.pageSize || 10));

  if (!profile) {
    return {
      reports: [],
      totalCount: 0,
      page,
      pageSize,
      totalPages: 1,
    };
  }

  const supabase = createAdminSupabaseClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("incidents")
    .select(
      `
      *,
      category:incident_categories(id, name, description)
    `,
      { count: "exact" }
    )
    .eq("reporter_id", profile.id)
    .order("created_at", { ascending: false });

  if (options?.status && options.status !== "all") {
    if (options.status.toLowerCase() === "resolved") {
      query = query.or("status.eq.resolved,and(status.eq.closed,resolved_at.not.is.null)");
    } else {
      query = query.eq("status", options.status);
    }
  }

  if (options?.search && options.search.trim()) {
    const term = `%${options.search.trim()}%`;
    query = query.or(`title.ilike.${term},report_number.ilike.${term},barangay.ilike.${term}`);
  }

  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error("Error fetching paginated resident incidents:", error.message);
    return {
      reports: [],
      totalCount: 0,
      page,
      pageSize,
      totalPages: 1,
    };
  }

  const totalCount = count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const reports = (data as unknown as IncidentWithCategory[]) ?? [];

  return {
    reports,
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Fetches reports owned by the signed-in resident.
 * Preserved for backwards compatibility with bounded calls.
 */
export async function getMyIncidents(options?: {
  status?: string;
  search?: string;
  limit?: number;
}): Promise<IncidentWithCategory[]> {
  const result = await getMyPaginatedIncidents({
    status: options?.status,
    search: options?.search,
    page: 1,
    pageSize: options?.limit || 200,
  });
  return result.reports;
}

/**
 * Fetches a single incident report with its category, attachments, public department assignment, and public updates.
 * Residents only receive public updates due to Supabase RLS and server-side filtering.
 */
export async function getMyIncidentWithDetails(id: string): Promise<IncidentWithDetails | null> {
  const profile = await getOrCreateCurrentProfile();
  if (!profile) return null;

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("incidents")
    .select(`
      *,
      category:incident_categories(id, name, description),
      attachments:incident_attachments(*),
      updates:incident_updates(*, author:profiles!incident_updates_author_id_fkey(id, full_name, role)),
      assignments:incident_assignments(
        id,
        department_id,
        assigned_at,
        unassigned_at,
        department:departments(id, name)
      )
    `)
    .eq("id", id)
    .eq("reporter_id", profile.id)
    .order("created_at", { referencedTable: "incident_updates", ascending: true })
    .maybeSingle();

  if (error) {
    console.error("Error fetching incident details:", error.message);
    return null;
  }

  const rawIncident = data as unknown as IncidentWithDetails;
  if (rawIncident?.attachments && rawIncident.attachments.length > 0) {
    const attachmentsWithUrls = await Promise.all(
      rawIncident.attachments.map(async (att) => {
        const { data: signedData } = await supabase.storage
          .from("incident-attachments")
          .createSignedUrl(att.storage_path, 3600);
        return {
          ...att,
          signed_url: signedData?.signedUrl || null,
        };
      })
    );
    rawIncident.attachments = attachmentsWithUrls;
  }

  if (rawIncident?.updates) {
    rawIncident.updates = rawIncident.updates.filter((u) => u.visibility === "public");
  }

  return rawIncident ?? null;
}

/**
 * Creates a new incident report for the authenticated resident.
 * - Enforces server-side validation that category is active.
 * - Forces status to 'submitted' and binds reporter_id immutably to authenticated caller.
 */
export async function createResidentIncident(formData: {
  title: string;
  description: string;
  category_id: string;
  severity: "low" | "medium" | "high" | "critical";
  barangay: string;
  street_area?: string | null;
  landmark?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}): Promise<Incident | null> {
  const profile = await getOrCreateCurrentProfile();
  if (!profile) {
    throw new Error("User profile not found. Please sign in again.");
  }

  const adminClient = createAdminSupabaseClient();

  // Validate active category
  const { data: category, error: catError } = await adminClient
    .from("incident_categories")
    .select("id, is_active")
    .eq("id", formData.category_id)
    .single();

  if (catError || !category || !category.is_active) {
    throw new Error("Selected incident category is inactive or invalid. Please select an active category.");
  }

  // Prevent duplicate submissions: check if an identical report was recently submitted by the caller
  const thirtySecondsAgo = new Date(Date.now() - 30 * 1000).toISOString();
  const { data: recentDuplicate } = await adminClient
    .from("incidents")
    .select("id, report_number")
    .eq("reporter_id", profile.id)
    .eq("title", formData.title.trim())
    .gte("created_at", thirtySecondsAgo)
    .maybeSingle();

  if (recentDuplicate) {
    throw new Error(
      `Duplicate report detected: You have already submitted a report with this title (#${recentDuplicate.report_number}). Please wait before submitting again.`
    );
  }

  // Pre-generate report number using the official PostgreSQL sequence RPC on the trusted server layer.
  // This avoids permission denied errors when the database evaluates column defaults under the authenticated resident role,
  // while strictly ensuring collision-free, sequential municipal report numbers.
  let reportNumber: string | undefined;
  try {
    const { data: generatedNumber, error: rpcError } = await adminClient.rpc("generate_report_number");
    if (!rpcError && generatedNumber) {
      reportNumber = generatedNumber;
    }
  } catch (err) {
    console.warn("Notice: generate_report_number RPC unavailable, falling back to database default:", err);
  }

  const newIncident: Omit<IncidentInsert, "id" | "created_at" | "updated_at"> = {
    reporter_id: profile.id,
    title: formData.title.trim(),
    description: formData.description.trim(),
    category_id: formData.category_id,
    severity: formData.severity,
    status: "submitted",
    barangay: formData.barangay.trim(),
    street_area: formData.street_area?.trim() || null,
    landmark: formData.landmark?.trim() || null,
    latitude: formData.latitude ?? null,
    longitude: formData.longitude ?? null,
    ...(reportNumber ? { report_number: reportNumber } : {}),
  };

  const { data, error } = await adminClient
    .from("incidents")
    .insert(newIncident as IncidentInsert)
    .select()
    .single();

  if (error) {
    console.error("Error creating resident incident:", error.message);
    throw new Error(error.message);
  }

  return data;
}

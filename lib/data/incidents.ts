import { createServerSupabaseClient } from "@/lib/supabase/server";
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

export interface IncidentWithDetails extends IncidentWithCategory {
  attachments: (IncidentAttachment & { signed_url?: string | null })[];
  updates: IncidentUpdateEntry[];
}

export interface ResidentIncidentStats {
  total: number;
  underReview: number;
  inProgress: number;
  resolved: number;
}

/**
 * Fetches computed stats for the signed-in resident's reports.
 * Enforced by Supabase RLS (only returns resident's own reports).
 */
export async function getResidentIncidentStats(): Promise<ResidentIncidentStats> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("incidents")
    .select("status");

  if (error || !data) {
    if (error) console.error("Error fetching resident incident stats:", error.message);
    return { total: 0, underReview: 0, inProgress: 0, resolved: 0 };
  }

  const total = data.length;
  const underReview = data.filter(
    (r) => r.status === "submitted" || r.status === "under_review"
  ).length;
  const inProgress = data.filter(
    (r) => r.status === "assigned" || r.status === "in_progress"
  ).length;
  const resolved = data.filter(
    (r) => r.status === "resolved" || r.status === "closed"
  ).length;

  return { total, underReview, inProgress, resolved };
}

/**
 * Fetches reports owned by the signed-in resident.
 * Supports status filtering, keyword search, and limit.
 */
export async function getMyIncidents(options?: {
  status?: string;
  search?: string;
  limit?: number;
}): Promise<IncidentWithCategory[]> {
  const supabase = createServerSupabaseClient();
  let query = supabase
    .from("incidents")
    .select(`
      *,
      category:incident_categories(id, name, description)
    `)
    .order("created_at", { ascending: false });

  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status);
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
    console.error("Error fetching my incidents:", error.message);
    return [];
  }

  return (data as unknown as IncidentWithCategory[]) ?? [];
}

/**
 * Fetches a single incident report with its category, attachments, and public updates.
 * Residents only receive public updates due to Supabase RLS.
 */
export async function getMyIncidentWithDetails(id: string): Promise<IncidentWithDetails | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("incidents")
    .select(`
      *,
      category:incident_categories(id, name, description),
      attachments:incident_attachments(*),
      updates:incident_updates(*)
    `)
    .eq("id", id)
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
 * Automatically links to the resident's profile and sets default status to 'submitted'.
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

  const supabase = createServerSupabaseClient();
  const newIncident: Omit<IncidentInsert, "id" | "report_number" | "created_at" | "updated_at"> = {
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
  };

  const { data, error } = await supabase
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

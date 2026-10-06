"use server";

import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import { getCurrentProfile } from "@/lib/data/profiles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  notifyIncidentStatusChanged,
  notifyIncidentAssigned,
  notifyIncidentUpdateAdded,
} from "@/lib/data/notifications";
import type { IncidentStatus } from "@/types";

export interface StaffActionResult {
  success: boolean;
  error?: string;
}

const VALID_STATUSES: IncidentStatus[] = [
  "submitted",
  "under_review",
  "assigned",
  "in_progress",
  "resolved",
  "closed",
  "rejected",
  "duplicate",
  "cancelled",
];

/**
 * Updates operational status of an incident.
 * - Dispatcher / Admin: Can set any valid status
 * - Responder: Can only update incidents assigned to them (typically in_progress or resolved)
 */
export async function updateStaffIncidentStatusAction(formData: FormData): Promise<StaffActionResult> {
  const user = await currentUser();
  if (!user) {
    return { success: false, error: "Unauthorized: Please sign in." };
  }

  const profile = await getCurrentProfile();
  if (!profile || profile.role === "resident") {
    return { success: false, error: "Forbidden: Staff credentials required." };
  }

  const incidentId = (formData.get("incident_id") as string)?.trim();
  const nextStatus = (formData.get("status") as string)?.trim() as IncidentStatus;
  const note = (formData.get("note") as string)?.trim();

  if (!incidentId) {
    return { success: false, error: "Incident ID is required." };
  }

  if (!nextStatus || !VALID_STATUSES.includes(nextStatus)) {
    return { success: false, error: `Invalid status: "${nextStatus}".` };
  }

  const supabase = createServerSupabaseClient();

  // Responder authorization verification
  if (profile.role === "responder") {
    const { data: assignment } = await supabase
      .from("incident_assignments")
      .select("id")
      .eq("incident_id", incidentId)
      .eq("assigned_user_id", profile.id)
      .is("unassigned_at", null)
      .maybeSingle();

    if (!assignment) {
      return {
        success: false,
        error: "Forbidden: You may only update incidents assigned to you.",
      };
    }
  }

  const updatePayload: {
    status: IncidentStatus;
    resolved_at?: string | null;
    closed_at?: string | null;
  } = {
    status: nextStatus,
  };

  if (nextStatus === "resolved") {
    updatePayload.resolved_at = new Date().toISOString();
  } else if (nextStatus === "closed") {
    updatePayload.closed_at = new Date().toISOString();
  }

  const { error: updateError } = await supabase
    .from("incidents")
    .update(updatePayload)
    .eq("id", incidentId);

  if (updateError) {
    console.error("Error updating incident status:", updateError.message);
    return { success: false, error: updateError.message };
  }

  // If a note was included with the status change, post as public or internal update
  if (note) {
    await supabase.from("incident_updates").insert({
      incident_id: incidentId,
      author_id: profile.id,
      message: `Status updated to ${nextStatus.toUpperCase().replace("_", " ")}: ${note}`,
      visibility: "public",
    });
  }

  // Dispatch status update notifications
  await notifyIncidentStatusChanged({
    incidentId,
    newStatus: nextStatus,
    actorId: profile.id,
    note: note || undefined,
  });

  revalidatePath("/staff");
  revalidatePath("/staff/incidents");
  revalidatePath(`/staff/incidents/${incidentId}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/reports");
  revalidatePath(`/dashboard/reports/${incidentId}`);

  return { success: true };
}

/**
 * Assigns or reassigns an incident to a department and/or responder.
 * Restricted to dispatchers and admins only.
 */
export async function assignIncidentStaffAction(formData: FormData): Promise<StaffActionResult> {
  const user = await currentUser();
  if (!user) {
    return { success: false, error: "Unauthorized: Please sign in." };
  }

  const profile = await getCurrentProfile();
  if (!profile || !["dispatcher", "admin"].includes(profile.role)) {
    return { success: false, error: "Forbidden: Only dispatchers and admins can assign incidents." };
  }

  const incidentId = (formData.get("incident_id") as string)?.trim();
  const departmentId = (formData.get("department_id") as string)?.trim() || null;
  const responderId = (formData.get("assigned_user_id") as string)?.trim() || null;
  const assignmentNote = (formData.get("assignment_note") as string)?.trim();

  if (!incidentId) {
    return { success: false, error: "Incident ID is required." };
  }

  if (!departmentId && !responderId) {
    return { success: false, error: "Please select a department or an assigned responder." };
  }

  const supabase = createServerSupabaseClient();

  // 1. Mark existing active assignments as unassigned
  await supabase
    .from("incident_assignments")
    .update({ unassigned_at: new Date().toISOString() })
    .eq("incident_id", incidentId)
    .is("unassigned_at", null);

  // 2. Insert new assignment
  const { error: assignError } = await supabase.from("incident_assignments").insert({
    incident_id: incidentId,
    department_id: departmentId,
    assigned_user_id: responderId,
    assigned_by: profile.id,
  });

  if (assignError) {
    console.error("Error creating incident assignment:", assignError.message);
    return { success: false, error: assignError.message };
  }

  // 3. Automatically advance status to 'assigned' if currently 'submitted' or 'under_review'
  const { data: incident } = await supabase
    .from("incidents")
    .select("status")
    .eq("id", incidentId)
    .single();

  if (incident && (incident.status === "submitted" || incident.status === "under_review")) {
    await supabase.from("incidents").update({ status: "assigned" }).eq("id", incidentId);
  }

  // 4. Log internal note if provided
  if (assignmentNote) {
    await supabase.from("incident_updates").insert({
      incident_id: incidentId,
      author_id: profile.id,
      message: `Assignment Note: ${assignmentNote}`,
      visibility: "internal",
    });
  }

  // Dispatch assignment notifications to resident and assigned responder
  await notifyIncidentAssigned({
    incidentId,
    assignedUserId: responderId,
    departmentId,
    actorId: profile.id,
    note: assignmentNote || undefined,
  });

  revalidatePath("/staff");
  revalidatePath("/staff/incidents");
  revalidatePath(`/staff/incidents/${incidentId}`);
  revalidatePath(`/dashboard/reports/${incidentId}`);

  return { success: true };
}

/**
 * Adds a new timeline update or internal note to an incident.
 * - Public updates are visible to citizens and staff.
 * - Internal notes are strictly restricted to staff and never visible to residents.
 */
export async function addStaffIncidentUpdateAction(formData: FormData): Promise<StaffActionResult> {
  const user = await currentUser();
  if (!user) {
    return { success: false, error: "Unauthorized: Please sign in." };
  }

  const profile = await getCurrentProfile();
  if (!profile || profile.role === "resident") {
    return { success: false, error: "Forbidden: Staff credentials required." };
  }

  const incidentId = (formData.get("incident_id") as string)?.trim();
  const message = (formData.get("message") as string)?.trim();
  const visibility = (formData.get("visibility") as string)?.trim() as "public" | "internal";

  if (!incidentId) {
    return { success: false, error: "Incident ID is required." };
  }

  if (!message || message.length < 3) {
    return { success: false, error: "Message must be at least 3 characters long." };
  }

  if (!["public", "internal"].includes(visibility)) {
    return { success: false, error: "Visibility must be 'public' or 'internal'." };
  }

  const supabase = createServerSupabaseClient();

  // If responder, verify they are assigned to this incident
  if (profile.role === "responder") {
    const { data: assignment } = await supabase
      .from("incident_assignments")
      .select("id")
      .eq("incident_id", incidentId)
      .eq("assigned_user_id", profile.id)
      .is("unassigned_at", null)
      .maybeSingle();

    if (!assignment) {
      return {
        success: false,
        error: "Forbidden: You may only post updates to incidents assigned to you.",
      };
    }
  }

  const { error: insertError } = await supabase.from("incident_updates").insert({
    incident_id: incidentId,
    author_id: profile.id,
    message,
    visibility,
  });

  if (insertError) {
    console.error("Error creating incident update:", insertError.message);
    return { success: false, error: insertError.message };
  }

  // Dispatch notification for new incident update
  await notifyIncidentUpdateAdded({
    incidentId,
    authorId: profile.id,
    message,
    visibility,
  });

  revalidatePath("/staff");
  revalidatePath(`/staff/incidents/${incidentId}`);
  if (visibility === "public") {
    revalidatePath(`/dashboard/reports/${incidentId}`);
  }

  return { success: true };
}

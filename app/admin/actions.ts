"use server";

import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import { getCurrentProfile } from "@/lib/data/profiles";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { createAuditLogEntry } from "@/lib/data/audit";
import {
  type UserRole,
  type IncidentStatus,
  type IncidentSeverity,
  FIELD_RESPONDERS,
  type FieldResponder,
  DISPATCH_INSTRUCTIONS,
  type DispatchInstruction,
  DISPATCH_VEHICLES,
  type DispatchVehicle,
} from "@/types";

export interface AdminActionResult {
  success: boolean;
  error?: string;
}

const VALID_ROLES: UserRole[] = ["resident", "responder", "dispatcher", "admin"];

/**
 * Updates a user's authorized role in Butuan Report.
 * - Requires caller to be an admin.
 * - Prevents an administrator from changing their own role (self-demotion protection).
 * - Records an immutable audit log entry.
 */
export async function updateUserRoleAction(formData: FormData): Promise<AdminActionResult> {
  let user = null;
  try {
    user = await currentUser();
  } catch {
    user = null;
  }
  if (!user && process.env.NODE_ENV === "production") {
    return { success: false, error: "Unauthorized: Please sign in." };
  }

  const currentProfile = await getCurrentProfile();
  if (!currentProfile || currentProfile.role !== "admin") {
    return { success: false, error: "Forbidden: Administrator credentials required." };
  }

  const targetUserId = (formData.get("user_id") as string)?.trim();
  const newRole = (formData.get("role") as string)?.trim() as UserRole;

  if (!targetUserId) {
    return { success: false, error: "Target user ID is required." };
  }

  if (!VALID_ROLES.includes(newRole)) {
    return { success: false, error: `Invalid role specified: "${newRole}".` };
  }

  // Security Rule: Prevent users from modifying their own role
  if (targetUserId === currentProfile.id) {
    return {
      success: false,
      error: "Security Policy: Administrators cannot modify their own role.",
    };
  }

  const supabase = createAdminSupabaseClient();

  // Fetch previous role for audit record
  const { data: targetProfile, error: fetchError } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", targetUserId)
    .single();

  if (fetchError || !targetProfile) {
    return { success: false, error: "Target profile not found." };
  }

  const previousRole = targetProfile.role;

  // Perform role update
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", targetUserId);

  if (updateError) {
    console.error("Error updating user role:", updateError.message);
    return { success: false, error: updateError.message };
  }

  // Record audit log
  await createAuditLogEntry({
    actor_id: currentProfile.id,
    action: "user_role_changed",
    entity_type: "profile",
    entity_id: targetUserId,
    metadata: {
      target_user_name: targetProfile.full_name,
      previous_role: previousRole,
      new_role: newRole,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/residents");
  revalidatePath("/admin/users");
  revalidatePath("/admin/audit-logs");
  revalidatePath("/staff");

  return { success: true };
}

/**
 * Creates a new municipal department.
 * Validates uniqueness of department name.
 */
export async function createDepartmentAction(formData: FormData): Promise<AdminActionResult> {
  const currentProfile = await getCurrentProfile();
  if (!currentProfile || currentProfile.role !== "admin") {
    return { success: false, error: "Forbidden: Administrator credentials required." };
  }

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;

  if (!name || name.length < 3) {
    return { success: false, error: "Department name must be at least 3 characters." };
  }

  const supabase = createAdminSupabaseClient();

  // Check for duplicate department name (case-insensitive)
  const { data: existingDept } = await supabase
    .from("departments")
    .select("id")
    .ilike("name", name)
    .maybeSingle();

  if (existingDept) {
    return { success: false, error: `A department named "${name}" already exists.` };
  }

  const { data: newDept, error } = await supabase
    .from("departments")
    .insert({
      name,
      description,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating department:", error.message);
    return { success: false, error: error.message };
  }

  await createAuditLogEntry({
    actor_id: currentProfile.id,
    action: "department_created",
    entity_type: "department",
    entity_id: newDept.id,
    metadata: { name, description },
  });

  revalidatePath("/admin/departments");
  revalidatePath("/admin/assignments");
  revalidatePath("/admin/audit-logs");
  revalidatePath("/staff");
  revalidatePath("/dispatcher");

  return { success: true };
}

/**
 * Updates an existing department's name and description.
 * Validates uniqueness of updated department name.
 */
export async function updateDepartmentAction(formData: FormData): Promise<AdminActionResult> {
  const currentProfile = await getCurrentProfile();
  if (!currentProfile || currentProfile.role !== "admin") {
    return { success: false, error: "Forbidden: Administrator credentials required." };
  }

  const id = (formData.get("department_id") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;

  if (!id) {
    return { success: false, error: "Department ID is required." };
  }

  if (!name || name.length < 3) {
    return { success: false, error: "Department name must be at least 3 characters." };
  }

  const supabase = createAdminSupabaseClient();

  // Check for duplicate department name under another record
  const { data: existingDept } = await supabase
    .from("departments")
    .select("id")
    .ilike("name", name)
    .neq("id", id)
    .maybeSingle();

  if (existingDept) {
    return { success: false, error: `Another department named "${name}" already exists.` };
  }

  const { error } = await supabase
    .from("departments")
    .update({ name, description })
    .eq("id", id);

  if (error) {
    console.error("Error updating department:", error.message);
    return { success: false, error: error.message };
  }

  await createAuditLogEntry({
    actor_id: currentProfile.id,
    action: "department_updated",
    entity_type: "department",
    entity_id: id,
    metadata: { name, description },
  });

  revalidatePath("/admin/departments");
  revalidatePath("/admin/assignments");
  revalidatePath("/admin/audit-logs");
  revalidatePath("/staff");
  revalidatePath("/dispatcher");

  return { success: true };
}

/**
 * Toggles a department's active status (activate / deactivate).
 */
export async function toggleDepartmentStatusAction(formData: FormData): Promise<AdminActionResult> {
  const currentProfile = await getCurrentProfile();
  if (!currentProfile || currentProfile.role !== "admin") {
    return { success: false, error: "Forbidden: Administrator credentials required." };
  }

  const id = (formData.get("department_id") as string)?.trim();
  const currentActive = formData.get("is_active") === "true";
  const nextActive = !currentActive;

  if (!id) {
    return { success: false, error: "Department ID is required." };
  }

  const supabase = createAdminSupabaseClient();

  const { error } = await supabase
    .from("departments")
    .update({ is_active: nextActive })
    .eq("id", id);

  if (error) {
    console.error("Error toggling department status:", error.message);
    return { success: false, error: error.message };
  }

  await createAuditLogEntry({
    actor_id: currentProfile.id,
    action: nextActive ? "department_activated" : "department_deactivated",
    entity_type: "department",
    entity_id: id,
    metadata: { is_active: nextActive },
  });

  revalidatePath("/admin/departments");
  revalidatePath("/admin/assignments");
  revalidatePath("/admin/audit-logs");
  revalidatePath("/staff");
  revalidatePath("/dispatcher");

  return { success: true };
}

/**
 * Creates a new incident category.
 * Validates uniqueness of category name.
 */
export async function createCategoryAction(formData: FormData): Promise<AdminActionResult> {
  const currentProfile = await getCurrentProfile();
  if (!currentProfile || currentProfile.role !== "admin") {
    return { success: false, error: "Forbidden: Administrator credentials required." };
  }

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;

  if (!name || name.length < 3) {
    return { success: false, error: "Category name must be at least 3 characters." };
  }

  const supabase = createAdminSupabaseClient();

  // Check for duplicate category name (case-insensitive)
  const { data: existingCat } = await supabase
    .from("incident_categories")
    .select("id")
    .ilike("name", name)
    .maybeSingle();

  if (existingCat) {
    return { success: false, error: `An incident category named "${name}" already exists.` };
  }

  const { data: newCat, error } = await supabase
    .from("incident_categories")
    .insert({
      name,
      description,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating category:", error.message);
    return { success: false, error: error.message };
  }

  await createAuditLogEntry({
    actor_id: currentProfile.id,
    action: "category_created",
    entity_type: "incident_category",
    entity_id: newCat.id,
    metadata: { name, description },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/admin/reports");
  revalidatePath("/admin/audit-logs");
  revalidatePath("/dashboard/new");
  revalidatePath("/dashboard/submit-report");
  revalidatePath("/dashboard/reports");
  revalidatePath("/dashboard/incident-map");

  return { success: true };
}

/**
 * Updates an existing incident category.
 * Validates uniqueness of updated category name.
 */
export async function updateCategoryAction(formData: FormData): Promise<AdminActionResult> {
  const currentProfile = await getCurrentProfile();
  if (!currentProfile || currentProfile.role !== "admin") {
    return { success: false, error: "Forbidden: Administrator credentials required." };
  }

  const id = (formData.get("category_id") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;

  if (!id) {
    return { success: false, error: "Category ID is required." };
  }

  if (!name || name.length < 3) {
    return { success: false, error: "Category name must be at least 3 characters." };
  }

  const supabase = createAdminSupabaseClient();

  // Check for duplicate category name under another record
  const { data: existingCat } = await supabase
    .from("incident_categories")
    .select("id")
    .ilike("name", name)
    .neq("id", id)
    .maybeSingle();

  if (existingCat) {
    return { success: false, error: `Another incident category named "${name}" already exists.` };
  }

  const { error } = await supabase
    .from("incident_categories")
    .update({ name, description })
    .eq("id", id);

  if (error) {
    console.error("Error updating category:", error.message);
    return { success: false, error: error.message };
  }

  await createAuditLogEntry({
    actor_id: currentProfile.id,
    action: "category_updated",
    entity_type: "incident_category",
    entity_id: id,
    metadata: { name, description },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/admin/reports");
  revalidatePath("/admin/audit-logs");
  revalidatePath("/dashboard/new");
  revalidatePath("/dashboard/submit-report");
  revalidatePath("/dashboard/reports");
  revalidatePath("/dashboard/incident-map");

  return { success: true };
}

/**
 * Toggles an incident category's active status.
 */
export async function toggleCategoryStatusAction(formData: FormData): Promise<AdminActionResult> {
  const currentProfile = await getCurrentProfile();
  if (!currentProfile || currentProfile.role !== "admin") {
    return { success: false, error: "Forbidden: Administrator credentials required." };
  }

  const id = (formData.get("category_id") as string)?.trim();
  const currentActive = formData.get("is_active") === "true";
  const nextActive = !currentActive;

  if (!id) {
    return { success: false, error: "Category ID is required." };
  }

  const supabase = createAdminSupabaseClient();

  const { error } = await supabase
    .from("incident_categories")
    .update({ is_active: nextActive })
    .eq("id", id);

  if (error) {
    console.error("Error toggling category status:", error.message);
    return { success: false, error: error.message };
  }

  await createAuditLogEntry({
    actor_id: currentProfile.id,
    action: nextActive ? "category_activated" : "category_deactivated",
    entity_type: "incident_category",
    entity_id: id,
    metadata: { is_active: nextActive },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/admin/reports");
  revalidatePath("/admin/audit-logs");
  revalidatePath("/dashboard/new");
  revalidatePath("/dashboard/submit-report");
  revalidatePath("/dashboard/reports");
  revalidatePath("/dashboard/incident-map");

  return { success: true };
}

/**
 * Deletes an attachment from an incident report.
 */
export async function deleteAdminAttachmentAction(formData: FormData): Promise<AdminActionResult> {
  const currentProfile = await getCurrentProfile();
  if (!currentProfile || currentProfile.role !== "admin") {
    return { success: false, error: "Forbidden: Administrator credentials required." };
  }

  const attachmentId = (formData.get("attachment_id") as string)?.trim();
  const incidentId = (formData.get("incident_id") as string)?.trim();

  if (!attachmentId) {
    return { success: false, error: "Attachment ID is required." };
  }

  const { deleteIncidentAttachment } = await import("@/lib/data/attachments");
  const result = await deleteIncidentAttachment(attachmentId);

  if (!result.success) {
    return { success: false, error: result.error || "Failed to delete attachment." };
  }

  if (incidentId) {
    revalidatePath(`/admin/reports/${incidentId}`);
    revalidatePath(`/dashboard/reports/${incidentId}`);
    revalidatePath(`/staff/incidents/${incidentId}`);
  }

  return { success: true };
}

/**
 * Fetches complete details for a single incident report for the Admin Drawer/Panel.
 * Includes signed attachment URLs, reporter info, category, location, and update timeline.
 */
export async function getAdminReportDetailsAction(incidentId: string) {
  const user = await currentUser();
  if (!user) {
    return { success: false, error: "Unauthorized: Please sign in." };
  }

  const currentProfile = await getCurrentProfile();
  if (!currentProfile || currentProfile.role !== "admin") {
    return { success: false, error: "Forbidden: Administrator credentials required." };
  }

  if (!incidentId) {
    return { success: false, error: "Incident ID is required." };
  }

  const { getStaffIncidentDetails } = await import("@/lib/data/staff");
  const incident = await getStaffIncidentDetails(incidentId, currentProfile);

  if (!incident) {
    return { success: false, error: "Incident record not found." };
  }

  return { success: true, incident };
}

/**
 * Fetches active departments and assignable staff members for admin assignment drawers and modals.
 */
export async function getAdminAssignmentOptionsAction(): Promise<{
  departments: import("@/types").Department[];
  staffMembers: import("@/lib/data/staff").AssignableStaffMember[];
}> {
  const { getActiveDepartments } = await import("@/lib/data/departments");
  const { getAssignableStaff } = await import("@/lib/data/staff");
  const [departments, staffMembers] = await Promise.all([
    getActiveDepartments(),
    getAssignableStaff(),
  ]);
  return { departments, staffMembers };
}

/**
 * Quick-action handler for Admin Drawer to update incident status and add admin remarks/resolution notes.
 */
export async function updateAdminReportQuickAction(params: {
  incidentId: string;
  status?: IncidentStatus;
  statusChangeNote?: string;
  adminRemarks?: string;
  isInternalNote?: boolean;
  markResolved?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  let user = null;
  try {
    user = await currentUser();
  } catch {
    user = null;
  }
  if (!user && process.env.NODE_ENV === "production") {
    return { success: false, error: "Unauthorized: Please sign in." };
  }

  const currentProfile = await getCurrentProfile();
  if (!currentProfile || currentProfile.role !== "admin") {
    return { success: false, error: "Forbidden: Administrator credentials required." };
  }

  const {
    incidentId,
    statusChangeNote,
    adminRemarks,
    isInternalNote = true,
    markResolved = false,
  } = params;
  let nextStatus = params.status;

  if (markResolved) {
    nextStatus = "resolved";
  }

  if (!incidentId) {
    return { success: false, error: "Incident ID is required." };
  }

  // Validate status change note length if provided
  if (statusChangeNote && statusChangeNote.trim().length > 2000) {
    return { success: false, error: "Status change note must not exceed 2000 characters." };
  }

  const supabase = createAdminSupabaseClient();

  // 1. Fetch current incident state
  const { data: currentIncident, error: fetchErr } = await supabase
    .from("incidents")
    .select("id, report_number, title, status, severity, barangay, reporter_id, resolved_at, closed_at")
    .eq("id", incidentId)
    .single();

  if (fetchErr || !currentIncident) {
    return { success: false, error: "Incident not found." };
  }

  const prevStatus = currentIncident.status as IncidentStatus;
  const now = new Date().toISOString();

  const isResolving = markResolved || nextStatus === "resolved";
  if (isResolving) {
    nextStatus = "closed";
  }

  const alreadyResolvedAndClosed =
    prevStatus === "closed" && Boolean(currentIncident.resolved_at);

  // 2. Status update if provided and different (prevent redundant updates on already resolved/closed reports)
  const shouldUpdateStatus =
    Boolean(nextStatus) &&
    (nextStatus !== prevStatus || (isResolving && !alreadyResolvedAndClosed));

  if (shouldUpdateStatus) {
    const updatePayload: {
      status: IncidentStatus;
      updated_at: string;
      resolved_at?: string | null;
      closed_at?: string | null;
    } = {
      status: nextStatus!,
      updated_at: now,
    };

    if (isResolving || nextStatus === "closed") {
      updatePayload.status = "closed";
      updatePayload.resolved_at = currentIncident.resolved_at || now;
      updatePayload.closed_at = now;
    } else if (["submitted", "under_review", "assigned", "in_progress"].includes(nextStatus!)) {
      if (prevStatus === "resolved" || prevStatus === "closed") {
        updatePayload.resolved_at = null;
        updatePayload.closed_at = null;
      }
    }

    const { error: statusErr } = await supabase
      .from("incidents")
      .update(updatePayload)
      .eq("id", incidentId);

    if (statusErr) {
      console.error("Error updating incident status:", statusErr.message);
      return { success: false, error: statusErr.message };
    }

    // Preserve resolution and closure events in audit logs
    if (isResolving) {
      // 1. Resolution event
      await createAuditLogEntry({
        actor_id: currentProfile.id,
        action: "incident_resolved",
        entity_type: "incident",
        entity_id: incidentId,
        metadata: {
          report_number: currentIncident.report_number,
          title: currentIncident.title,
          previous_status: prevStatus,
          new_status: "resolved",
          status_change_note: statusChangeNote?.trim() || null,
          actor_name: currentProfile.full_name,
        },
      });

      // 2. Closure event
      await createAuditLogEntry({
        actor_id: currentProfile.id,
        action: "incident_closed",
        entity_type: "incident",
        entity_id: incidentId,
        metadata: {
          report_number: currentIncident.report_number,
          title: currentIncident.title,
          previous_status: "resolved",
          new_status: "closed",
          auto_closed: true,
          status_change_note: statusChangeNote?.trim() || null,
          actor_name: currentProfile.full_name,
        },
      });
    } else {
      await createAuditLogEntry({
        actor_id: currentProfile.id,
        action: nextStatus === "closed" ? "incident_closed" : "incident_status_changed",
        entity_type: "incident",
        entity_id: incidentId,
        metadata: {
          report_number: currentIncident.report_number,
          title: currentIncident.title,
          previous_status: prevStatus,
          new_status: nextStatus,
          status_change_note: statusChangeNote?.trim() || null,
          actor_name: currentProfile.full_name,
        },
      });
    }

    const { notifyIncidentStatusChanged } = await import("@/lib/data/notifications");
    await notifyIncidentStatusChanged({
      incidentId,
      newStatus: "closed",
      actorId: currentProfile.id,
      note: adminRemarks?.trim() || undefined,
    });
  }

  // 3. Status Change Note: Record internal explanation note (strictly internal/staff-only)
  if (statusChangeNote && statusChangeNote.trim().length > 0) {
    const statusLabel = (nextStatus || prevStatus).toUpperCase().replace("_", " ");
    const noteMessage = `Status Change Note (${statusLabel}): ${statusChangeNote.trim()}`;

    const { error: scNoteErr } = await supabase.from("incident_updates").insert({
      incident_id: incidentId,
      author_id: currentProfile.id,
      message: noteMessage,
      visibility: "internal", // Strictly internal/staff-only
    });

    if (scNoteErr) {
      console.error("Error inserting status change note:", scNoteErr.message);
      return { success: false, error: scNoteErr.message };
    }

    await createAuditLogEntry({
      actor_id: currentProfile.id,
      action: "status_change_note_added",
      entity_type: "incident_update",
      entity_id: incidentId,
      metadata: {
        report_number: currentIncident.report_number,
        status: nextStatus || prevStatus,
        status_change_note: statusChangeNote.trim(),
        visibility: "internal",
      },
    });
  }

  // 4. Admin Remarks / Public Update insert if provided
  if (adminRemarks && adminRemarks.trim().length > 0) {
    const visibility = isInternalNote ? "internal" : "public";

    const { error: noteErr } = await supabase.from("incident_updates").insert({
      incident_id: incidentId,
      author_id: currentProfile.id,
      message: adminRemarks.trim(),
      visibility,
    });

    if (noteErr) {
      console.error("Error inserting admin remarks:", noteErr.message);
      return { success: false, error: noteErr.message };
    }

    await createAuditLogEntry({
      actor_id: currentProfile.id,
      action: "incident_update_posted",
      entity_type: "incident_update",
      entity_id: incidentId,
      metadata: {
        report_number: currentIncident.report_number,
        visibility,
        message: adminRemarks.trim(),
      },
    });

    if (visibility === "public") {
      const { notifyIncidentUpdateAdded } = await import("@/lib/data/notifications");
      await notifyIncidentUpdateAdded({
        incidentId,
        authorId: currentProfile.id,
        visibility: "public",
        message: adminRemarks.trim(),
      });
    }
  }

  // Display both resolution and closure milestones in report timeline for residents & staff
  if (isResolving && !alreadyResolvedAndClosed) {
    const resolutionMsg =
      adminRemarks && !isInternalNote
        ? `Incident marked as resolved: ${adminRemarks.trim()}`
        : "Incident marked as resolved by municipal authority.";

    const closureMsg =
      "Incident automatically closed following verified resolution.";

    await supabase.from("incident_updates").insert([
      {
        incident_id: incidentId,
        author_id: currentProfile.id,
        message: resolutionMsg,
        visibility: "public",
      },
      {
        incident_id: incidentId,
        author_id: currentProfile.id,
        message: closureMsg,
        visibility: "public",
      },
    ]);
  }

  try {
    revalidatePath("/admin");
    revalidatePath("/admin/reports");
    revalidatePath(`/admin/reports/${incidentId}`);
    revalidatePath("/admin/map");
    revalidatePath("/admin/assignments");
    revalidatePath("/admin/audit-logs");
    revalidatePath("/staff");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/my-reports");
    revalidatePath(`/dashboard/reports/${incidentId}`);
  } catch {
    // Next.js static generation store is not mounted during isolated tests
  }

  return { success: true };
}

/**
 * Assigns or reassigns an incident report to a department and/or field responder (Responder 1–5).
 * Enforces dropdown-only options for field responder and internal dispatch instruction.
 * Admin-only authority. Records audit log and sends notifications to assigned staff.
 */
export async function adminAssignIncidentAction(params: {
  incidentId: string;
  departmentId?: string | null;
  fieldResponder?: string | null;
  responderId?: string | null;
  dispatchInstruction?: string | null;
  dispatchVehicle?: string | null;
  vehicle?: string | null;
  assignmentNote?: string;
}): Promise<{ success: boolean; error?: string }> {
  let user = null;
  try {
    user = await currentUser();
  } catch {
    user = null;
  }
  if (!user && process.env.NODE_ENV === "production") {
    return { success: false, error: "Unauthorized: Please sign in." };
  }

  const currentProfile = await getCurrentProfile();
  if (!currentProfile || currentProfile.role !== "admin") {
    return { success: false, error: "Forbidden: Administrator credentials required." };
  }

  const {
    incidentId,
    departmentId = null,
    fieldResponder = null,
    responderId = null,
    dispatchInstruction = null,
    dispatchVehicle: directVehicle = null,
    vehicle = null,
    assignmentNote,
  } = params;

  const rawVehicle = directVehicle || vehicle || null;

  if (!incidentId) {
    return { success: false, error: "Incident ID is required." };
  }

  if (!departmentId && !fieldResponder && !responderId && !rawVehicle) {
    return { success: false, error: "Please select a responsible department, field responder, or dispatch vehicle." };
  }

  // Validate Field Responder: must be exactly one of FIELD_RESPONDERS (Responder 1–5) if provided
  if (fieldResponder) {
    if (!FIELD_RESPONDERS.includes(fieldResponder as FieldResponder)) {
      return {
        success: false,
        error: `Invalid field responder: "${fieldResponder}". Must select one of: ${FIELD_RESPONDERS.join(", ")}. Custom responder names are not permitted.`,
      };
    }
  }

  // Validate Dispatch Vehicle: must be exactly one of DISPATCH_VEHICLES (Vehicle 1–5) if provided
  let dispatchVehicle: DispatchVehicle | null = null;
  if (rawVehicle) {
    if (!DISPATCH_VEHICLES.includes(rawVehicle as DispatchVehicle)) {
      return {
        success: false,
        error: `Invalid dispatch vehicle: "${rawVehicle}". Must select one of: ${DISPATCH_VEHICLES.join(", ")}.`,
      };
    }
    dispatchVehicle = rawVehicle as DispatchVehicle;
  }

  // Validate Internal Dispatch Instruction: must be one of DISPATCH_INSTRUCTIONS if provided
  if (dispatchInstruction) {
    if (!DISPATCH_INSTRUCTIONS.includes(dispatchInstruction as DispatchInstruction)) {
      return {
        success: false,
        error: `Invalid internal dispatch instruction: "${dispatchInstruction}". Must select a valid predefined option.`,
      };
    }
  }

  const supabase = createAdminSupabaseClient();

  // 1. Fetch incident details
  const { data: incident, error: incError } = await supabase
    .from("incidents")
    .select("id, report_number, title, status")
    .eq("id", incidentId)
    .single();

  if (incError || !incident) {
    return { success: false, error: "Incident record not found." };
  }

  // 2. Validate department is active if provided
  let departmentName: string | null = null;
  if (departmentId) {
    const { data: dept, error: deptErr } = await supabase
      .from("departments")
      .select("id, name, is_active")
      .eq("id", departmentId)
      .single();

    if (deptErr || !dept || !dept.is_active) {
      return {
        success: false,
        error: "Selected department is inactive or invalid. Please select an active department.",
      };
    }
    departmentName = dept.name;
  }

  // 3. Validate responder profile if responderId (UUID) was provided for backwards compatibility
  let responderName: string | null = null;
  let effectiveDepartmentId = departmentId;

  if (responderId) {
    const { data: respProfile, error: respErr } = await supabase
      .from("profiles")
      .select("id, full_name, role, department_id")
      .eq("id", responderId)
      .single();

    if (
      !respErr &&
      respProfile &&
      ["responder", "dispatcher", "admin", "staff"].includes(respProfile.role)
    ) {
      responderName = respProfile.full_name;
      if (!effectiveDepartmentId && respProfile.department_id) {
        effectiveDepartmentId = respProfile.department_id;
        const { data: autoDept } = await supabase
          .from("departments")
          .select("name")
          .eq("id", effectiveDepartmentId)
          .maybeSingle();
        if (autoDept) {
          departmentName = autoDept.name;
        }
      }
    }
  }

  const now = new Date().toISOString();

  // 4. Mark previous active assignments as unassigned (preserve history)
  await supabase
    .from("incident_assignments")
    .update({ unassigned_at: now })
    .eq("incident_id", incidentId)
    .is("unassigned_at", null);

  // 5. Insert new assignment record (supporting field_responder, dispatch_vehicle & instruction columns)
  const insertPayload: import("@/types/database.types").TablesInsert<"incident_assignments"> = {
    incident_id: incidentId,
    department_id: effectiveDepartmentId,
    assigned_user_id: responderId || null,
    assigned_by: currentProfile.id,
    field_responder: fieldResponder || null,
    dispatch_vehicle: dispatchVehicle || null,
    instruction: dispatchInstruction || null,
  };

  let { error: assignError } = await supabase.from("incident_assignments").insert(insertPayload);

  // Graceful fallback if database migration has not been applied yet
  if (
    assignError &&
    (assignError.code === "42703" ||
      assignError.message?.includes("does not exist") ||
      assignError.message?.includes("schema cache") ||
      assignError.message?.includes("Could not find the 'field_responder'") ||
      assignError.message?.includes("Could not find the 'dispatch_vehicle'") ||
      assignError.message?.includes("Could not find"))
  ) {
    const fallbackPayload = {
      incident_id: incidentId,
      department_id: effectiveDepartmentId,
      assigned_user_id: responderId || null,
      assigned_by: currentProfile.id,
    };
    const retry = await supabase.from("incident_assignments").insert(fallbackPayload);
    if (retry.error) {
      console.error("Error inserting fallback assignment:", retry.error.message);
      return { success: false, error: retry.error.message };
    }
    assignError = null;
  } else if (assignError) {
    console.error("Error inserting assignment:", assignError.message);
    return { success: false, error: assignError.message };
  }

  // 6. Advance status to 'assigned' if currently 'submitted' or 'under_review'
  if (incident.status === "submitted" || incident.status === "under_review") {
    await supabase
      .from("incidents")
      .update({ status: "assigned", updated_at: now })
      .eq("id", incidentId);
  } else {
    await supabase
      .from("incidents")
      .update({ updated_at: now })
      .eq("id", incidentId);
  }

  // 7. Record Internal Dispatch Instruction & Responder Note (strictly internal/staff-only)
  const internalDetails: string[] = [];
  if (fieldResponder) {
    internalDetails.push(`Field Responder: ${fieldResponder}`);
  }
  if (dispatchVehicle) {
    internalDetails.push(`Dispatch Vehicle: ${dispatchVehicle}`);
  }
  if (dispatchInstruction) {
    internalDetails.push(`Dispatch Instruction: ${dispatchInstruction}`);
  }
  if (assignmentNote && assignmentNote.trim()) {
    internalDetails.push(`Remarks: ${assignmentNote.trim()}`);
  }

  if (internalDetails.length > 0) {
    await supabase.from("incident_updates").insert({
      incident_id: incidentId,
      author_id: currentProfile.id,
      message: internalDetails.join(" | "),
      visibility: "internal", // Strictly internal, invisible to residents
    });
  }

  // 8. Record audit log preserving complete assignment details
  await createAuditLogEntry({
    actor_id: currentProfile.id,
    action: "incident_assigned",
    entity_type: "incident",
    entity_id: incidentId,
    metadata: {
      report_number: incident.report_number,
      title: incident.title,
      department_id: effectiveDepartmentId,
      department_name: departmentName,
      assigned_user_id: responderId,
      assigned_user_name: responderName || fieldResponder || null,
      field_responder: fieldResponder || null,
      dispatch_vehicle: dispatchVehicle || null,
      dispatch_instruction: dispatchInstruction || null,
      assignment_note: assignmentNote?.trim() || null,
      actor_name: currentProfile.full_name,
    },
  });

  // 9. Notify assigned staff
  const { notifyIncidentAssigned } = await import("@/lib/data/notifications");
  await notifyIncidentAssigned({
    incidentId,
    departmentId: effectiveDepartmentId || undefined,
    assignedUserId: responderId || undefined,
    actorId: currentProfile.id,
  });

  try {
    revalidatePath("/admin");
    revalidatePath("/admin/assignments");
    revalidatePath("/admin/reports");
    revalidatePath(`/admin/reports/${incidentId}`);
    revalidatePath("/admin/audit-logs");
    revalidatePath("/staff");
    revalidatePath("/dispatcher");
    revalidatePath("/dashboard");
  } catch {
    // Graceful fallback for non-request environments
  }

  return { success: true };
}

/**
 * Unassigns an active assignment from an incident.
 * Preserves assignment history and records an audit log entry.
 */
export async function adminUnassignIncidentAction(params: {
  incidentId: string;
  reason?: string;
  revertStatus?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  let user = null;
  try {
    user = await currentUser();
  } catch {
    user = null;
  }
  if (!user && process.env.NODE_ENV === "production") {
    return { success: false, error: "Unauthorized: Please sign in." };
  }

  const currentProfile = await getCurrentProfile();
  if (!currentProfile || currentProfile.role !== "admin") {
    return { success: false, error: "Forbidden: Administrator credentials required." };
  }

  const { incidentId, reason, revertStatus = true } = params;

  if (!incidentId) {
    return { success: false, error: "Incident ID is required." };
  }

  const supabase = createAdminSupabaseClient();

  const { data: incident, error: incError } = await supabase
    .from("incidents")
    .select("id, report_number, title, status")
    .eq("id", incidentId)
    .single();

  if (incError || !incident) {
    return { success: false, error: "Incident record not found." };
  }

  const now = new Date().toISOString();

  // 1. Mark existing active assignment as unassigned
  const { error: unassignError } = await supabase
    .from("incident_assignments")
    .update({ unassigned_at: now })
    .eq("incident_id", incidentId)
    .is("unassigned_at", null);

  if (unassignError) {
    console.error("Error unassigning incident:", unassignError.message);
    return { success: false, error: unassignError.message };
  }

  // 2. If status was assigned, revert to under_review
  if (revertStatus && incident.status === "assigned") {
    await supabase
      .from("incidents")
      .update({ status: "under_review", updated_at: now })
      .eq("id", incidentId);
  }

  // 3. Record internal note
  if (reason && reason.trim()) {
    await supabase.from("incident_updates").insert({
      incident_id: incidentId,
      author_id: currentProfile.id,
      message: `Unassigned: ${reason.trim()}`,
      visibility: "internal",
    });
  }

  // 4. Record audit log
  await createAuditLogEntry({
    actor_id: currentProfile.id,
    action: "incident_unassigned",
    entity_type: "incident",
    entity_id: incidentId,
    metadata: {
      report_number: incident.report_number,
      title: incident.title,
      reason: reason?.trim() || "Unassigned by Administrator",
      actor_name: currentProfile.full_name,
    },
  });

  try {
    revalidatePath("/admin");
    revalidatePath("/admin/assignments");
    revalidatePath("/admin/reports");
    revalidatePath(`/admin/reports/${incidentId}`);
    revalidatePath("/admin/audit-logs");
    revalidatePath("/staff");
    revalidatePath("/dispatcher");
    revalidatePath("/dashboard");
  } catch {
    // Graceful fallback for non-request environments
  }

  return { success: true };
}

export interface AssignmentHistoryItem {
  id: string;
  department_id: string | null;
  assigned_user_id: string | null;
  assigned_at: string;
  unassigned_at: string | null;
  field_responder?: string | null;
  instruction?: string | null;
  department: { id: string; name: string } | null;
  assigned_user: { id: string; full_name: string; role: string; phone: string | null } | null;
  assigner: { id: string; full_name: string; role: string } | null;
}

/**
 * Fetches the complete assignment history for an incident report.
 */
export async function getIncidentAssignmentHistoryAction(
  incidentId: string
): Promise<{ success: boolean; assignments?: AssignmentHistoryItem[]; error?: string }> {
  let user = null;
  try {
    user = await currentUser();
  } catch {
    user = null;
  }
  if (!user && process.env.NODE_ENV === "production") {
    return { success: false, error: "Unauthorized: Please sign in." };
  }

  const currentProfile = await getCurrentProfile();
  if (!currentProfile || currentProfile.role !== "admin") {
    return { success: false, error: "Forbidden: Administrator credentials required." };
  }

  if (!incidentId) {
    return { success: false, error: "Incident ID is required." };
  }

  const supabase = createAdminSupabaseClient();

  let data: AssignmentHistoryItem[] | null = null;

  // Try selecting with field_responder and instruction
  const firstTry = await supabase
    .from("incident_assignments")
    .select(`
      id,
      department_id,
      assigned_user_id,
      assigned_at,
      unassigned_at,
      field_responder,
      instruction,
      department:departments(id, name),
      assigned_user:profiles!incident_assignments_assigned_user_id_fkey(id, full_name, role, phone),
      assigner:profiles!incident_assignments_assigned_by_fkey(id, full_name, role)
    `)
    .eq("incident_id", incidentId)
    .order("assigned_at", { ascending: false });

  if (!firstTry.error) {
    data = firstTry.data as unknown as AssignmentHistoryItem[];
  } else {
    // Fallback if columns do not exist yet on remote table
    const fallback = await supabase
      .from("incident_assignments")
      .select(`
        id,
        department_id,
        assigned_user_id,
        assigned_at,
        unassigned_at,
        department:departments(id, name),
        assigned_user:profiles!incident_assignments_assigned_user_id_fkey(id, full_name, role, phone),
        assigner:profiles!incident_assignments_assigned_by_fkey(id, full_name, role)
      `)
      .eq("incident_id", incidentId)
      .order("assigned_at", { ascending: false });

    if (fallback.error) {
      console.error("Error fetching incident assignment history:", fallback.error.message);
      return { success: false, error: fallback.error.message };
    }
    data = fallback.data as unknown as AssignmentHistoryItem[];
  }

  // Also query internal updates for fallback if field_responder / instruction were empty
  if (data && data.length > 0) {
    const { data: internalUpdates } = await supabase
      .from("incident_updates")
      .select("message, created_at")
      .eq("incident_id", incidentId)
      .eq("visibility", "internal")
      .order("created_at", { ascending: true });

    if (internalUpdates && internalUpdates.length > 0) {
      data = data.map((item) => {
        let field_responder = item.field_responder || null;
        let instruction = item.instruction || null;

        let targetUpdates = internalUpdates;
        if (item.unassigned_at === null) {
          targetUpdates = [...internalUpdates].reverse();
        } else if (item.assigned_at) {
          const aTime = new Date(item.assigned_at).getTime();
          targetUpdates = [...internalUpdates].sort((x, y) => {
            const diffX = Math.abs(new Date(x.created_at).getTime() - aTime);
            const diffY = Math.abs(new Date(y.created_at).getTime() - aTime);
            return diffX - diffY;
          });
        }

        if (!field_responder) {
          const match = targetUpdates
            .map((u: { message: string }) => u.message.match(/Field Responder:\s*(Responder [1-5])/i))
            .find(Boolean);
          if (match && match[1]) {
            field_responder = match[1];
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

        return {
          ...item,
          field_responder,
          instruction,
        };
      });
    }
  }

  return { success: true, assignments: (data as unknown as AssignmentHistoryItem[]) || [] };
}

export interface AdminResidentReportSummary {
  id: string;
  report_number: string;
  title: string;
  description: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  barangay: string;
  landmark: string | null;
  created_at: string;
  category: { id: string; name: string } | null;
}

export interface AdminResidentDetailsData {
  profile: {
    id: string;
    clerk_user_id: string;
    full_name: string;
    role: string;
    phone: string | null;
    barangay: string | null;
    created_at: string;
    updated_at: string;
  };
  stats: {
    totalReports: number;
    resolvedReports: number;
    pendingReports: number;
    inProgressReports: number;
    rejectedReports: number;
  };
  recentReports: AdminResidentReportSummary[];
}

/**
 * Fetches comprehensive details for a single resident profile.
 * Includes profile records, report count breakdown, and their submitted incident history.
 * Admin-only operation.
 */
export async function getAdminResidentDetailsAction(
  residentId: string
): Promise<{ success: boolean; data?: AdminResidentDetailsData; error?: string }> {
  const user = await currentUser();
  if (!user) {
    return { success: false, error: "Unauthorized: Please sign in." };
  }

  const currentProfile = await getCurrentProfile();
  if (!currentProfile || currentProfile.role !== "admin") {
    return { success: false, error: "Forbidden: Administrator credentials required." };
  }

  if (!residentId) {
    return { success: false, error: "Resident ID is required." };
  }

  const supabase = createAdminSupabaseClient();

  // 1. Fetch profile
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", residentId)
    .single();

  if (profileErr || !profile) {
    return { success: false, error: "Resident profile not found." };
  }

  // 2. Fetch all incidents by this reporter for count stats and recent reports
  const { data: incidents, error: incErr } = await supabase
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
      category:incident_categories(id, name)
    `)
    .eq("reporter_id", residentId)
    .order("created_at", { ascending: false });

  if (incErr) {
    console.error("Error fetching resident reports:", incErr.message);
    return { success: false, error: incErr.message };
  }

  const incidentList = (incidents as unknown as AdminResidentReportSummary[]) || [];

  const stats = {
    totalReports: incidentList.length,
    resolvedReports: incidentList.filter((i) => i.status === "resolved" || i.status === "closed").length,
    pendingReports: incidentList.filter((i) => i.status === "submitted" || i.status === "under_review").length,
    inProgressReports: incidentList.filter((i) => i.status === "assigned" || i.status === "in_progress").length,
    rejectedReports: incidentList.filter((i) => ["rejected", "duplicate", "cancelled"].includes(i.status)).length,
  };

  return {
    success: true,
    data: {
      profile,
      stats,
      recentReports: incidentList.slice(0, 15),
    },
  };
}


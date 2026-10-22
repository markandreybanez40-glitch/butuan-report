"use server";

import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import { getCurrentProfile } from "@/lib/data/profiles";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { createAuditLogEntry } from "@/lib/data/audit";
import {
  notifyIncidentStatusChanged,
  notifyIncidentAssigned,
  notifyIncidentUpdateAdded,
} from "@/lib/data/notifications";
import {
  FIELD_RESPONDERS,
  DISPATCH_INSTRUCTIONS,
  DISPATCH_VEHICLES,
  type IncidentStatus,
  type IncidentSeverity,
  type FieldResponder,
  type DispatchInstruction,
  type DispatchVehicle,
} from "@/types";

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

const TERMINAL_STATUSES: IncidentStatus[] = ["closed", "rejected", "duplicate", "cancelled"];

/**
 * Strict business rules for allowable status lifecycle progressions.
 * Prevents invalid status jumps (e.g. submitted directly to resolved/closed).
 */
const ALLOWED_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  submitted: ["under_review", "assigned", "in_progress", "rejected", "duplicate", "cancelled"],
  under_review: ["assigned", "in_progress", "rejected", "duplicate", "cancelled"],
  assigned: ["in_progress", "under_review", "resolved", "rejected", "duplicate", "cancelled"],
  in_progress: ["resolved", "under_review", "assigned", "rejected", "cancelled"],
  resolved: ["closed", "in_progress"],
  closed: ["in_progress"], // Reopen (Admin only)
  rejected: ["under_review"], // Appeal / Reopen (Admin only)
  duplicate: ["under_review"], // Reopen (Admin only)
  cancelled: ["under_review"], // Reopen (Admin only)
};

/**
 * Updates operational status of an incident.
 * - Enforces progression rules via ALLOWED_TRANSITIONS
 * - Requires public resolution updates when resolving
 * - Dispatcher / Admin: Can transition through the incident lifecycle
 * - Responder: Can only update incidents assigned to them (in_progress or resolved)
 * - Records immutable audit log entry
 * - Automatically dispatches real-time resident & staff notifications
 */
export async function updateStaffIncidentStatusAction(formData: FormData): Promise<StaffActionResult> {
  let user = null;
  try {
    user = await currentUser();
  } catch {
    user = null;
  }
  if (!user && process.env.NODE_ENV === "production") {
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

  const supabase = createAdminSupabaseClient();

  // Fetch current incident state to validate transition
  const { data: incident, error: fetchError } = await supabase
    .from("incidents")
    .select("id, report_number, title, status, severity, barangay, reporter_id, resolved_at, closed_at")
    .eq("id", incidentId)
    .single();

  if (fetchError || !incident) {
    return { success: false, error: "Incident record not found." };
  }

  const prevStatus = incident.status as IncidentStatus;

  // Prevent duplicate/redundant status transitions
  if (prevStatus === nextStatus) {
    return {
      success: false,
      error: `Incident is already marked as ${nextStatus.toUpperCase().replace("_", " ")}.`,
    };
  }

  // Enforce valid status progression lifecycle jumps
  const allowedNext = ALLOWED_TRANSITIONS[prevStatus];
  if (!allowedNext || !allowedNext.includes(nextStatus)) {
    return {
      success: false,
      error: `Invalid transition: Cannot transition report from ${prevStatus.toUpperCase().replace("_", " ")} directly to ${nextStatus.toUpperCase().replace("_", " ")}.`,
    };
  }

  // Responder authorization & transition rules
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

    if (!["in_progress", "resolved"].includes(nextStatus)) {
      return {
        success: false,
        error: "Forbidden: Responders may only update status to 'In Progress' or 'Resolved'.",
      };
    }
  }

  // Terminal status modification rule: Only Admin can reopen or modify terminal tickets
  if (TERMINAL_STATUSES.includes(prevStatus) && profile.role !== "admin") {
    return {
      success: false,
      error: `Forbidden: Incident is currently ${prevStatus.toUpperCase().replace("_", " ")}. Only an Administrator can reopen closed or archived reports.`,
    };
  }

  // Resolution Rule: Require a public update or explanatory note before resolving
  if (nextStatus === "resolved") {
    if (!note) {
      const { data: existingPublicUpdates } = await supabase
        .from("incident_updates")
        .select("id")
        .eq("incident_id", incidentId)
        .eq("visibility", "public")
        .limit(1);

      if (!existingPublicUpdates || existingPublicUpdates.length === 0) {
        return {
          success: false,
          error: "A public resolution note is required before marking this report resolved so the resident is informed of actions taken.",
        };
      }
    }
  }

  const now = new Date().toISOString();
  const isResolving = nextStatus === "resolved";
  const finalStatus: IncidentStatus = isResolving ? "closed" : nextStatus;

  const updatePayload: {
    status: IncidentStatus;
    updated_at: string;
    resolved_at?: string | null;
    closed_at?: string | null;
  } = {
    status: finalStatus,
    updated_at: now,
  };

  if (isResolving || nextStatus === "closed") {
    updatePayload.status = "closed";
    updatePayload.resolved_at = incident.resolved_at || now;
    updatePayload.closed_at = now;
  } else if (["submitted", "under_review", "assigned", "in_progress"].includes(nextStatus)) {
    // If reopening a previously resolved/closed report
    if (prevStatus === "resolved" || prevStatus === "closed") {
      updatePayload.resolved_at = null;
      updatePayload.closed_at = null;
    }
  }

  const { error: updateError } = await supabase
    .from("incidents")
    .update(updatePayload)
    .eq("id", incidentId);

  if (updateError) {
    console.error("Error updating incident status:", updateError.message);
    return { success: false, error: updateError.message };
  }

  // Preserve resolution and closure events in the timeline
  if (isResolving) {
    const resolutionMsg = note
      ? `Incident marked as resolved: ${note}`
      : "Incident marked as resolved by municipal authority.";
    const closureMsg =
      "Incident automatically closed following verified resolution.";

    await supabase.from("incident_updates").insert([
      {
        incident_id: incidentId,
        author_id: profile.id,
        message: resolutionMsg,
        visibility: "public",
      },
      {
        incident_id: incidentId,
        author_id: profile.id,
        message: closureMsg,
        visibility: "public",
      },
    ]);
  } else if (note) {
    // Keep status change note internal/staff-only unless explicitly requested as public
    const isPublic = formData.get("visibility") === "public";
    await supabase.from("incident_updates").insert({
      incident_id: incidentId,
      author_id: profile.id,
      message: `Status Change Note (${nextStatus.toUpperCase().replace("_", " ")}): ${note}`,
      visibility: isPublic ? "public" : "internal",
    });
  }

  // Record immutable audit logs preserving resolution and closure
  if (isResolving) {
    await createAuditLogEntry({
      actor_id: profile.id,
      action: "incident_resolved",
      entity_type: "incident",
      entity_id: incidentId,
      metadata: {
        report_number: incident.report_number,
        title: incident.title,
        previous_status: prevStatus,
        new_status: "resolved",
        note: note || null,
        actor_name: profile.full_name,
        actor_role: profile.role,
      },
    });

    await createAuditLogEntry({
      actor_id: profile.id,
      action: "incident_closed",
      entity_type: "incident",
      entity_id: incidentId,
      metadata: {
        report_number: incident.report_number,
        title: incident.title,
        previous_status: "resolved",
        new_status: "closed",
        auto_closed: true,
        note: note || null,
        actor_name: profile.full_name,
        actor_role: profile.role,
      },
    });
  } else {
    let auditAction = "incident_status_changed";
    if (nextStatus === "closed") auditAction = "incident_closed";

    await createAuditLogEntry({
      actor_id: profile.id,
      action: auditAction,
      entity_type: "incident",
      entity_id: incidentId,
      metadata: {
        report_number: incident.report_number,
        title: incident.title,
        previous_status: prevStatus,
        new_status: nextStatus,
        note: note || null,
        actor_name: profile.full_name,
        actor_role: profile.role,
      },
    });
  }

  // Dispatch status update notifications (single deduplicated notification for closed)
  await notifyIncidentStatusChanged({
    incidentId,
    newStatus: finalStatus,
    actorId: profile.id,
    note: note || undefined,
  });

  try {
    revalidatePath("/staff");
    revalidatePath("/staff/incidents");
    revalidatePath(`/staff/incidents/${incidentId}`);
    revalidatePath("/dispatcher");
    revalidatePath("/dispatcher/reports");
    revalidatePath(`/dispatcher/reports/${incidentId}`);
    revalidatePath("/dispatcher/assignments");
    revalidatePath("/admin");
    revalidatePath("/admin/reports");
    revalidatePath(`/admin/reports/${incidentId}`);
    revalidatePath("/admin/audit-logs");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/my-reports");
    revalidatePath(`/dashboard/reports/${incidentId}`);
  } catch {
    // Next.js static generation store is not mounted during isolated tests
  }

  return { success: true };
}

/**
 * Assigns or reassigns an incident to a department and/or responder.
 * Restricted to dispatchers and admins only.
 * - Validates that department is active
 * - Validates that assigned responder is an authorized staff member
 * - Records an immutable audit log entry
 * - Notifies the assigned responder and reporting resident
 */
export async function assignIncidentStaffAction(formData: FormData): Promise<StaffActionResult> {
  let user = null;
  try {
    user = await currentUser();
  } catch {
    user = null;
  }
  if (!user && process.env.NODE_ENV === "production") {
    return { success: false, error: "Unauthorized: Please sign in." };
  }

  const profile = await getCurrentProfile();
  if (!profile || !["dispatcher", "admin"].includes(profile.role)) {
    return { success: false, error: "Forbidden: Only dispatchers and admins can assign incidents." };
  }

  const incidentId = (formData.get("incident_id") as string)?.trim();
  const departmentId = (formData.get("department_id") as string)?.trim() || null;
  const responderId = (formData.get("assigned_user_id") as string)?.trim() || null;
  const rawFieldResponder = (formData.get("field_responder") as string)?.trim() || null;
  const rawVehicle = ((formData.get("dispatch_vehicle") as string) || (formData.get("vehicle") as string))?.trim() || null;
  const rawInstruction = ((formData.get("instruction") as string) || (formData.get("dispatch_instruction") as string))?.trim() || null;
  const assignmentNote = (formData.get("assignment_note") as string)?.trim();
  const skipStatusUpdate = formData.get("skip_status_update") === "true";

  if (!incidentId) {
    return { success: false, error: "Incident ID is required." };
  }

  // Validate Field Responder if provided (Must be Responder 1–5)
  let fieldResponder: FieldResponder | null = null;
  if (rawFieldResponder) {
    if (!FIELD_RESPONDERS.includes(rawFieldResponder as FieldResponder)) {
      return {
        success: false,
        error: `Invalid field responder "${rawFieldResponder}". Must be one of: ${FIELD_RESPONDERS.join(", ")}.`,
      };
    }
    fieldResponder = rawFieldResponder as FieldResponder;
  }

  // Validate Dispatch Vehicle if provided (Must be Vehicle 1–5)
  let dispatchVehicle: DispatchVehicle | null = null;
  if (rawVehicle) {
    if (!DISPATCH_VEHICLES.includes(rawVehicle as DispatchVehicle)) {
      return {
        success: false,
        error: `Invalid dispatch vehicle "${rawVehicle}". Must be one of: ${DISPATCH_VEHICLES.join(", ")}.`,
      };
    }
    dispatchVehicle = rawVehicle as DispatchVehicle;
  }

  // Validate Dispatch Instruction if provided (Must be one of the predefined options)
  let dispatchInstruction: DispatchInstruction | null = null;
  if (rawInstruction) {
    if (!DISPATCH_INSTRUCTIONS.includes(rawInstruction as DispatchInstruction)) {
      return {
        success: false,
        error: `Invalid dispatch instruction "${rawInstruction}". Must be a valid predefined option.`,
      };
    }
    dispatchInstruction = rawInstruction as DispatchInstruction;
  }

  if (!departmentId && !responderId && !fieldResponder && !dispatchVehicle) {
    return { success: false, error: "Please select a department, assigned responder, field responder, or dispatch vehicle." };
  }

  const supabase = createAdminSupabaseClient();

  // Fetch incident details for audit metadata & notifications
  const { data: incident, error: incError } = await supabase
    .from("incidents")
    .select("id, report_number, title, status, reporter_id")
    .eq("id", incidentId)
    .single();

  if (incError || !incident) {
    return { success: false, error: "Incident record not found." };
  }

  // Validate active department
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

  // Validate authorized responder profile
  let responderName: string | null = null;
  let effectiveDepartmentId = departmentId;

  if (responderId) {
    const { data: respProfile, error: respErr } = await supabase
      .from("profiles")
      .select("id, full_name, role, department_id")
      .eq("id", responderId)
      .single();

    if (
      respErr ||
      !respProfile ||
      !["responder", "dispatcher", "admin", "staff"].includes(respProfile.role)
    ) {
      return {
        success: false,
        error: "Selected user is not an authorized field responder or staff member.",
      };
    }
    responderName = respProfile.full_name;

    // Validate department binding: if both department and responder are given, ensure responder belongs to that department
    if (departmentId && respProfile.department_id && respProfile.department_id !== departmentId) {
      return {
        success: false,
        error: "Selected field responder is not assigned to the selected department.",
      };
    }

    // If department was not explicitly provided but responder belongs to a department, auto-associate
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

  const now = new Date().toISOString();

  // 1. Mark existing active assignments as unassigned
  await supabase
    .from("incident_assignments")
    .update({ unassigned_at: now })
    .eq("incident_id", incidentId)
    .is("unassigned_at", null);

  // 2. Insert new assignment (attempt with field_responder, dispatch_vehicle, and instruction)
  const fullAssignmentPayload = {
    incident_id: incidentId,
    department_id: effectiveDepartmentId,
    assigned_user_id: responderId,
    field_responder: fieldResponder,
    dispatch_vehicle: dispatchVehicle,
    instruction: dispatchInstruction,
    assigned_by: profile.id,
  };

  let assignError: { message: string } | null = null;
  const firstInsert = await supabase.from("incident_assignments").insert(fullAssignmentPayload);

  if (firstInsert.error) {
    if (
      firstInsert.error.code === "42703" ||
      firstInsert.error.message?.includes("does not exist") ||
      firstInsert.error.message?.includes("schema cache") ||
      firstInsert.error.message?.includes("Could not find the 'field_responder'") ||
      firstInsert.error.message?.includes("Could not find the 'dispatch_vehicle'") ||
      firstInsert.error.message?.includes("Could not find")
    ) {
      // Fallback if columns do not exist yet on remote table
      const fallbackInsert = await supabase.from("incident_assignments").insert({
        incident_id: incidentId,
        department_id: effectiveDepartmentId,
        assigned_user_id: responderId,
        assigned_by: profile.id,
      });
      assignError = fallbackInsert.error;
    } else {
      assignError = firstInsert.error;
    }
  }

  if (assignError) {
    console.error("Error creating incident assignment:", assignError.message);
    return { success: false, error: assignError.message };
  }

  // 3. Automatically advance status to 'assigned' if currently 'submitted' or 'under_review' (unless caller manages status explicitly)
  if (!skipStatusUpdate && (incident.status === "submitted" || incident.status === "under_review")) {
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

  // 4. Log internal dispatch update
  const internalDetails: string[] = [];
  if (fieldResponder) internalDetails.push(`Field Responder: ${fieldResponder}`);
  if (dispatchVehicle) internalDetails.push(`Dispatch Vehicle: ${dispatchVehicle}`);
  if (dispatchInstruction) internalDetails.push(`Dispatch Instruction: ${dispatchInstruction}`);
  if (assignmentNote) internalDetails.push(`Note: ${assignmentNote}`);

  if (internalDetails.length > 0) {
    await supabase.from("incident_updates").insert({
      incident_id: incidentId,
      author_id: profile.id,
      message: `Dispatch Assignment — ${internalDetails.join(" | ")}`,
      visibility: "internal",
    });
  }

  // 5. Record immutable audit log
  await createAuditLogEntry({
    actor_id: profile.id,
    action: "incident_assigned",
    entity_type: "incident",
    entity_id: incidentId,
    metadata: {
      report_number: incident.report_number,
      title: incident.title,
      department_id: departmentId,
      department_name: departmentName,
      assigned_user_id: responderId,
      assigned_user_name: responderName,
      field_responder: fieldResponder,
      dispatch_vehicle: dispatchVehicle,
      instruction: dispatchInstruction,
      note: assignmentNote || null,
      actor_name: profile.full_name,
      actor_role: profile.role,
    },
  });

  // 6. Dispatch assignment notifications to resident and assigned responder
  await notifyIncidentAssigned({
    incidentId,
    assignedUserId: responderId,
    departmentId,
    actorId: profile.id,
    note: assignmentNote || undefined,
  });

  try {
    revalidatePath("/staff");
    revalidatePath("/staff/incidents");
    revalidatePath(`/staff/incidents/${incidentId}`);
    revalidatePath("/dispatcher");
    revalidatePath("/dispatcher/reports");
    revalidatePath(`/dispatcher/reports/${incidentId}`);
    revalidatePath("/dispatcher/assignments");
    revalidatePath("/admin");
    revalidatePath("/admin/reports");
    revalidatePath(`/admin/reports/${incidentId}`);
    revalidatePath("/admin/audit-logs");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/my-reports");
    revalidatePath(`/dashboard/reports/${incidentId}`);
  } catch {
    // Next.js static generation store is not mounted during isolated tests
  }

  return { success: true };
}

/**
 * Adds a new timeline update or internal note to an incident.
 * - Public updates are visible to citizens and staff.
 * - Internal notes are strictly restricted to staff and never visible to residents.
 * - Records audit entry for update actions.
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

  const supabase = createAdminSupabaseClient();

  const { data: incident, error: incError } = await supabase
    .from("incidents")
    .select("id, report_number, title")
    .eq("id", incidentId)
    .single();

  if (incError || !incident) {
    return { success: false, error: "Incident record not found." };
  }

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

  // Update incident's updated_at timestamp
  await supabase
    .from("incidents")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", incidentId);

  // Record audit log for update
  await createAuditLogEntry({
    actor_id: profile.id,
    action: visibility === "public" ? "incident_public_update_posted" : "incident_internal_note_posted",
    entity_type: "incident",
    entity_id: incidentId,
    metadata: {
      report_number: incident.report_number,
      title: incident.title,
      visibility,
      snippet: message.length > 80 ? `${message.substring(0, 80)}...` : message,
      author_name: profile.full_name,
      author_role: profile.role,
    },
  });

  // Dispatch notification for new incident update (public updates notify citizen)
  await notifyIncidentUpdateAdded({
    incidentId,
    authorId: profile.id,
    message,
    visibility,
  });

  try {
    revalidatePath("/staff");
    revalidatePath(`/staff/incidents/${incidentId}`);
    revalidatePath("/dispatcher");
    revalidatePath("/dispatcher/reports");
    revalidatePath(`/dispatcher/reports/${incidentId}`);
    revalidatePath("/admin");
    revalidatePath(`/admin/reports/${incidentId}`);
    revalidatePath("/admin/audit-logs");
    if (visibility === "public") {
      revalidatePath(`/dashboard/reports/${incidentId}`);
    }
  } catch {
    // Next.js static generation store is not mounted during isolated tests
  }

  return { success: true };
}

/**
 * Updates the severity/priority level of an incident.
 * Restricted to dispatchers and admins.
 * Records an immutable audit log entry.
 */
export async function updateIncidentSeverityAction(formData: FormData): Promise<StaffActionResult> {
  const user = await currentUser();
  if (!user) {
    return { success: false, error: "Unauthorized: Please sign in." };
  }

  const profile = await getCurrentProfile();
  if (!profile || !["dispatcher", "admin"].includes(profile.role)) {
    return { success: false, error: "Forbidden: Administrator or Dispatcher credentials required." };
  }

  const incidentId = (formData.get("incident_id") as string)?.trim();
  const severity = (formData.get("severity") as string)?.trim() as IncidentSeverity;

  if (!incidentId) {
    return { success: false, error: "Incident ID is required." };
  }

  if (!severity || !["low", "medium", "high", "critical"].includes(severity)) {
    return { success: false, error: `Invalid severity level: "${severity}".` };
  }

  const supabase = createAdminSupabaseClient();

  const { data: incident, error: incError } = await supabase
    .from("incidents")
    .select("id, report_number, title, severity")
    .eq("id", incidentId)
    .single();

  if (incError || !incident) {
    return { success: false, error: "Incident record not found." };
  }

  if (incident.severity === severity) {
    return { success: false, error: `Incident is already calibrated at ${severity.toUpperCase()} priority.` };
  }

  const prevSeverity = incident.severity;

  const { error: updateError } = await supabase
    .from("incidents")
    .update({ severity, updated_at: new Date().toISOString() })
    .eq("id", incidentId);

  if (updateError) {
    console.error("Error updating incident severity:", updateError.message);
    return { success: false, error: updateError.message };
  }

  // Record audit log
  await createAuditLogEntry({
    actor_id: profile.id,
    action: "incident_severity_updated",
    entity_type: "incident",
    entity_id: incidentId,
    metadata: {
      report_number: incident.report_number,
      title: incident.title,
      previous_severity: prevSeverity,
      new_severity: severity,
      actor_name: profile.full_name,
      actor_role: profile.role,
    },
  });

  try {
    revalidatePath("/admin");
    revalidatePath("/admin/reports");
    revalidatePath(`/admin/reports/${incidentId}`);
    revalidatePath("/admin/audit-logs");
    revalidatePath("/dispatcher");
    revalidatePath("/dispatcher/reports");
    revalidatePath(`/dispatcher/reports/${incidentId}`);
    revalidatePath("/staff");
    revalidatePath("/staff/incidents");
    revalidatePath(`/staff/incidents/${incidentId}`);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/my-reports");
    revalidatePath(`/dashboard/reports/${incidentId}`);
  } catch {
    // Next.js static generation store is not mounted during isolated tests
  }

  return { success: true };
}


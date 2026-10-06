import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profiles";
import type { Notification, NotificationInsert, IncidentStatus } from "@/types";

/**
 * Server data-access layer for notifications.
 * RLS restricts queries to notifications owned by the authenticated profile.
 */

export async function getMyNotifications(options?: number | {
  limit?: number;
  unreadOnly?: boolean;
}): Promise<Notification[]> {
  const limit = typeof options === "number" ? options : options?.limit;
  const unreadOnly = typeof options === "object" ? options?.unreadOnly : false;

  const supabase = createServerSupabaseClient();
  let query = supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false });

  if (unreadOnly) {
    query = query.is("read_at", null);
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching notifications:", error.message);
    return [];
  }

  return data ?? [];
}

export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = createServerSupabaseClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .is("read_at", null);

  if (error) {
    console.error("Error counting unread notifications:", error.message);
    return 0;
  }

  return count ?? 0;
}

export async function markNotificationAsRead(id: string): Promise<boolean> {
  const profile = await getCurrentProfile();
  if (!profile) return false;

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", profile.id);

  if (error) {
    console.error("Error marking notification read:", error.message);
    return false;
  }

  return true;
}

export async function markAllNotificationsAsRead(): Promise<boolean> {
  const profile = await getCurrentProfile();
  if (!profile) return false;

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", profile.id)
    .is("read_at", null);

  if (error) {
    console.error("Error marking all notifications read:", error.message);
    return false;
  }

  return true;
}

export async function deleteNotification(id: string): Promise<boolean> {
  const profile = await getCurrentProfile();
  if (!profile) return false;

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", id)
    .eq("user_id", profile.id);

  if (error) {
    console.error("Error deleting notification:", error.message);
    return false;
  }

  return true;
}

/**
 * Trusted server-side notification creation dispatches.
 */

function formatStatus(status: string): string {
  return status.toUpperCase().replace(/_/g, " ");
}

export async function notifyIncidentSubmitted(incident: {
  id: string;
  report_number: string;
  title: string;
  barangay: string;
  reporter_id: string;
}): Promise<void> {
  try {
    const adminClient = createAdminSupabaseClient();

    // 1. Notify Resident (Reporter)
    if (incident.reporter_id) {
      await adminClient.from("notifications").insert({
        user_id: incident.reporter_id,
        type: "report_submitted",
        title: "Report Submitted",
        message: `Your report #${incident.report_number} ("${incident.title}") has been successfully submitted and queued for review.`,
        related_incident_id: incident.id,
      });
    }

    // 2. Notify Staff (Dispatchers, Responders, Admins)
    const { data: staffProfiles } = await adminClient
      .from("profiles")
      .select("id")
      .in("role", ["dispatcher", "responder", "admin"]);

    if (staffProfiles && staffProfiles.length > 0) {
      const staffNotifications: NotificationInsert[] = staffProfiles.map((staff) => ({
        user_id: staff.id,
        type: "new_incident",
        title: "New Incident Reported",
        message: `New incident #${incident.report_number} ("${incident.title}") reported in Barangay ${incident.barangay}.`,
        related_incident_id: incident.id,
      }));

      await adminClient.from("notifications").insert(staffNotifications);
    }
  } catch (err) {
    console.error("Failed to send incident submission notifications:", err);
  }
}

export async function notifyIncidentStatusChanged(params: {
  incidentId: string;
  newStatus: IncidentStatus;
  actorId: string;
  note?: string;
}): Promise<void> {
  try {
    const adminClient = createAdminSupabaseClient();

    const { data: incident } = await adminClient
      .from("incidents")
      .select("id, report_number, title, reporter_id")
      .eq("id", params.incidentId)
      .single();

    if (!incident) return;

    let resTitle = "Report Status Updated";
    let resMsg = `Your report #${incident.report_number} ("${incident.title}") status changed to ${formatStatus(params.newStatus)}.`;
    let type = "status_changed";

    if (params.newStatus === "resolved") {
      resTitle = "Report Resolved";
      resMsg = `Your report #${incident.report_number} ("${incident.title}") has been marked as resolved.`;
      type = "report_resolved";
    } else if (params.newStatus === "closed") {
      resTitle = "Report Closed";
      resMsg = `Your report #${incident.report_number} ("${incident.title}") has been closed.`;
      type = "report_closed";
    }

    // 1. Notify Resident (Reporter)
    if (incident.reporter_id && incident.reporter_id !== params.actorId) {
      await adminClient.from("notifications").insert({
        user_id: incident.reporter_id,
        type,
        title: resTitle,
        message: resMsg,
        related_incident_id: incident.id,
      });
    }

    // 2. Notify Assigned Staff (excluding actor)
    const { data: assignments } = await adminClient
      .from("incident_assignments")
      .select("assigned_user_id")
      .eq("incident_id", params.incidentId)
      .is("unassigned_at", null);

    if (assignments && assignments.length > 0) {
      const staffIds = Array.from(
        new Set(
          assignments
            .map((a) => a.assigned_user_id)
            .filter((id): id is string => Boolean(id) && id !== params.actorId && id !== incident.reporter_id)
        )
      );

      if (staffIds.length > 0) {
        const staffNotifications: NotificationInsert[] = staffIds.map((userId) => ({
          user_id: userId,
          type: "workflow_changed",
          title: "Incident Workflow Updated",
          message: `Incident #${incident.report_number} ("${incident.title}") status set to ${formatStatus(params.newStatus)}.`,
          related_incident_id: incident.id,
        }));
        await adminClient.from("notifications").insert(staffNotifications);
      }
    }
  } catch (err) {
    console.error("Failed to send status update notifications:", err);
  }
}

export async function notifyIncidentAssigned(params: {
  incidentId: string;
  assignedUserId?: string | null;
  departmentId?: string | null;
  actorId: string;
  note?: string;
}): Promise<void> {
  try {
    const adminClient = createAdminSupabaseClient();

    const { data: incident } = await adminClient
      .from("incidents")
      .select("id, report_number, title, reporter_id")
      .eq("id", params.incidentId)
      .single();

    if (!incident) return;

    // 1. Notify Resident (Reporter)
    if (incident.reporter_id && incident.reporter_id !== params.actorId) {
      await adminClient.from("notifications").insert({
        user_id: incident.reporter_id,
        type: "report_assigned",
        title: "Report Assigned",
        message: `Your report #${incident.report_number} ("${incident.title}") has been assigned for resolution.`,
        related_incident_id: incident.id,
      });
    }

    // 2. Notify Assigned User (if specified and not the actor)
    if (params.assignedUserId && params.assignedUserId !== params.actorId) {
      await adminClient.from("notifications").insert({
        user_id: params.assignedUserId,
        type: "incident_assigned_staff",
        title: "Incident Assigned to You",
        message: `You have been assigned to incident #${incident.report_number} ("${incident.title}").`,
        related_incident_id: incident.id,
      });
    }
  } catch (err) {
    console.error("Failed to send incident assignment notifications:", err);
  }
}

export async function notifyIncidentUpdateAdded(params: {
  incidentId: string;
  authorId: string;
  message: string;
  visibility: "public" | "internal";
}): Promise<void> {
  try {
    const adminClient = createAdminSupabaseClient();

    const { data: incident } = await adminClient
      .from("incidents")
      .select("id, report_number, title, reporter_id")
      .eq("id", params.incidentId)
      .single();

    if (!incident) return;

    const snippet =
      params.message.length > 80 ? `${params.message.substring(0, 80)}...` : params.message;

    // 1. If public update, notify resident (reporter)
    if (
      params.visibility === "public" &&
      incident.reporter_id &&
      incident.reporter_id !== params.authorId
    ) {
      await adminClient.from("notifications").insert({
        user_id: incident.reporter_id,
        type: "public_update",
        title: "New Official Update",
        message: `New update on report #${incident.report_number}: "${snippet}"`,
        related_incident_id: incident.id,
      });
    }

    // 2. Notify assigned staff (excluding author)
    const { data: assignments } = await adminClient
      .from("incident_assignments")
      .select("assigned_user_id")
      .eq("incident_id", params.incidentId)
      .is("unassigned_at", null);

    if (assignments && assignments.length > 0) {
      const staffIds = Array.from(
        new Set(
          assignments
            .map((a) => a.assigned_user_id)
            .filter(
              (id): id is string =>
                Boolean(id) && id !== params.authorId && id !== incident.reporter_id
            )
        )
      );

      if (staffIds.length > 0) {
        const staffNotifications: NotificationInsert[] = staffIds.map((userId) => ({
          user_id: userId,
          type: "incident_updated",
          title: "Incident Updated",
          message: `Incident #${incident.report_number} update: "${snippet}"`,
          related_incident_id: incident.id,
        }));
        await adminClient.from("notifications").insert(staffNotifications);
      }
    }
  } catch (err) {
    console.error("Failed to send incident update notifications:", err);
  }
}

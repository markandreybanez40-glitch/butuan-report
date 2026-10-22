import { createAdminSupabaseClient } from "@/lib/supabase/server";
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
  const profile = await getCurrentProfile();
  if (!profile) return [];

  const limit = typeof options === "number" ? options : options?.limit;
  const unreadOnly = typeof options === "object" ? options?.unreadOnly : false;

  const supabase = createAdminSupabaseClient();
  let query = supabase
    .from("notifications")
    .select("*")
    .eq("user_id", profile.id)
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
  const profile = await getCurrentProfile();
  if (!profile) return 0;

  const supabase = createAdminSupabaseClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", profile.id)
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

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", profile.id)
    .select("id");

  if (error) {
    console.error("Error marking notification read:", error.message);
    return false;
  }

  return (data && data.length > 0) ? true : false;
}

export async function markAllNotificationsAsRead(): Promise<boolean> {
  const profile = await getCurrentProfile();
  if (!profile) return false;

  const supabase = createAdminSupabaseClient();
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

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", id)
    .eq("user_id", profile.id)
    .select("id");

  if (error) {
    console.error("Error deleting notification:", error.message);
    return false;
  }

  return (data && data.length > 0) ? true : false;
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

    // 1. Notify Resident (Reporter) with deduplication
    if (incident.reporter_id) {
      const { data: existingNotif } = await adminClient
        .from("notifications")
        .select("id")
        .eq("user_id", incident.reporter_id)
        .eq("related_incident_id", incident.id)
        .eq("type", "report_submitted")
        .maybeSingle();

      if (!existingNotif) {
        await adminClient.from("notifications").insert({
          user_id: incident.reporter_id,
          type: "report_submitted",
          title: "Report Submitted",
          message: `Your report #${incident.report_number} ("${incident.title}") has been successfully submitted and queued for review.`,
          related_incident_id: incident.id,
        });
      }
    }

    // 2. Notify Staff (Dispatchers, Responders, Admins) with deduplication
    const { data: staffProfiles } = await adminClient
      .from("profiles")
      .select("id")
      .in("role", ["dispatcher", "responder", "admin"]);

    if (staffProfiles && staffProfiles.length > 0) {
      const { data: existingStaffNotifs } = await adminClient
        .from("notifications")
        .select("user_id")
        .eq("related_incident_id", incident.id)
        .eq("type", "new_incident");

      const alreadyNotifiedStaff = new Set(existingStaffNotifs?.map((n) => n.user_id) || []);
      const newStaff = staffProfiles.filter((s) => !alreadyNotifiedStaff.has(s.id));

      if (newStaff.length > 0) {
        const staffNotifications: NotificationInsert[] = newStaff.map((staff) => ({
          user_id: staff.id,
          type: "new_incident",
          title: "New Incident Reported",
          message: `New incident #${incident.report_number} ("${incident.title}") reported in Barangay ${incident.barangay}.`,
          related_incident_id: incident.id,
        }));

        await adminClient.from("notifications").insert(staffNotifications);
      }
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
      resMsg = `Your report #${incident.report_number} ("${incident.title}") has been marked as resolved and closed.`;
      type = "report_resolved";
    } else if (params.newStatus === "closed") {
      resTitle = "Report Resolved & Closed";
      resMsg = `Your report #${incident.report_number} ("${incident.title}") has been resolved and officially closed.`;
      type = "report_closed";
    }

    // 1. Notify Resident (Reporter) with deduplication
    if (incident.reporter_id && incident.reporter_id !== params.actorId) {
      const isTerminal = params.newStatus === "resolved" || params.newStatus === "closed";
      let dedupQuery = adminClient
        .from("notifications")
        .select("id")
        .eq("user_id", incident.reporter_id)
        .eq("related_incident_id", incident.id);

      if (isTerminal) {
        dedupQuery = dedupQuery.in("type", ["report_resolved", "report_closed"]);
      } else {
        dedupQuery = dedupQuery
          .eq("type", type)
          .ilike("message", `%${formatStatus(params.newStatus)}%`);
      }

      const { data: existingStatusNotif } = await dedupQuery.maybeSingle();

      if (!existingStatusNotif) {
        await adminClient.from("notifications").insert({
          user_id: incident.reporter_id,
          type,
          title: resTitle,
          message: resMsg,
          related_incident_id: incident.id,
        });
      }
    }

    // 2. Notify Assigned Staff (excluding actor) with deduplication
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
        const { data: existingStaffNotifs } = await adminClient
          .from("notifications")
          .select("user_id")
          .eq("related_incident_id", incident.id)
          .eq("type", "workflow_changed")
          .ilike("message", `%${formatStatus(params.newStatus)}%`);

        const alreadyNotified = new Set(existingStaffNotifs?.map((n) => n.user_id) || []);
        const toNotify = staffIds.filter((id) => !alreadyNotified.has(id));

        if (toNotify.length > 0) {
          const staffNotifications: NotificationInsert[] = toNotify.map((userId) => ({
            user_id: userId,
            type: "workflow_changed",
            title: "Incident Workflow Updated",
            message: `Incident #${incident.report_number} ("${incident.title}") status set to ${formatStatus(params.newStatus)}.`,
            related_incident_id: incident.id,
          }));
          await adminClient.from("notifications").insert(staffNotifications);
        }
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

    // 1. Notify Resident (Reporter) with deduplication
    if (incident.reporter_id && incident.reporter_id !== params.actorId) {
      const { data: existingAssignNotif } = await adminClient
        .from("notifications")
        .select("id")
        .eq("user_id", incident.reporter_id)
        .eq("related_incident_id", incident.id)
        .eq("type", "report_assigned")
        .maybeSingle();

      if (!existingAssignNotif) {
        await adminClient.from("notifications").insert({
          user_id: incident.reporter_id,
          type: "report_assigned",
          title: "Report Assigned",
          message: `Your report #${incident.report_number} ("${incident.title}") has been assigned for resolution.`,
          related_incident_id: incident.id,
        });
      }
    }

    // 2. Notify Assigned User (if specified and not the actor) with deduplication
    if (params.assignedUserId && params.assignedUserId !== params.actorId) {
      const { data: existingStaffNotif } = await adminClient
        .from("notifications")
        .select("id")
        .eq("user_id", params.assignedUserId)
        .eq("related_incident_id", incident.id)
        .eq("type", "incident_assigned_staff")
        .maybeSingle();

      if (!existingStaffNotif) {
        await adminClient.from("notifications").insert({
          user_id: params.assignedUserId,
          type: "incident_assigned_staff",
          title: "Incident Assigned to You",
          message: `You have been assigned to incident #${incident.report_number} ("${incident.title}").`,
          related_incident_id: incident.id,
        });
      }
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

    // 1. If public update, notify resident (reporter) with deduplication
    if (
      params.visibility === "public" &&
      incident.reporter_id &&
      incident.reporter_id !== params.authorId
    ) {
      const { data: existingUpdateNotif } = await adminClient
        .from("notifications")
        .select("id")
        .eq("user_id", incident.reporter_id)
        .eq("related_incident_id", incident.id)
        .eq("type", "public_update")
        .eq("message", `New update on report #${incident.report_number}: "${snippet}"`)
        .maybeSingle();

      if (!existingUpdateNotif) {
        await adminClient.from("notifications").insert({
          user_id: incident.reporter_id,
          type: "public_update",
          title: "New Official Update",
          message: `New update on report #${incident.report_number}: "${snippet}"`,
          related_incident_id: incident.id,
        });
      }
    }

    // 2. Notify assigned staff (excluding author) with deduplication
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
        const { data: existingStaffNotifs } = await adminClient
          .from("notifications")
          .select("user_id")
          .eq("related_incident_id", incident.id)
          .eq("type", "incident_updated")
          .eq("message", `Incident #${incident.report_number} update: "${snippet}"`);

        const alreadyNotifiedStaff = new Set(existingStaffNotifs?.map((n) => n.user_id) || []);
        const toNotifyStaff = staffIds.filter((id) => !alreadyNotifiedStaff.has(id));

        if (toNotifyStaff.length > 0) {
          const staffNotifications: NotificationInsert[] = toNotifyStaff.map((userId) => ({
            user_id: userId,
            type: "incident_updated",
            title: "Incident Updated",
            message: `Incident #${incident.report_number} update: "${snippet}"`,
            related_incident_id: incident.id,
          }));
          await adminClient.from("notifications").insert(staffNotifications);
        }
      }
    }
  } catch (err) {
    console.error("Failed to send incident update notifications:", err);
  }
}

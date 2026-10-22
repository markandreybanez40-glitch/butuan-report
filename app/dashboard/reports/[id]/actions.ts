"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/data/profiles";
import { deleteIncidentAttachment } from "@/lib/data/attachments";

export interface ResidentActionResult {
  success: boolean;
  error?: string;
}

/**
 * Allows a resident to delete their own attachment if the report has not yet been resolved or closed.
 */
export async function deleteResidentAttachmentAction(formData: FormData): Promise<ResidentActionResult> {
  const currentProfile = await getCurrentProfile();
  if (!currentProfile) {
    return { success: false, error: "Unauthorized: Please sign in." };
  }

  const attachmentId = (formData.get("attachment_id") as string)?.trim();
  const incidentId = (formData.get("incident_id") as string)?.trim();

  if (!attachmentId) {
    return { success: false, error: "Attachment ID is required." };
  }

  const result = await deleteIncidentAttachment(attachmentId);

  if (!result.success) {
    return { success: false, error: result.error || "Failed to remove attachment." };
  }

  if (incidentId) {
    revalidatePath(`/dashboard/reports/${incidentId}`);
    revalidatePath(`/admin/reports/${incidentId}`);
    revalidatePath(`/staff/incidents/${incidentId}`);
  }

  return { success: true };
}

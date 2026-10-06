"use server";

import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import { createResidentIncident } from "@/lib/data/incidents";
import { notifyIncidentSubmitted } from "@/lib/data/notifications";
import {
  uploadIncidentAttachment,
  MAX_FILES_PER_REPORT,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_MIME_TYPES,
} from "@/lib/data/attachments";

export interface SubmitReportResult {
  success: boolean;
  error?: string;
  incidentId?: string;
  reportNumber?: string;
}

export async function submitIncidentAction(
  prevState: SubmitReportResult | null,
  formData: FormData
): Promise<SubmitReportResult> {
  const user = await currentUser();
  if (!user) {
    return { success: false, error: "Unauthorized: Please sign in to submit a report." };
  }

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const category_id = (formData.get("category_id") as string)?.trim();
  const severityRaw = formData.get("severity") as string;
  const severity = (["low", "medium", "high", "critical"].includes(severityRaw)
    ? severityRaw
    : "medium") as "low" | "medium" | "high" | "critical";
  const barangay = (formData.get("barangay") as string)?.trim();
  const street_area = (formData.get("street_area") as string)?.trim() || null;
  const landmark = (formData.get("landmark") as string)?.trim() || null;
  const latRaw = formData.get("latitude") as string;
  const lngRaw = formData.get("longitude") as string;

  const latitude = latRaw && !isNaN(parseFloat(latRaw)) ? parseFloat(latRaw) : null;
  const longitude = lngRaw && !isNaN(parseFloat(lngRaw)) ? parseFloat(lngRaw) : null;

  // Validation
  if (!category_id) {
    return { success: false, error: "Please select an incident category." };
  }

  if (!title || title.length < 5) {
    return { success: false, error: "Please enter a descriptive incident title (at least 5 characters)." };
  }

  if (title.length > 150) {
    return { success: false, error: "Title must not exceed 150 characters." };
  }

  if (!description || description.length < 15) {
    return { success: false, error: "Please provide a detailed description (at least 15 characters)." };
  }

  if (description.length > 3000) {
    return { success: false, error: "Description must not exceed 3,000 characters." };
  }

  if (!barangay || barangay.length < 2) {
    return { success: false, error: "Please specify the barangay where this incident is located." };
  }

  if (latitude !== null && (latitude < -90 || latitude > 90)) {
    return { success: false, error: "Invalid latitude coordinate. Must be between -90 and 90." };
  }

  if (longitude !== null && (longitude < -180 || longitude > 180)) {
    return { success: false, error: "Invalid longitude coordinate. Must be between -180 and 180." };
  }

  // Pre-validate file attachments before performing any DB operations
  const files = formData.getAll("attachments") as File[];
  const validFiles = files.filter(
    (f) => f && typeof f.size === "number" && f.size > 0 && f.name && f.name !== "undefined"
  );

  if (validFiles.length > MAX_FILES_PER_REPORT) {
    return {
      success: false,
      error: `Too many attachments. You may attach up to ${MAX_FILES_PER_REPORT} files per report.`,
    };
  }

  for (const file of validFiles) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      return {
        success: false,
        error: `File "${file.name}" exceeds the 10 MB limit (${mb} MB).`,
      };
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        success: false,
        error: `File "${file.name}" has an unsupported format (${file.type || "unknown"}). Allowed formats: JPG, PNG, WebP, HEIC, GIF, PDF.`,
      };
    }
  }

  try {
    // 1. Create incident via server data-access layer (defaults status to 'submitted')
    const incident = await createResidentIncident({
      title,
      description,
      category_id,
      severity,
      barangay,
      street_area,
      landmark,
      latitude,
      longitude,
    });

    if (!incident) {
      return { success: false, error: "Failed to create incident report. Please try again." };
    }

    // 2. Upload file attachments to private storage bucket and create metadata records
    for (const file of validFiles) {
      await uploadIncidentAttachment(incident.id, file);
    }

    // 3. Dispatch notifications to resident and staff
    await notifyIncidentSubmitted({
      id: incident.id,
      report_number: incident.report_number,
      title: incident.title,
      barangay: incident.barangay,
      reporter_id: incident.reporter_id,
    });

    // Revalidate paths to update dashboard stats and list views
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/reports");
    revalidatePath("/admin");
    revalidatePath("/admin/reports");
    revalidatePath("/staff");
    revalidatePath("/staff/incidents");

    return {
      success: true,
      incidentId: incident.id,
      reportNumber: incident.report_number,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred while saving the report.";
    return { success: false, error: message };
  }
}

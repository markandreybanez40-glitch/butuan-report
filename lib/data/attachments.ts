import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profiles";
import { createAuditLogEntry } from "@/lib/data/audit";
import type { IncidentAttachment } from "@/types";

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/gif",
  "application/pdf",
];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB limit
export const MAX_FILES_PER_REPORT = 5;

/**
 * Validates binary buffer headers against expected magic bytes.
 * Prevents file-extension spoofing (e.g. executable disguised as .png).
 */
export function validateFileBuffer(
  buffer: Buffer,
  claimedMimeType: string,
  filename: string
): { valid: boolean; detectedMime: string; error?: string } {
  if (!buffer || buffer.length < 4) {
    return { valid: false, detectedMime: "unknown", error: `File "${filename}" is empty or truncated.` };
  }

  // 1. JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, detectedMime: "image/jpeg" };
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, detectedMime: "image/png" };
  }

  // 3. GIF: 47 49 46 38 ('GIF8')
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return { valid: true, detectedMime: "image/gif" };
  }

  // 4. WebP: RIFF (bytes 0..3) + WEBP (bytes 8..11)
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && // R
    buffer[1] === 0x49 && // I
    buffer[2] === 0x46 && // F
    buffer[3] === 0x46 && // F
    buffer[8] === 0x57 && // W
    buffer[9] === 0x45 && // E
    buffer[10] === 0x42 && // B
    buffer[11] === 0x50 // P
  ) {
    return { valid: true, detectedMime: "image/webp" };
  }

  // 5. PDF: %PDF (25 50 44 46)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return { valid: true, detectedMime: "application/pdf" };
  }

  // 6. HEIC / HEIF / ISO Base Media
  if (buffer.length >= 12) {
    const ftyp = buffer.toString("ascii", 4, 8);
    const brand = buffer.toString("ascii", 8, 12).toLowerCase();
    if (ftyp === "ftyp" && ["heic", "heix", "mif1", "msf1", "hevc", "isom", "mp42"].includes(brand)) {
      return { valid: true, detectedMime: "image/heic" };
    }
  }

  return {
    valid: false,
    detectedMime: "unknown",
    error: `File "${filename}" content does not match allowed types (JPG, PNG, WebP, HEIC, GIF, PDF). Signature check failed.`,
  };
}

/**
 * Server data-access helper to upload an attachment file to private Supabase storage
 * and create its corresponding metadata record in incident_attachments.
 * Performs rigorous authorization, magic byte inspection, and prevents orphaned storage objects.
 */
export async function uploadIncidentAttachment(
  incidentId: string,
  file: File
): Promise<IncidentAttachment | null> {
  const profile = await getCurrentProfile();
  if (!profile) {
    throw new Error("Unauthorized: Profile not found.");
  }

  if (!incidentId || !incidentId.trim()) {
    throw new Error("Invalid incident identifier.");
  }

  // 1. Validate file size (10 MB limit)
  if (!file || typeof file.size !== "number" || file.size <= 0) {
    throw new Error(`File "${file?.name || "unnamed"}" is empty.`);
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(`File "${file.name}" exceeds the 10 MB limit (${mb} MB).`);
  }

  // 2. Validate declared MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(
      `File "${file.name}" has an unsupported format (${file.type || "unknown"}). Allowed formats: JPG, PNG, WebP, HEIC, GIF, PDF.`
    );
  }

  // 3. Inspect binary magic bytes to verify genuine file payload
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const validation = validateFileBuffer(buffer, file.type, file.name);

  if (!validation.valid) {
    throw new Error(validation.error || `File content validation failed for "${file.name}".`);
  }

  const supabase = createAdminSupabaseClient();

  // 4. Authorize caller against the target incident report
  const { data: incident, error: incError } = await supabase
    .from("incidents")
    .select("id, reporter_id, status")
    .eq("id", incidentId)
    .single();

  if (incError || !incident) {
    throw new Error("Target incident report not found or inaccessible.");
  }

  // Resident role: Can only attach to own reports
  if (profile.role === "resident" && incident.reporter_id !== profile.id) {
    throw new Error("Security Policy: Residents may only upload attachments to their own reports.");
  }

  // Responder role: Can only attach to assigned reports
  if (profile.role === "responder") {
    const { data: assignment } = await supabase
      .from("incident_assignments")
      .select("id")
      .eq("incident_id", incidentId)
      .eq("assigned_user_id", profile.id)
      .is("unassigned_at", null)
      .maybeSingle();

    if (!assignment) {
      throw new Error("Security Policy: Responders may only attach evidence to incidents assigned to them.");
    }
  }

  // 5. Check maximum file count limit
  const { count: currentCount } = await supabase
    .from("incident_attachments")
    .select("*", { count: "exact", head: true })
    .eq("incident_id", incidentId);

  if ((currentCount || 0) >= MAX_FILES_PER_REPORT) {
    throw new Error(`Maximum attachment limit (${MAX_FILES_PER_REPORT} files) reached for this incident.`);
  }

  // 6. Build sanitized, path-traversal-safe storage key
  const cleanName = file.name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/^\.+/, "")
    .slice(0, 100);
  const uniqueToken = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const storagePath = `incidents/${incidentId}/${uniqueToken}-${cleanName}`;

  // 7. Upload to private Supabase storage bucket
  const { error: uploadError } = await supabase.storage
    .from("incident-attachments")
    .upload(storagePath, buffer, {
      contentType: validation.detectedMime,
      upsert: false,
    });

  if (uploadError) {
    console.error("Storage upload error:", uploadError.message);
    throw new Error(`Failed to store attachment: ${uploadError.message}`);
  }

  // 8. Insert metadata record in incident_attachments table
  const { data: attachment, error: dbError } = await supabase
    .from("incident_attachments")
    .insert({
      incident_id: incidentId,
      uploader_id: profile.id,
      storage_path: storagePath,
      original_filename: cleanName,
      mime_type: validation.detectedMime,
      file_size: file.size,
    })
    .select()
    .single();

  // 9. Cleanup orphaned storage object if metadata record creation fails
  if (dbError) {
    console.error("Attachment metadata DB error:", dbError.message);
    await supabase.storage.from("incident-attachments").remove([storagePath]);
    throw new Error(`Failed to save attachment record: ${dbError.message}`);
  }

  return attachment;
}

export interface PreparedUploadAttachment {
  path: string;
  signedUrl: string;
  token: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
}

export interface FinalizeAttachmentItem {
  path: string;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
}

export interface FinalizeAttachmentsResult {
  savedAttachments: IncidentAttachment[];
  errors: string[];
}

/**
 * Prepares short-lived signed upload authorizations for direct-to-storage uploads.
 * Enforces authenticated user, incident ownership, allowed MIME types, and file size limits.
 * Storage path is strictly generated server-side.
 */
export async function prepareAttachmentUploads(
  incidentId: string,
  files: { filename: string; fileSize: number; mimeType: string }[]
): Promise<PreparedUploadAttachment[]> {
  const profile = await getCurrentProfile();
  if (!profile) {
    throw new Error("Unauthorized: Sign-in required to upload attachments.");
  }

  if (!files || files.length === 0) {
    return [];
  }

  if (files.length > MAX_FILES_PER_REPORT) {
    throw new Error(`Maximum attachment limit (${MAX_FILES_PER_REPORT} files) exceeded.`);
  }

  const supabase = createAdminSupabaseClient();

  // 1. Authorize caller against target incident
  const { data: incident, error: incError } = await supabase
    .from("incidents")
    .select("id, reporter_id, status")
    .eq("id", incidentId)
    .single();

  if (incError || !incident) {
    throw new Error("Target incident report not found or inaccessible.");
  }

  if (profile.role === "resident") {
    if (incident.reporter_id !== profile.id) {
      throw new Error("Security Policy: Residents may only upload attachments to their own reports.");
    }
    if (!["submitted", "under_review", "assigned", "in_progress"].includes(incident.status)) {
      throw new Error("Security Policy: Cannot add attachments to resolved or closed reports.");
    }
  } else if (profile.role === "responder") {
    const { data: assignment } = await supabase
      .from("incident_assignments")
      .select("id")
      .eq("incident_id", incidentId)
      .eq("assigned_user_id", profile.id)
      .is("unassigned_at", null)
      .maybeSingle();

    if (!assignment) {
      throw new Error("Security Policy: Responders may only attach evidence to incidents assigned to them.");
    }
  }

  // 2. Check current attachment count limit
  const { count: currentCount } = await supabase
    .from("incident_attachments")
    .select("*", { count: "exact", head: true })
    .eq("incident_id", incidentId);

  if ((currentCount || 0) + files.length > MAX_FILES_PER_REPORT) {
    throw new Error(
      `Cannot upload ${files.length} file(s). Maximum attachment limit (${MAX_FILES_PER_REPORT} files) would be exceeded.`
    );
  }

  const prepared: PreparedUploadAttachment[] = [];

  for (const f of files) {
    if (f.fileSize > MAX_FILE_SIZE_BYTES) {
      const mb = (f.fileSize / (1024 * 1024)).toFixed(1);
      throw new Error(`File "${f.filename}" exceeds the 10 MB limit (${mb} MB).`);
    }

    if (!ALLOWED_MIME_TYPES.includes(f.mimeType)) {
      throw new Error(
        `File "${f.filename}" has an unsupported format (${f.mimeType || "unknown"}). Allowed formats: JPG, PNG, WebP, HEIC, GIF, PDF.`
      );
    }

    const cleanName = f.filename
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/^\.+/, "")
      .slice(0, 100);

    const uniqueToken = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const storagePath = `incidents/${incidentId}/${uniqueToken}-${cleanName}`;

    const { data, error } = await supabase.storage
      .from("incident-attachments")
      .createSignedUploadUrl(storagePath, { upsert: false });

    if (error || !data) {
      throw new Error(`Failed to create upload authorization: ${error?.message || "Storage error"}`);
    }

    prepared.push({
      path: storagePath,
      signedUrl: data.signedUrl,
      token: data.token,
      originalFilename: cleanName,
      mimeType: f.mimeType,
      fileSize: f.fileSize,
    });
  }

  return prepared;
}

/**
 * Validates and finalizes attachments uploaded directly to storage.
 * Inspects binary magic bytes from storage headers and inserts database records.
 * Purges invalid or malicious files from storage immediately.
 */
export async function finalizeAttachmentUploads(
  incidentId: string,
  uploadedAttachments: FinalizeAttachmentItem[]
): Promise<FinalizeAttachmentsResult> {
  const profile = await getCurrentProfile();
  if (!profile) {
    throw new Error("Unauthorized: Sign-in required to finalize attachments.");
  }

  if (!uploadedAttachments || uploadedAttachments.length === 0) {
    return { savedAttachments: [], errors: [] };
  }

  const supabase = createAdminSupabaseClient();

  // Authorize caller against target incident
  const { data: incident, error: incError } = await supabase
    .from("incidents")
    .select("id, reporter_id, status")
    .eq("id", incidentId)
    .single();

  if (incError || !incident) {
    throw new Error("Target incident report not found or inaccessible.");
  }

  if (profile.role === "resident" && incident.reporter_id !== profile.id) {
    throw new Error("Security Policy: Residents may only manage attachments on their own reports.");
  }

  const savedAttachments: IncidentAttachment[] = [];
  const errors: string[] = [];

  for (const item of uploadedAttachments) {
    // 1. Strict path validation: Must begin with incidents/<incidentId>/ and have no path traversal
    const expectedPrefix = `incidents/${incidentId}/`;
    if (!item.path.startsWith(expectedPrefix) || item.path.includes("..") || item.path.includes("//")) {
      errors.push(`Unauthorized storage path rejected: "${item.path}".`);
      continue;
    }

    // 2. Download header bytes to verify existence and check magic bytes
    try {
      const { data: blob, error: downloadError } = await supabase.storage
        .from("incident-attachments")
        .download(item.path);

      if (downloadError || !blob) {
        errors.push(`Could not find uploaded file in storage: "${item.originalFilename}".`);
        continue;
      }

      const arrayBuffer = await blob.arrayBuffer();
      const headerBuffer = Buffer.from(arrayBuffer.slice(0, 512));
      const validation = validateFileBuffer(headerBuffer, item.mimeType, item.originalFilename);

      if (!validation.valid) {
        // Purge invalid / spoofed file immediately
        await supabase.storage.from("incident-attachments").remove([item.path]);
        errors.push(validation.error || `File signature validation failed for "${item.originalFilename}".`);
        continue;
      }

      // 3. Insert record into incident_attachments
      const { data: record, error: insertError } = await supabase
        .from("incident_attachments")
        .insert({
          incident_id: incidentId,
          uploader_id: profile.id,
          storage_path: item.path,
          original_filename: item.originalFilename,
          mime_type: validation.detectedMime,
          file_size: item.fileSize,
        })
        .select()
        .single();

      if (insertError || !record) {
        await supabase.storage.from("incident-attachments").remove([item.path]);
        errors.push(`Failed to register attachment "${item.originalFilename}": ${insertError?.message || "DB error"}`);
        continue;
      }

      savedAttachments.push(record);
    } catch (err) {
      await supabase.storage.from("incident-attachments").remove([item.path]).catch(() => {});
      const msg = err instanceof Error ? err.message : `Unexpected error validating "${item.originalFilename}".`;
      errors.push(msg);
    }
  }

  return { savedAttachments, errors };
}

/**
 * Deletes an incident attachment with full authorization and audit logging.
 */
export async function deleteIncidentAttachment(
  attachmentId: string
): Promise<{ success: boolean; error?: string }> {
  const profile = await getCurrentProfile();
  if (!profile) {
    return { success: false, error: "Unauthorized: User profile not found." };
  }

  const supabase = createAdminSupabaseClient();

  // Fetch attachment metadata and parent incident
  const { data: attachment, error: fetchError } = await supabase
    .from("incident_attachments")
    .select("*, incident:incidents(id, reporter_id, status)")
    .eq("id", attachmentId)
    .single();

  if (fetchError || !attachment) {
    return { success: false, error: "Attachment not found." };
  }

  const incident = attachment.incident as unknown as {
    id: string;
    reporter_id: string;
    status: string;
  } | null;

  // Authorization check
  const isAdminOrDispatcher = ["admin", "dispatcher"].includes(profile.role);
  const isUploader = attachment.uploader_id === profile.id;
  const isReporter = incident && incident.reporter_id === profile.id;

  if (profile.role === "resident") {
    if (!isReporter || !isUploader) {
      return { success: false, error: "Forbidden: You may only delete your own attachments." };
    }
    if (incident && ["resolved", "closed", "cancelled"].includes(incident.status)) {
      return { success: false, error: "Cannot delete attachments from resolved or closed reports." };
    }
  } else if (profile.role === "responder") {
    if (!isUploader) {
      return { success: false, error: "Forbidden: Responders may only delete attachments they uploaded." };
    }
  } else if (!isAdminOrDispatcher) {
    return { success: false, error: "Forbidden: Insufficient privileges." };
  }

  // Remove storage object
  const { error: storageError } = await supabase.storage
    .from("incident-attachments")
    .remove([attachment.storage_path]);

  if (storageError) {
    console.error("Error removing storage object:", storageError.message);
  }

  // Delete metadata record
  const { error: deleteError } = await supabase
    .from("incident_attachments")
    .delete()
    .eq("id", attachmentId);

  if (deleteError) {
    return { success: false, error: `Failed to remove attachment record: ${deleteError.message}` };
  }

  // Create audit log entry
  await createAuditLogEntry({
    actor_id: profile.id,
    action: "attachment_deleted",
    entity_type: "incident_attachment",
    entity_id: attachmentId,
    metadata: {
      incident_id: attachment.incident_id,
      filename: attachment.original_filename,
      storage_path: attachment.storage_path,
    },
  });

  return { success: true };
}

/**
 * Generates a temporary signed download/view URL for an attachment in private storage.
 */
export async function getAttachmentSignedUrl(
  storagePath: string,
  expiresInSeconds: number = 3600
): Promise<string | null> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.storage
    .from("incident-attachments")
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    console.error("Error creating signed URL:", error?.message);
    return null;
  }

  return data.signedUrl;
}


import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profiles";
import type { IncidentAttachment } from "@/types";

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/gif",
  "application/pdf",
];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_FILES_PER_REPORT = 5;

/**
 * Server data-access helper to upload an attachment file to private Supabase storage
 * and create its corresponding metadata record in incident_attachments.
 * Enforced by Supabase RLS policies on both storage.objects and incident_attachments.
 */
export async function uploadIncidentAttachment(
  incidentId: string,
  file: File
): Promise<IncidentAttachment | null> {
  const profile = await getCurrentProfile();
  if (!profile) {
    throw new Error("Unauthorized: Profile not found.");
  }

  // Validate size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File "${file.name}" exceeds the 10 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(
      `File "${file.name}" has an unsupported format (${file.type || "unknown"}). Allowed formats: JPG, PNG, WebP, HEIC, GIF, PDF.`
    );
  }

  const supabase = createServerSupabaseClient();
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const uniquePrefix = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const storagePath = `${incidentId}/${uniquePrefix}-${cleanName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 1. Upload file to private storage bucket
  const { error: uploadError } = await supabase.storage
    .from("incident-attachments")
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Storage upload error:", uploadError.message);
    throw new Error(`Failed to upload "${file.name}": ${uploadError.message}`);
  }

  // 2. Insert metadata record in incident_attachments table
  const { data: attachment, error: dbError } = await supabase
    .from("incident_attachments")
    .insert({
      incident_id: incidentId,
      uploader_id: profile.id,
      storage_path: storagePath,
      original_filename: file.name,
      mime_type: file.type,
      file_size: file.size,
    })
    .select()
    .single();

  if (dbError) {
    console.error("Attachment metadata DB error:", dbError.message);
    // Cleanup orphaned storage object if metadata record fails
    await supabase.storage.from("incident-attachments").remove([storagePath]);
    throw new Error(`Failed to save attachment metadata: ${dbError.message}`);
  }

  return attachment;
}

/**
 * Generates a temporary signed download/view URL for an attachment in private storage.
 */
export async function getAttachmentSignedUrl(
  storagePath: string,
  expiresInSeconds: number = 3600
): Promise<string | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.storage
    .from("incident-attachments")
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    console.error("Error creating signed URL:", error?.message);
    return null;
  }

  return data.signedUrl;
}


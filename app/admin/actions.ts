"use server";

import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import { getCurrentProfile } from "@/lib/data/profiles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAuditLogEntry } from "@/lib/data/audit";
import type { UserRole } from "@/types";

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
  const user = await currentUser();
  if (!user) {
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

  const supabase = createServerSupabaseClient();

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
  revalidatePath("/admin/users");
  revalidatePath("/admin/audit-logs");
  revalidatePath("/staff");

  return { success: true };
}

/**
 * Creates a new municipal department.
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

  const supabase = createServerSupabaseClient();

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
  revalidatePath("/admin/audit-logs");
  revalidatePath("/staff");

  return { success: true };
}

/**
 * Updates an existing department's name and description.
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

  const supabase = createServerSupabaseClient();

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
  revalidatePath("/admin/audit-logs");
  revalidatePath("/staff");

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

  const supabase = createServerSupabaseClient();

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
  revalidatePath("/admin/audit-logs");
  revalidatePath("/staff");

  return { success: true };
}

/**
 * Creates a new incident category.
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

  const supabase = createServerSupabaseClient();

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
  revalidatePath("/admin/audit-logs");
  revalidatePath("/dashboard/new");

  return { success: true };
}

/**
 * Updates an existing incident category.
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

  const supabase = createServerSupabaseClient();

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
  revalidatePath("/admin/audit-logs");
  revalidatePath("/dashboard/new");

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

  const supabase = createServerSupabaseClient();

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
  revalidatePath("/admin/audit-logs");
  revalidatePath("/dashboard/new");

  return { success: true };
}

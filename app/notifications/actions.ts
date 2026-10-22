"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { getCurrentProfile } from "@/lib/data/profiles";
import {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "@/lib/data/notifications";
import type { Notification } from "@/types";

/**
 * Safely resolves the authenticated Clerk user ID.
 * Uses auth() to verify session claims without external network round-trips to the Clerk API,
 * avoiding ClerkAPIResponseError and rate limiting during background polling.
 * Handles unauthenticated sessions and testing environments safely without throwing.
 */
async function getAuthenticatedUserId(): Promise<string | null> {
  try {
    const { userId } = await auth();
    if (userId) return userId;
  } catch (error) {
    // In test runner environments without Next.js headers/request context,
    // fallback to the test profile context
    if (process.env.NODE_ENV !== "production") {
      const profile = await getCurrentProfile();
      return profile?.clerk_user_id ?? null;
    }
    console.error("Clerk auth resolution error:", error instanceof Error ? error.message : "Unknown error");
    return null;
  }
  return null;
}

function safeRevalidateNotificationPaths() {
  try {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/notifications");
    revalidatePath("/staff");
    revalidatePath("/staff/notifications");
    revalidatePath("/admin");
    revalidatePath("/admin/notifications");
  } catch {
    // Next.js static generation store is not mounted during isolated tests or non-request contexts
  }
}

export async function markNotificationAsReadAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const success = await markNotificationAsRead(id);
    if (success) {
      safeRevalidateNotificationPaths();
    }

    return { success };
  } catch (error) {
    console.error("Error in markNotificationAsReadAction:", error instanceof Error ? error.message : "Unknown error");
    return { success: false, error: "Failed to update notification" };
  }
}

export async function markAllNotificationsAsReadAction(): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const success = await markAllNotificationsAsRead();
    if (success) {
      safeRevalidateNotificationPaths();
    }

    return { success };
  } catch (error) {
    console.error("Error in markAllNotificationsAsReadAction:", error instanceof Error ? error.message : "Unknown error");
    return { success: false, error: "Failed to update notifications" };
  }
}

export async function deleteNotificationAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const success = await deleteNotification(id);
    if (success) {
      safeRevalidateNotificationPaths();
    }

    return { success };
  } catch (error) {
    console.error("Error in deleteNotificationAction:", error instanceof Error ? error.message : "Unknown error");
    return { success: false, error: "Failed to delete notification" };
  }
}

export async function fetchNotificationsAction(options?: {
  limit?: number;
  unreadOnly?: boolean;
}): Promise<Notification[]> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return [];
    }

    return await getMyNotifications(options);
  } catch (error) {
    console.error("Error in fetchNotificationsAction:", error instanceof Error ? error.message : "Unknown error");
    return [];
  }
}

export async function fetchUnreadCountAction(): Promise<number> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return 0;
    }

    return await getUnreadNotificationCount();
  } catch (error) {
    console.error("Error in fetchUnreadCountAction:", error instanceof Error ? error.message : "Unknown error");
    return 0;
  }
}

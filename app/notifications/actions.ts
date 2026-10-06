"use server";

import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "@/lib/data/notifications";

export async function markNotificationAsReadAction(id: string) {
  const user = await currentUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const success = await markNotificationAsRead(id);
  if (success) {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/notifications");
    revalidatePath("/staff");
    revalidatePath("/staff/notifications");
    revalidatePath("/admin");
    revalidatePath("/admin/notifications");
  }

  return { success };
}

export async function markAllNotificationsAsReadAction() {
  const user = await currentUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const success = await markAllNotificationsAsRead();
  if (success) {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/notifications");
    revalidatePath("/staff");
    revalidatePath("/staff/notifications");
    revalidatePath("/admin");
    revalidatePath("/admin/notifications");
  }

  return { success };
}

export async function deleteNotificationAction(id: string) {
  const user = await currentUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const success = await deleteNotification(id);
  if (success) {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/notifications");
    revalidatePath("/staff");
    revalidatePath("/staff/notifications");
    revalidatePath("/admin");
    revalidatePath("/admin/notifications");
  }

  return { success };
}

export async function fetchNotificationsAction(options?: { limit?: number; unreadOnly?: boolean }) {
  const user = await currentUser();
  if (!user) {
    return [];
  }

  return await getMyNotifications(options);
}

export async function fetchUnreadCountAction() {
  const user = await currentUser();
  if (!user) {
    return 0;
  }

  return await getUnreadNotificationCount();
}

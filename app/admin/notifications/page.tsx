import { Metadata } from "next";
import { AdminHeader } from "@/components/admin/admin-header";
import { NotificationsView } from "@/components/notifications/notifications-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Notifications | Butuan Admin",
  description: "System administration notifications and operational alerts.",
};

export default function AdminNotificationsPage() {
  return (
    <>
      <AdminHeader
        title="Admin Notifications"
        subtitle="System alerts, incident dispatch notifications, and operational activity summaries."
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto">
        <NotificationsView
          role="admin"
          title="Admin Notifications"
          subtitle="System alerts, incident dispatch notifications, and operational activity summaries."
        />
      </main>
    </>
  );
}

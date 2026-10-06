import { Metadata } from "next";
import { NotificationsView } from "@/components/notifications/notifications-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Notifications | Butuan Admin",
  description: "System administration notifications and operational alerts.",
};

export default function AdminNotificationsPage() {
  return (
    <div className="container mx-auto max-w-5xl py-6 px-4 sm:px-6">
      <NotificationsView
        role="admin"
        title="Admin Notifications"
        subtitle="System alerts, incident dispatch notifications, and operational activity summaries."
      />
    </div>
  );
}

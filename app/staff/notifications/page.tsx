import { Metadata } from "next";
import { NotificationsView } from "@/components/notifications/notifications-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Staff Notifications | Butuan Ops Center",
  description: "View dispatch alerts, assignment updates, and incident activity.",
};

export default function StaffNotificationsPage() {
  return (
    <div className="container mx-auto max-w-5xl py-6 px-4 sm:px-6">
      <NotificationsView
        role="staff"
        title="Operations Notifications"
        subtitle="Stay updated on new incidents reported, assignments, status changes, and workflow alerts."
      />
    </div>
  );
}

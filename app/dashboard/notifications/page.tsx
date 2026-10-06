import { Metadata } from "next";
import { NotificationsView } from "@/components/notifications/notifications-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Notifications | Butuan Report",
  description: "View updates and notifications on your reported incidents.",
};

export default function ResidentNotificationsPage() {
  return (
    <div className="container mx-auto max-w-5xl py-6 px-4 sm:px-6">
      <NotificationsView
        role="resident"
        title="Resident Notifications"
        subtitle="Track real-time status updates and official messages regarding your filed incident reports."
      />
    </div>
  );
}

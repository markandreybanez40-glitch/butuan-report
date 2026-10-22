import { Metadata } from "next";
import { DispatcherHeader } from "@/components/dispatcher/dispatcher-header";
import { NotificationsView } from "@/components/notifications/notifications-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dispatcher Notifications | Butuan Report",
  description: "View dispatch alerts, assignment updates, and incident activity.",
};

export default function DispatcherNotificationsPage() {
  return (
    <>
      <DispatcherHeader
        title="Dispatch Notifications"
        subtitle="Stay updated on new incidents reported, department assignments, status changes, and priority alerts."
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto">
        <NotificationsView
          role="staff"
          title="Operations Notifications"
          subtitle="Real-time alerts for incoming citizen reports and unit updates."
        />
      </main>
    </>
  );
}

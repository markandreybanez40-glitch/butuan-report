import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { getOrCreateCurrentProfile } from "@/lib/data/profiles";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DispatcherSidebar } from "@/components/dispatcher/dispatcher-sidebar";

export const metadata = {
  title: "Dispatcher Operations | Butuan Report",
  description: "Centralized incident triage, assignment routing, and dispatch operations",
};

export default async function DispatcherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in?redirect_url=/dispatcher");
  }

  const profile = await getOrCreateCurrentProfile();

  // Strict Server-Side Role Enforcement:
  // ONLY 'dispatcher' is permitted on /dispatcher routes.
  if (profile?.role === "admin") {
    redirect("/admin");
  }

  if (profile?.role === "responder") {
    redirect("/staff");
  }

  if (!profile || profile.role === "resident") {
    redirect("/dashboard");
  }

  const userEmail = user.primaryEmailAddress?.emailAddress;
  const userName = profile.full_name || [user.firstName, user.lastName].filter(Boolean).join(" ") || "City Dispatcher";

  return (
    <SidebarProvider defaultOpen={true}>
      <DispatcherSidebar userEmail={userEmail} userName={userName} />
      <SidebarInset className="flex flex-col min-h-screen bg-background">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}

import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { getOrCreateCurrentProfile } from "@/lib/data/profiles";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ResidentSidebar } from "@/components/dashboard/resident-sidebar";

export const metadata = {
  title: "Resident Dashboard | Butuan Report",
  description: "Civic incident reporting and community hazard tracker for Butuan City residents",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Ensure database profile exists for the user
  const profile = await getOrCreateCurrentProfile();

  // Strict Server-Side Role Enforcement:
  if (profile?.role === "admin") {
    redirect("/admin");
  }

  if (profile?.role === "dispatcher") {
    redirect("/dispatcher");
  }

  if (profile?.role === "responder") {
    redirect("/staff");
  }

  const userEmail = user.primaryEmailAddress?.emailAddress;
  const userName = profile?.full_name || [user.firstName, user.lastName].filter(Boolean).join(" ") || "Resident";

  return (
    <SidebarProvider defaultOpen={true}>
      <ResidentSidebar
        userEmail={userEmail}
        userName={userName}
      />
      <SidebarInset className="flex flex-col min-h-screen bg-background">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}

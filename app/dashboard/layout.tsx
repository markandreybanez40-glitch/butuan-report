import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { getOrCreateCurrentProfile } from "@/lib/data/profiles";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ResidentSidebar } from "@/components/dashboard/resident-sidebar";

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

  const userEmail = user.primaryEmailAddress?.emailAddress;
  const userName = profile?.full_name || [user.firstName, user.lastName].filter(Boolean).join(" ") || "Resident";

  return (
    <SidebarProvider defaultOpen={true}>
      <ResidentSidebar
        userEmail={userEmail}
        userName={userName}
        userRole={profile?.role}
      />
      <SidebarInset className="flex flex-col min-h-screen bg-background">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}

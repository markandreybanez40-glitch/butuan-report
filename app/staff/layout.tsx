import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { getCurrentProfile } from "@/lib/data/profiles";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { StaffSidebar } from "@/components/staff/staff-sidebar";
import type { UserRole } from "@/types";

export const metadata = {
  title: "Staff Operations | Butuan Report",
  description: "Municipal incident response and dispatch center for Butuan City",
};

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in?redirect_url=/staff");
  }

  const profile = await getCurrentProfile();

  // Strict server-side access control: Residents MUST NEVER access staff routes
  if (!profile || profile.role === "resident") {
    redirect("/dashboard");
  }

  if (!["responder", "dispatcher", "admin"].includes(profile.role)) {
    redirect("/dashboard");
  }

  const userEmail = user.primaryEmailAddress?.emailAddress;
  const userName = profile.full_name || [user.firstName, user.lastName].filter(Boolean).join(" ") || "Staff Member";

  return (
    <SidebarProvider defaultOpen={true}>
      <StaffSidebar
        userEmail={userEmail}
        userName={userName}
        userRole={profile.role as UserRole}
      />
      <SidebarInset className="flex flex-col min-h-screen bg-background">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}

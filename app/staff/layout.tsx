import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { getOrCreateCurrentProfile } from "@/lib/data/profiles";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { StaffSidebar } from "@/components/staff/staff-sidebar";

export const metadata = {
  title: "Field Responder Operations | Butuan Report",
  description: "Municipal incident response for Butuan City field personnel",
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

  const profile = await getOrCreateCurrentProfile();

  // Strict Server-Side Role Enforcement:
  // ONLY 'responder' is permitted on /staff routes.
  if (profile?.role === "admin") {
    redirect("/admin");
  }

  if (profile?.role === "dispatcher") {
    redirect("/dispatcher");
  }

  if (!profile || profile.role === "resident") {
    redirect("/dashboard");
  }

  const userEmail = user.primaryEmailAddress?.emailAddress;
  const userName = profile.full_name || [user.firstName, user.lastName].filter(Boolean).join(" ") || "Field Responder";

  return (
    <SidebarProvider defaultOpen={true}>
      <StaffSidebar
        userEmail={userEmail}
        userName={userName}
      />
      <SidebarInset className="flex flex-col min-h-screen bg-background">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}

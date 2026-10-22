import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { getOrCreateCurrentProfile } from "@/lib/data/profiles";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export const metadata = {
  title: "Admin Panel | Butuan Report",
  description: "Executive control, user access, and municipal master settings",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in?redirect_url=/admin");
  }

  // Ensure user profile exists in database
  const profile = await getOrCreateCurrentProfile();

  // Strict Server-Side Authorization: ONLY 'admin' role is permitted
  if (!profile) {
    redirect("/sign-in?redirect_url=/admin");
  }

  if (profile.role === "dispatcher") {
    redirect("/dispatcher");
  }

  if (profile.role === "responder") {
    redirect("/staff");
  }

  if (profile.role === "resident") {
    redirect("/dashboard");
  }

  const userEmail = user.primaryEmailAddress?.emailAddress;
  const userName = profile.full_name || [user.firstName, user.lastName].filter(Boolean).join(" ") || "Administrator";

  return (
    <SidebarProvider defaultOpen={true}>
      <AdminSidebar userEmail={userEmail} userName={userName} />
      <SidebarInset className="flex flex-col min-h-screen bg-background">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}

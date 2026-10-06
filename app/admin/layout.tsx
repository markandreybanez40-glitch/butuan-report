import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { getCurrentProfile } from "@/lib/data/profiles";
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
    redirect("/admin/sign-in?redirect_url=/admin");
  }

  const profile = await getCurrentProfile();

  // Strict Server-Side Authorization: ONLY 'admin' role is permitted
  if (!profile || profile.role !== "admin") {
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

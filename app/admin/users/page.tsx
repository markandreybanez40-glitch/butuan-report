import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/data/profiles";
import { getAdminUsers } from "@/lib/data/admin";
import { AdminHeader } from "@/components/admin/admin-header";
import { UsersTable } from "@/components/admin/users-table";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "User Management | Butuan Report Admin",
  description: "Manage citizen profiles and authorize responder, dispatcher, and administrator roles",
};

interface AdminUsersPageProps {
  searchParams: Promise<{
    q?: string;
    role?: string;
  }>;
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const currentProfile = await getCurrentProfile();
  if (!currentProfile || currentProfile.role !== "admin") {
    redirect("/dashboard");
  }

  const { q, role } = await searchParams;

  const users = await getAdminUsers({
    search: q,
    role: role,
  });

  return (
    <>
      <AdminHeader
        title="User Authorization & Profiles"
        subtitle="Inspect citizen registrations and grant responder, dispatcher, or administrative privileges"
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
        <UsersTable users={users} currentUserId={currentProfile.id} />
      </main>
    </>
  );
}

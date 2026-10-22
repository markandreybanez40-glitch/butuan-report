import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface AdminUsersPageProps {
  searchParams: Promise<{
    q?: string;
    role?: string;
    barangay?: string;
    page?: string;
  }>;
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const params = await searchParams;
  const urlParams = new URLSearchParams();
  if (params.q) urlParams.set("q", params.q);
  if (params.role) urlParams.set("role", params.role);
  if (params.barangay) urlParams.set("barangay", params.barangay);
  if (params.page) urlParams.set("page", params.page);

  const queryStr = urlParams.toString();
  redirect(`/admin/residents${queryStr ? `?${queryStr}` : ""}`);
}


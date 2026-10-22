import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface ReportsRedirectProps {
  searchParams: Promise<{
    status?: string;
    q?: string;
    page?: string;
  }>;
}

export default async function ReportsRedirectPage({ searchParams }: ReportsRedirectProps) {
  const params = await searchParams;
  const urlParams = new URLSearchParams();
  if (params.status && params.status !== "all") urlParams.set("status", params.status);
  if (params.q && params.q.trim()) urlParams.set("q", params.q.trim());
  if (params.page && params.page !== "1") urlParams.set("page", params.page);

  const qs = urlParams.toString();
  redirect(qs ? `/dashboard/my-reports?${qs}` : "/dashboard/my-reports");
}

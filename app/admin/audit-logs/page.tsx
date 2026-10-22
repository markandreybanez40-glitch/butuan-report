import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/data/profiles";
import { getAdminAuditLogsPaginated } from "@/lib/data/admin";
import { AdminHeader } from "@/components/admin/admin-header";
import { AuditLogsTable } from "@/components/admin/audit-logs-table";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Audit Logs | Butuan Report Admin",
  description: "Read-only immutable security ledger of user role changes, incident workflow adjustments, and master configuration updates",
};

interface AdminAuditLogsPageProps {
  searchParams: Promise<{
    action?: string;
    entityType?: string;
    actorId?: string;
    q?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}

export default async function AdminAuditLogsPage({ searchParams }: AdminAuditLogsPageProps) {
  const currentProfile = await getCurrentProfile();
  if (!currentProfile || currentProfile.role !== "admin") {
    redirect("/dashboard");
  }

  const { action, entityType, actorId, q, from, to, page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);

  const { logs, totalCount, totalPages, pageSize } = await getAdminAuditLogsPaginated({
    action,
    entityType,
    actorId,
    search: q,
    fromDate: from,
    toDate: to,
    page: currentPage,
    pageSize: 15,
  });

  return (
    <>
      <AdminHeader
        title="Security & System Audit Logs"
        subtitle="Immutable append-only ledger tracking role modifications, incident operations, and administrative actions"
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
        <AuditLogsTable
          logs={logs}
          totalCount={totalCount}
          currentPage={currentPage}
          pageSize={pageSize}
          totalPages={totalPages}
        />
      </main>
    </>
  );
}

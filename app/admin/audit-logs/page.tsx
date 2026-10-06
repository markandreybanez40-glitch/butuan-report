import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/data/profiles";
import { getAdminAuditLogs } from "@/lib/data/admin";
import { AdminHeader } from "@/components/admin/admin-header";
import { AuditLogsTable } from "@/components/admin/audit-logs-table";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Audit Logs | Butuan Report Admin",
  description: "Read-only immutable security ledger of user role changes and master configuration updates",
};

interface AdminAuditLogsPageProps {
  searchParams: Promise<{
    action?: string;
    entityType?: string;
    q?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function AdminAuditLogsPage({ searchParams }: AdminAuditLogsPageProps) {
  const currentProfile = await getCurrentProfile();
  if (!currentProfile || currentProfile.role !== "admin") {
    redirect("/dashboard");
  }

  const { action, entityType, q, from, to } = await searchParams;

  const logs = await getAdminAuditLogs({
    action,
    entityType,
    search: q,
    fromDate: from,
    toDate: to,
  });

  return (
    <>
      <AdminHeader
        title="Security & System Audit Logs"
        subtitle="Immutable append-only ledger tracking role modifications, configuration edits, and administrative actions"
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
        <AuditLogsTable logs={logs} />
      </main>
    </>
  );
}

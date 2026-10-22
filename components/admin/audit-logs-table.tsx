"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  ScrollText,
  Search,
  Shield,
  Building2,
  Tags,
  AlertCircle,
  RotateCcw,
  X,
  FileCode,
  Lock,
  ChevronLeft,
  ChevronRight,
  User,
  Radio,
  CheckCircle2,
  Clock,
  Archive,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AdminAuditLogItem } from "@/lib/data/admin";

interface AuditLogsTableProps {
  logs: AdminAuditLogItem[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

const ACTION_CONFIG: Record<
  string,
  {
    label: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  user_role_changed: {
    label: "User Role Modified",
    color: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
    icon: Shield,
  },
  department_created: {
    label: "Department Created",
    color: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
    icon: Building2,
  },
  department_updated: {
    label: "Department Updated",
    color: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
    icon: Building2,
  },
  department_activated: {
    label: "Department Activated",
    color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    icon: Building2,
  },
  department_deactivated: {
    label: "Department Deactivated",
    color: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    icon: Building2,
  },
  category_created: {
    label: "Category Created",
    color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    icon: Tags,
  },
  category_updated: {
    label: "Category Updated",
    color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    icon: Tags,
  },
  category_activated: {
    label: "Category Activated",
    color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    icon: Tags,
  },
  category_deactivated: {
    label: "Category Deactivated",
    color: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    icon: Tags,
  },
  incident_created: {
    label: "Incident Created",
    color: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
    icon: AlertCircle,
  },
  incident_status_changed: {
    label: "Status Changed",
    color: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    icon: Clock,
  },
  incident_resolved: {
    label: "Incident Resolved",
    color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    icon: CheckCircle2,
  },
  incident_closed: {
    label: "Incident Closed",
    color: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/20",
    icon: Archive,
  },
  incident_assigned: {
    label: "Incident Assigned",
    color: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
    icon: Radio,
  },
  incident_unassigned: {
    label: "Incident Unassigned",
    color: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    icon: Radio,
  },
  incident_update_posted: {
    label: "Remarks / Update Posted",
    color: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
    icon: ScrollText,
  },
};

function formatLogDescription(log: AdminAuditLogItem): string {
  const meta = (log.metadata as Record<string, unknown>) || {};

  switch (log.action) {
    case "user_role_changed":
      return `User role for "${meta.target_user_name || "Citizen"}" changed from ${meta.previous_role || "N/A"} to ${meta.new_role || "N/A"}`;
    case "department_created":
      return `Created department: "${meta.name || log.entity_id}"`;
    case "department_updated":
      return `Updated department: "${meta.name || log.entity_id}"`;
    case "department_activated":
      return `Activated department "${meta.name || log.entity_id}"`;
    case "department_deactivated":
      return `Deactivated department "${meta.name || log.entity_id}"`;
    case "category_created":
      return `Created incident category: "${meta.name || log.entity_id}"`;
    case "category_updated":
      return `Updated incident category: "${meta.name || log.entity_id}"`;
    case "category_activated":
      return `Activated incident category "${meta.name || log.entity_id}"`;
    case "category_deactivated":
      return `Deactivated incident category "${meta.name || log.entity_id}"`;
    case "incident_status_changed":
      return `Report ${meta.report_number || ""}: status changed from ${meta.previous_status || "N/A"} to ${meta.new_status || "N/A"}`;
    case "incident_resolved":
      return `Report ${meta.report_number || ""}: officially resolved & verified`;
    case "incident_closed":
      return `Report ${meta.report_number || ""}: officially closed & archived`;
    case "incident_assigned":
      return `Report ${meta.report_number || ""}: assigned to ${meta.department_name || meta.assigned_user_name || "Department"}`;
    case "incident_unassigned":
      return `Report ${meta.report_number || ""}: unassigned (${meta.reason || "Administrative action"})`;
    case "incident_update_posted":
      return `Report ${meta.report_number || ""}: ${meta.visibility === "internal" ? "internal note" : "public update"} posted`;
    default:
      if (meta.name) return String(meta.name);
      if (meta.title) return String(meta.title);
      if (meta.report_number) return `Report ${meta.report_number}`;
      return `${log.action.replace(/_/g, " ")} on ${log.entity_type}`;
  }
}

export function AuditLogsTable({
  logs,
  totalCount,
  currentPage,
  pageSize,
  totalPages,
}: AuditLogsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentAction = searchParams.get("action") || "all";
  const currentEntity = searchParams.get("entityType") || "all";
  const currentQuery = searchParams.get("q") || "";
  const currentFrom = searchParams.get("from") || "";
  const currentTo = searchParams.get("to") || "";

  const [searchTerm, setSearchTerm] = useState(currentQuery);
  const [fromDate, setFromDate] = useState(currentFrom);
  const [toDate, setToDate] = useState(currentTo);

  // Inspector Dialog for selected Log Metadata
  const [inspectedLog, setInspectedLog] = useState<AdminAuditLogItem | null>(null);

  const applyFilters = (updates: {
    action?: string;
    entityType?: string;
    q?: string;
    from?: string;
    to?: string;
    page?: number;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    const nextAction = updates.action !== undefined ? updates.action : currentAction;
    const nextEntity = updates.entityType !== undefined ? updates.entityType : currentEntity;
    const nextQ = updates.q !== undefined ? updates.q : searchTerm;
    const nextFrom = updates.from !== undefined ? updates.from : fromDate;
    const nextTo = updates.to !== undefined ? updates.to : toDate;
    const nextPage = updates.page !== undefined ? updates.page : 1;

    if (nextAction && nextAction !== "all") params.set("action", nextAction);
    else params.delete("action");

    if (nextEntity && nextEntity !== "all") params.set("entityType", nextEntity);
    else params.delete("entityType");

    if (nextQ && nextQ.trim()) params.set("q", nextQ.trim());
    else params.delete("q");

    if (nextFrom && nextFrom.trim()) params.set("from", nextFrom.trim());
    else params.delete("from");

    if (nextTo && nextTo.trim()) params.set("to", nextTo.trim());
    else params.delete("to");

    if (nextPage > 1) params.set("page", String(nextPage));
    else params.delete("page");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ q: searchTerm, page: 1 });
  };

  const hasActiveFilters =
    currentAction !== "all" ||
    currentEntity !== "all" ||
    currentQuery !== "" ||
    currentFrom !== "" ||
    currentTo !== "";

  const handleReset = () => {
    setSearchTerm("");
    setFromDate("");
    setToDate("");
    startTransition(() => {
      router.push(pathname);
    });
  };

  const startIdx = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(totalCount, currentPage * pageSize);

  return (
    <div className="space-y-4">
      {/* Read-Only Security Policy Notice */}
      <div className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-muted/40 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Lock className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>
            <strong>Immutable Security Ledger:</strong> Audit logs are strictly append-only.
            Records cannot be altered, modified, or deleted by any user or administrator.
          </span>
        </div>
        <Badge variant="outline" className="font-mono text-[10px] hidden sm:inline-flex">
          Append-Only RLS
        </Badge>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3 bg-card p-4 rounded-xl border border-border/70 shadow-xs">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="search"
              aria-label="Search audit logs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by action, resource type, target ID, or keyword..."
              className="pl-9 pr-8 bg-background h-9 text-xs sm:text-sm"
            />
            {searchTerm && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setSearchTerm("");
                  applyFilters({ q: "", page: 1 });
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </form>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={isPending}
              className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground gap-1.5 self-end lg:self-center"
            >
              <RotateCcw className="size-3.5" />
              <span>Reset Filters</span>
            </Button>
          )}
        </div>

        {/* Filter Dropdowns & Date Pickers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {/* Action Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Action</label>
            <select
              value={currentAction}
              disabled={isPending}
              aria-label="Filter audit logs by action"
              onChange={(e) => applyFilters({ action: e.target.value, page: 1 })}
              className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">All Actions</option>
              <option value="user_role_changed">User Role Modified</option>
              <option value="department_created">Department Created</option>
              <option value="department_updated">Department Updated</option>
              <option value="department_activated">Department Activated</option>
              <option value="department_deactivated">Department Deactivated</option>
              <option value="category_created">Category Created</option>
              <option value="category_updated">Category Updated</option>
              <option value="category_activated">Category Activated</option>
              <option value="category_deactivated">Category Deactivated</option>
              <option value="incident_created">Incident Created</option>
              <option value="incident_status_changed">Incident Status Changed</option>
              <option value="incident_resolved">Incident Resolved</option>
              <option value="incident_assigned">Incident Assigned</option>
              <option value="incident_unassigned">Incident Unassigned</option>
              <option value="incident_update_posted">Update/Remarks Posted</option>
            </select>
          </div>

          {/* Entity Type / Resource Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Resource Type</label>
            <select
              value={currentEntity}
              disabled={isPending}
              aria-label="Filter audit logs by resource type"
              onChange={(e) => applyFilters({ entityType: e.target.value, page: 1 })}
              className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">All Resources</option>
              <option value="profile">Profile / User</option>
              <option value="department">Department</option>
              <option value="incident_category">Incident Category</option>
              <option value="incident">Incident</option>
              <option value="incident_update">Incident Update</option>
            </select>
          </div>

          {/* From Date */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">From Date</label>
            <input
              type="date"
              value={fromDate}
              disabled={isPending}
              aria-label="From date"
              onChange={(e) => {
                setFromDate(e.target.value);
                applyFilters({ from: e.target.value, page: 1 });
              }}
              className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-mono"
            />
          </div>

          {/* To Date */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">To Date</label>
            <input
              type="date"
              value={toDate}
              disabled={isPending}
              aria-label="To date"
              onChange={(e) => {
                setToDate(e.target.value);
                applyFilters({ to: e.target.value, page: 1 });
              }}
              className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-mono"
            />
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-2xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[160px] text-xs font-semibold">Date / Time</TableHead>
              <TableHead className="w-[170px] text-xs font-semibold">Admin / User</TableHead>
              <TableHead className="w-[180px] text-xs font-semibold">Action</TableHead>
              <TableHead className="w-[140px] text-xs font-semibold">Resource</TableHead>
              <TableHead className="w-[130px] text-xs font-semibold">Resource ID</TableHead>
              <TableHead className="text-xs font-semibold">Description</TableHead>
              <TableHead className="text-right text-xs font-semibold">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-xs">
                  {hasActiveFilters
                    ? "No audit records found matching your selected filters."
                    : "No audit records currently logged in the ledger."}
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => {
                const dateObj = new Date(log.created_at);
                const dateStr = dateObj.toLocaleDateString("en-PH", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                const timeStr = dateObj.toLocaleTimeString("en-PH", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                });

                const actionMeta = ACTION_CONFIG[log.action] || {
                  label: log.action.replace(/_/g, " "),
                  color: "bg-muted text-muted-foreground border-border",
                  icon: ScrollText,
                };
                const ActionIcon = actionMeta.icon;
                const description = formatLogDescription(log);

                return (
                  <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                    {/* Date / Time */}
                    <TableCell className="py-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-foreground">{dateStr}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {timeStr}
                        </span>
                      </div>
                    </TableCell>

                    {/* Admin / User */}
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="size-6 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                          {log.actor?.full_name?.charAt(0)?.toUpperCase() || <User className="size-3" />}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-foreground truncate">
                            {log.actor?.full_name || "System Automated"}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground uppercase">
                            {log.actor?.role || "SYSTEM"}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Action */}
                    <TableCell className="py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${actionMeta.color}`}
                      >
                        <ActionIcon className="size-3 shrink-0" />
                        <span className="truncate">{actionMeta.label}</span>
                      </span>
                    </TableCell>

                    {/* Resource */}
                    <TableCell className="py-3">
                      <Badge variant="outline" className="text-[10px] font-mono py-0 px-1.5 capitalize">
                        {log.entity_type.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>

                    {/* Resource ID */}
                    <TableCell className="py-3 font-mono text-[11px] text-muted-foreground truncate">
                      {log.entity_id ? (
                        <span title={log.entity_id}>
                          {log.entity_id.slice(0, 8)}...
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>

                    {/* Description */}
                    <TableCell className="py-3 text-xs text-foreground/90 max-w-xs truncate">
                      <span title={description}>{description}</span>
                    </TableCell>

                    {/* Details / Action */}
                    <TableCell className="text-right py-3">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => setInspectedLog(log)}
                        className="h-7 text-xs border-border/80 hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400 gap-1"
                      >
                        <FileCode className="size-3" />
                        <span>Inspect</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground px-1">
          <p>
            Showing <strong>{startIdx}</strong> to <strong>{endIdx}</strong> of{" "}
            <strong>{totalCount}</strong> audit events
          </p>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1 || isPending}
              onClick={() => applyFilters({ page: currentPage - 1 })}
              className="h-8 px-2.5 text-xs gap-1"
            >
              <ChevronLeft className="size-3.5" />
              <span>Previous</span>
            </Button>

            <span className="px-2 font-medium text-foreground">
              Page {currentPage} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages || isPending}
              onClick={() => applyFilters({ page: currentPage + 1 })}
              className="h-8 px-2.5 text-xs gap-1"
            >
              <span>Next</span>
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Metadata Inspector Dialog */}
      <Dialog open={!!inspectedLog} onOpenChange={(open) => !open && setInspectedLog(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScrollText className="size-5 text-blue-600 dark:text-blue-400" />
              <span>Audit Record Details</span>
            </DialogTitle>
            <DialogDescription>
              Immutable event payload captured for action:{" "}
              <strong className="text-foreground font-mono">{inspectedLog?.action}</strong>
            </DialogDescription>
          </DialogHeader>

          {inspectedLog && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-2 text-xs bg-muted/40 p-3 rounded-lg border border-border/60">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                    Record ID
                  </span>
                  <span className="font-mono text-xs select-all">{inspectedLog.id}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                    Timestamp
                  </span>
                  <span className="font-mono text-xs">
                    {new Date(inspectedLog.created_at).toLocaleString("en-PH")}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                    Actor Name & Role
                  </span>
                  <span className="font-medium text-xs">
                    {inspectedLog.actor?.full_name || "System"} (
                    {inspectedLog.actor?.role?.toUpperCase() || "SYSTEM"})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                    Target Resource & ID
                  </span>
                  <span className="font-mono text-xs">
                    {inspectedLog.entity_type} ({inspectedLog.entity_id || "N/A"})
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-foreground">Summary Description</span>
                <p className="text-xs text-foreground bg-muted/20 p-2.5 rounded-md border border-border/40">
                  {formatLogDescription(inspectedLog)}
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-foreground">
                  Payload & Snapshot Data (JSON)
                </span>
                <pre className="p-3 bg-muted/80 rounded-lg text-[11px] font-mono text-foreground overflow-x-auto max-h-60 border border-border select-all">
                  {JSON.stringify(inspectedLog.metadata || {}, null, 2)}
                </pre>
              </div>

              <div className="rounded-lg bg-muted/30 p-2.5 text-[11px] text-muted-foreground flex items-center gap-2 border border-border/40">
                <Lock className="size-3 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>
                  This log entry is read-only and cryptographically timestamped in Supabase.
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

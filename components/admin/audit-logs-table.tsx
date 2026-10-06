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
}

const ACTION_LABELS: Record<
  string,
  {
    label: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  user_role_changed: {
    label: "User Role Modified",
    color: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
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
    color: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20",
    icon: AlertCircle,
  },
  incident_status_changed: {
    label: "Incident Status Changed",
    color: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    icon: AlertCircle,
  },
};

export function AuditLogsTable({ logs }: AuditLogsTableProps) {
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
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    const nextAction = updates.action !== undefined ? updates.action : currentAction;
    const nextEntity = updates.entityType !== undefined ? updates.entityType : currentEntity;
    const nextQ = updates.q !== undefined ? updates.q : searchTerm;
    const nextFrom = updates.from !== undefined ? updates.from : fromDate;
    const nextTo = updates.to !== undefined ? updates.to : toDate;

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

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ q: searchTerm });
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

  return (
    <div className="space-y-4">
      {/* Read-Only Security Policy Notice */}
      <div className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-muted/40 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Lock className="size-3.5 text-purple-600 shrink-0" />
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by action name (e.g., user_role_changed, department_created)..."
              className="pl-9 pr-8 bg-background h-9 text-xs sm:text-sm"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  applyFilters({ q: "" });
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
              onChange={(e) => applyFilters({ action: e.target.value })}
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
            </select>
          </div>

          {/* Entity Type Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Entity Type</label>
            <select
              value={currentEntity}
              disabled={isPending}
              onChange={(e) => applyFilters({ entityType: e.target.value })}
              className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">All Entity Types</option>
              <option value="profile">Profile / User</option>
              <option value="department">Department</option>
              <option value="incident_category">Incident Category</option>
              <option value="incident">Incident</option>
            </select>
          </div>

          {/* From Date */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">From Date</label>
            <input
              type="date"
              value={fromDate}
              disabled={isPending}
              onChange={(e) => {
                setFromDate(e.target.value);
                applyFilters({ from: e.target.value });
              }}
              className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {/* To Date */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">To Date</label>
            <input
              type="date"
              value={toDate}
              disabled={isPending}
              onChange={(e) => {
                setToDate(e.target.value);
                applyFilters({ to: e.target.value });
              }}
              className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-2xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[180px] text-xs font-semibold">Timestamp</TableHead>
              <TableHead className="w-[200px] text-xs font-semibold">Action</TableHead>
              <TableHead className="w-[180px] text-xs font-semibold">Actor / Role</TableHead>
              <TableHead className="w-[160px] text-xs font-semibold">Entity Type & ID</TableHead>
              <TableHead className="text-right text-xs font-semibold">Metadata Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground text-xs">
                  No audit logs found matching the filter criteria.
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

                const actionMeta = ACTION_LABELS[log.action] || {
                  label: log.action.replace(/_/g, " "),
                  color: "bg-muted text-muted-foreground border-border",
                  icon: ScrollText,
                };
                const ActionIcon = actionMeta.icon;

                return (
                  <TableRow key={log.id} className="hover:bg-muted/30">
                    <TableCell className="py-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-foreground">{dateStr}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {timeStr}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${actionMeta.color}`}
                      >
                        <ActionIcon className="size-3" />
                        <span>{actionMeta.label}</span>
                      </span>
                    </TableCell>

                    <TableCell className="py-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-foreground">
                          {log.actor?.full_name || "System Automated"}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground uppercase">
                          Role: {log.actor?.role || "SYSTEM"}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="py-3">
                      <div className="flex flex-col">
                        <Badge variant="outline" className="text-[10px] font-mono w-fit py-0 px-1.5">
                          {log.entity_type}
                        </Badge>
                        <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[140px] mt-0.5">
                          {log.entity_id ? log.entity_id.slice(0, 13) + "..." : "—"}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right py-3">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => setInspectedLog(log)}
                        className="h-7 text-xs border-border/80 hover:border-purple-500/50 hover:text-purple-600 gap-1"
                      >
                        <FileCode className="size-3" />
                        <span>Inspect Payload</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Metadata JSON Inspector Dialog */}
      <Dialog open={!!inspectedLog} onOpenChange={(open) => !open && setInspectedLog(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScrollText className="size-5 text-purple-600" />
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
                  <span className="font-mono text-xs">{inspectedLog.id}</span>
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
                    Actor Name & ID
                  </span>
                  <span className="font-medium text-xs">
                    {inspectedLog.actor?.full_name || "System"} (
                    {inspectedLog.actor_id ? inspectedLog.actor_id.slice(0, 8) + "..." : "System"})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                    Target Entity
                  </span>
                  <span className="font-mono text-xs">
                    {inspectedLog.entity_type} ({inspectedLog.entity_id || "N/A"})
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-foreground">
                  Payload & Snapshot Data (JSON)
                </span>
                <pre className="p-3 bg-muted/80 rounded-lg text-[11px] font-mono text-foreground overflow-x-auto max-h-60 border border-border">
                  {JSON.stringify(inspectedLog.metadata || {}, null, 2)}
                </pre>
              </div>

              <div className="rounded-lg bg-muted/30 p-2.5 text-[11px] text-muted-foreground flex items-center gap-2 border border-border/40">
                <Lock className="size-3 text-purple-600 shrink-0" />
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

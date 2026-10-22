"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Search,
  Filter,
  Building2,
  UserCheck,
  MapPin,
  RotateCcw,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
  History,
  UserMinus,
  UserPlus,
  Inbox,
  AlertCircle,
  CheckCircle2,
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IncidentStatusBadge, IncidentSeverityBadge } from "@/components/dashboard/status-badge";
import { ReportDetailsDrawer } from "@/components/admin/report-details-drawer";
import { AssignModal } from "@/components/admin/assign-modal";
import { AssignmentHistoryModal } from "@/components/admin/assignment-history-modal";
import { adminUnassignIncidentAction } from "@/app/admin/actions";
import { cn } from "@/lib/utils";
import { FIELD_RESPONDERS, type Department } from "@/types";
import type { AdminAssignmentQueueItem } from "@/lib/data/admin";
import type { AssignableStaffMember } from "@/lib/data/staff";

interface AssignmentsTableProps {
  incidents: AdminAssignmentQueueItem[];
  departments: Department[];
  staffMembers: AssignableStaffMember[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

const STATUS_OPTIONS = [
  { value: "all", label: "All Workflow Statuses" },
  { value: "submitted", label: "Pending (Submitted)" },
  { value: "under_review", label: "Under Review" },
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
  { value: "rejected", label: "Rejected" },
];

export function AssignmentsTable({
  incidents,
  departments,
  staffMembers,
  totalCount,
  currentPage,
  pageSize,
  totalPages,
}: AssignmentsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentStatus = searchParams.get("status") || "all";
  const currentDept = searchParams.get("dept") || "all";
  const currentResponder = searchParams.get("responder") || "all";
  const currentAssignment = searchParams.get("assignment") || "all";
  const currentQuery = searchParams.get("q") || "";

  const [searchTerm, setSearchTerm] = useState(currentQuery);

  // Modal / Drawer states
  const [drawerIncidentId, setDrawerIncidentId] = useState<string | null>(null);
  const [assignModalIncident, setAssignModalIncident] = useState<AdminAssignmentQueueItem | null>(null);
  const [historyModalIncident, setHistoryModalIncident] = useState<AdminAssignmentQueueItem | null>(null);
  const [unassignTarget, setUnassignTarget] = useState<AdminAssignmentQueueItem | null>(null);
  const [unassignReason, setUnassignReason] = useState<string>("");
  const [isUnassigning, startUnassignTransition] = useTransition();
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setSearchTerm(currentQuery);
  }, [currentQuery]);

  const applyFilters = (updates: {
    status?: string;
    dept?: string;
    responder?: string;
    assignment?: string;
    q?: string;
    page?: number;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    const nextStatus = updates.status !== undefined ? updates.status : currentStatus;
    const nextDept = updates.dept !== undefined ? updates.dept : currentDept;
    const nextResponder = updates.responder !== undefined ? updates.responder : currentResponder;
    const nextAssignment = updates.assignment !== undefined ? updates.assignment : currentAssignment;
    const nextQ = updates.q !== undefined ? updates.q : searchTerm;

    if (nextStatus && nextStatus !== "all") params.set("status", nextStatus);
    else params.delete("status");

    if (nextDept && nextDept !== "all") params.set("dept", nextDept);
    else params.delete("dept");

    if (nextResponder && nextResponder !== "all") params.set("responder", nextResponder);
    else params.delete("responder");

    if (nextAssignment && nextAssignment !== "all") params.set("assignment", nextAssignment);
    else params.delete("assignment");

    if (nextQ && nextQ.trim()) params.set("q", nextQ.trim());
    else params.delete("q");

    if (updates.page !== undefined) {
      if (updates.page > 1) params.set("page", String(updates.page));
      else params.delete("page");
    } else {
      params.delete("page");
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ q: searchTerm });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      applyFilters({ page: newPage });
    }
  };

  const handleReset = () => {
    setSearchTerm("");
    startTransition(() => {
      router.push(pathname);
    });
  };

  const handleConfirmUnassign = () => {
    if (!unassignTarget) return;

    setActionErrorMsg(null);
    startUnassignTransition(async () => {
      const res = await adminUnassignIncidentAction({
        incidentId: unassignTarget.id,
        reason: unassignReason.trim() || undefined,
        revertStatus: true,
      });

      if (res.success) {
        setActionSuccessMsg(`Successfully unassigned report #${unassignTarget.report_number}.`);
        setUnassignTarget(null);
        setUnassignReason("");
        router.refresh();
        setTimeout(() => setActionSuccessMsg(null), 5000);
      } else {
        setActionErrorMsg(res.error || "Failed to unassign report.");
      }
    });
  };

  const hasActiveFilters =
    currentStatus !== "all" ||
    currentDept !== "all" ||
    currentResponder !== "all" ||
    currentAssignment !== "all" ||
    currentQuery !== "";

  const startIdx = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(totalCount, currentPage * pageSize);

  return (
    <div className="space-y-4">
      {/* Action Success / Error Notifications */}
      {actionSuccessMsg && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="text-muted-foreground hover:text-foreground">
            <X className="size-3.5" />
          </button>
        </div>
      )}
      {actionErrorMsg && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{actionErrorMsg}</span>
          </div>
          <button onClick={() => setActionErrorMsg(null)} className="text-muted-foreground hover:text-foreground">
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="search"
              aria-label="Search assignments"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search reports by report #, title, barangay, or keywords..."
              className="pl-9 pr-8 bg-background h-9 text-xs sm:text-sm"
            />
            {searchTerm && (
              <button
                type="button"
                aria-label="Clear search"
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
              className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1 self-end lg:self-center"
            >
              <RotateCcw className="size-3.5" />
              <span>Reset Filters</span>
            </Button>
          )}
        </div>

        {/* 4 Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {/* Assignment State Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <Filter className="size-3" />
              <span>Assignment State</span>
            </label>
            <select
              value={currentAssignment}
              disabled={isPending}
              aria-label="Filter by assignment state"
              onChange={(e) => applyFilters({ assignment: e.target.value })}
              className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
            >
              <option value="all">All (Assigned & Unassigned)</option>
              <option value="assigned">Active Assigned Only</option>
              <option value="unassigned">Unassigned Only</option>
            </select>
          </div>

          {/* Department Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <Building2 className="size-3" />
              <span>Department</span>
            </label>
            <select
              value={currentDept}
              disabled={isPending}
              aria-label="Filter by department"
              onChange={(e) => applyFilters({ dept: e.target.value })}
              className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Responder Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <UserCheck className="size-3" />
              <span>Responder</span>
            </label>
            <select
              value={currentResponder}
              disabled={isPending}
              aria-label="Filter by responder"
              onChange={(e) => applyFilters({ responder: e.target.value })}
              className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
            >
              <option value="all">All Responders</option>
              <optgroup label="Field Responders">
                {FIELD_RESPONDERS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </optgroup>
              {staffMembers.length > 0 && (
                <optgroup label="Staff Accounts">
                  {staffMembers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              Workflow Status
            </label>
            <select
              value={currentStatus}
              disabled={isPending}
              aria-label="Filter by workflow status"
              onChange={(e) => applyFilters({ status: e.target.value })}
              className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Header Count & Loading Indicator */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <div className="flex items-center gap-2">
          <span>
            Showing <strong className="text-foreground">{startIdx}–{endIdx}</strong> of{" "}
            <strong className="text-foreground">{totalCount}</strong> assignments
          </span>
          {isPending && (
            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
              <Loader2 className="size-3 animate-spin" />
              <span className="text-[11px]">Updating...</span>
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Main Assignments Data Table */}
      {incidents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 p-12 text-center bg-card/50 flex flex-col items-center justify-center space-y-3">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <Inbox className="size-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">No reports match your filters</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Try adjusting your search criteria, clearing specific filters, or resetting to default view.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-border/70 bg-card shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <TableRow>
                    <TableHead className="w-[110px]">Report #</TableHead>
                    <TableHead className="min-w-[180px]">Title & Category</TableHead>
                    <TableHead className="w-[90px]">Severity</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[110px]">Barangay</TableHead>
                    <TableHead className="w-[160px]">Assigned Department</TableHead>
                    <TableHead className="w-[150px]">Assigned Responder</TableHead>
                    <TableHead className="w-[100px]">Assigned Date</TableHead>
                    <TableHead className="w-[100px]">State</TableHead>
                    <TableHead className="w-[140px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs">
                  {incidents.map((incident) => {
                    const activeAssignment = incident.assignments?.find(
                      (a) => a.unassigned_at === null
                    );

                    const assignedDateStr = activeAssignment?.assigned_at
                      ? new Date(activeAssignment.assigned_at).toLocaleDateString("en-PH", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—";

                    const isAssigned = Boolean(activeAssignment);

                    return (
                      <TableRow key={incident.id} className="hover:bg-muted/30 transition-colors">
                        {/* Report Number */}
                        <TableCell className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          <button
                            type="button"
                            onClick={() => setDrawerIncidentId(incident.id)}
                            className="hover:underline text-left"
                          >
                            {incident.report_number}
                          </button>
                        </TableCell>

                        {/* Title & Category */}
                        <TableCell className="max-w-[220px]">
                          <div className="space-y-1">
                            <span className="font-semibold text-foreground block truncate">
                              {incident.title}
                            </span>
                            <Badge variant="outline" className="text-[10px] font-normal truncate max-w-[140px] bg-muted/20">
                              {incident.category?.name || "General Hazard"}
                            </Badge>
                          </div>
                        </TableCell>

                        {/* Severity */}
                        <TableCell>
                          <IncidentSeverityBadge severity={incident.severity} />
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <IncidentStatusBadge status={incident.status} />
                        </TableCell>

                        {/* Barangay */}
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs text-foreground/90 truncate max-w-[120px]">
                            <MapPin className="size-3 text-muted-foreground shrink-0" />
                            <span className="truncate">{incident.barangay}</span>
                          </div>
                        </TableCell>

                        {/* Assigned Department */}
                        <TableCell>
                          {activeAssignment?.department ? (
                            <div className="flex items-center gap-1.5 font-medium text-foreground">
                              <Building2 className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                              <span className="truncate">{activeAssignment.department.name}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">— None —</span>
                          )}
                        </TableCell>

                        {/* Assigned Responder */}
                        <TableCell>
                          {activeAssignment?.field_responder ? (
                            <div className="space-y-0.5 min-w-0">
                              <span className="font-medium text-foreground flex items-center gap-1 truncate">
                                <UserCheck className="size-3 text-emerald-600 shrink-0" />
                                <span className="truncate">{activeAssignment.field_responder}</span>
                              </span>
                              {activeAssignment.instruction && (
                                <span className="text-[10px] text-muted-foreground block truncate">
                                  {activeAssignment.instruction}
                                </span>
                              )}
                            </div>
                          ) : activeAssignment?.assigned_user ? (
                            <div className="space-y-0.5 min-w-0">
                              <span className="font-medium text-foreground flex items-center gap-1 truncate">
                                <UserCheck className="size-3 text-emerald-600 shrink-0" />
                                <span className="truncate">{activeAssignment.assigned_user.full_name}</span>
                              </span>
                              {activeAssignment.assigned_user.phone && (
                                <span className="text-[10px] text-muted-foreground block truncate font-mono">
                                  {activeAssignment.assigned_user.phone}
                                </span>
                              )}
                              {activeAssignment.instruction && (
                                <span className="text-[10px] text-muted-foreground block truncate">
                                  {activeAssignment.instruction}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">— Unassigned —</span>
                          )}
                        </TableCell>

                        {/* Assigned Date */}
                        <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap">
                          {assignedDateStr}
                        </TableCell>

                        {/* State Badge */}
                        <TableCell>
                          {isAssigned ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] py-0 px-1.5 font-semibold text-emerald-700 dark:text-emerald-300 border-emerald-500/30 bg-emerald-500/10"
                            >
                              Assigned
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] py-0 px-1.5 font-semibold text-amber-700 dark:text-amber-300 border-amber-500/30 bg-amber-500/10"
                            >
                              Unassigned
                            </Badge>
                          )}
                        </TableCell>

                        {/* Action Buttons */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Assign / Reassign Button */}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setAssignModalIncident(incident)}
                              className="h-7 px-2 text-xs font-semibold gap-1 border-blue-500/30 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                              title={isAssigned ? "Reassign department/responder" : "Assign department/responder"}
                            >
                              {isAssigned ? (
                                <>
                                  <UserPlus className="size-3" />
                                  <span className="hidden sm:inline">Reassign</span>
                                </>
                              ) : (
                                <>
                                  <UserPlus className="size-3" />
                                  <span>Assign</span>
                                </>
                              )}
                            </Button>

                            {/* Unassign button (if assigned) */}
                            {isAssigned && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setUnassignTarget(incident)}
                                className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                title="Unassign report"
                              >
                                <UserMinus className="size-3.5" />
                              </Button>
                            )}

                            {/* History button */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setHistoryModalIncident(incident)}
                              className="size-7 text-muted-foreground hover:text-foreground"
                              title="View assignment history"
                            >
                              <History className="size-3.5" />
                            </Button>

                            {/* View Drawer button */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setDrawerIncidentId(incident.id)}
                              className="size-7 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                              title="Open report details"
                            >
                              <Eye className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Server-Side Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 text-xs text-muted-foreground">
              <div className="text-xs">
                Page <strong className="text-foreground">{currentPage}</strong> of{" "}
                <strong className="text-foreground">{totalPages}</strong>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1 || isPending}
                  className="h-8 text-xs gap-1"
                >
                  <ChevronLeft className="size-3.5" />
                  <span>Previous</span>
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = i + 1;
                    if (totalPages > 5) {
                      if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                    }
                    const isActive = pageNum === currentPage;
                    return (
                      <Button
                        key={pageNum}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        disabled={isPending}
                        className={cn(
                          "h-8 w-8 p-0 text-xs",
                          isActive ? "bg-blue-600 hover:bg-blue-700 text-white font-semibold" : ""
                        )}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages || isPending}
                  className="h-8 text-xs gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 1. Assign / Reassign Modal */}
      {assignModalIncident && (
        <AssignModal
          isOpen={Boolean(assignModalIncident)}
          onClose={() => setAssignModalIncident(null)}
          onSuccess={() => {
            setActionSuccessMsg(`Updated assignment for report #${assignModalIncident.report_number}.`);
            router.refresh();
            setTimeout(() => setActionSuccessMsg(null), 5000);
          }}
          incidentId={assignModalIncident.id}
          reportNumber={assignModalIncident.report_number}
          incidentTitle={assignModalIncident.title}
          currentDepartmentId={
            assignModalIncident.assignments?.find((a) => a.unassigned_at === null)?.department_id || null
          }
          currentResponderId={
            assignModalIncident.assignments?.find((a) => a.unassigned_at === null)?.assigned_user_id || null
          }
          currentFieldResponder={
            assignModalIncident.assignments?.find((a) => a.unassigned_at === null)?.field_responder || null
          }
          currentDispatchVehicle={
            assignModalIncident.assignments?.find((a) => a.unassigned_at === null)?.dispatch_vehicle || null
          }
          departments={departments}
          staffMembers={staffMembers}
        />
      )}

      {/* 2. Assignment History Trail Modal */}
      {historyModalIncident && (
        <AssignmentHistoryModal
          isOpen={Boolean(historyModalIncident)}
          onClose={() => setHistoryModalIncident(null)}
          incidentId={historyModalIncident.id}
          reportNumber={historyModalIncident.report_number}
          incidentTitle={historyModalIncident.title}
        />
      )}

      {/* 3. Unassign Confirmation Dialog */}
      <Dialog open={Boolean(unassignTarget)} onOpenChange={(open) => !open && setUnassignTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <UserMinus className="size-5" />
              <span>Unassign Incident Report</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to unassign{" "}
              <strong className="text-foreground font-mono">{unassignTarget?.report_number}</strong>?
              This will remove active responder dispatch and return the incident status to Under Review.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5 py-1">
            <label className="text-xs font-semibold text-foreground block">
              Reason for Unassigning (Optional):
            </label>
            <Input
              value={unassignReason}
              onChange={(e) => setUnassignReason(e.target.value)}
              placeholder="e.g. Jurisdiction reassessment, responder unavailable..."
              className="text-xs h-8"
              disabled={isUnassigning}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setUnassignTarget(null)}
              disabled={isUnassigning}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleConfirmUnassign}
              disabled={isUnassigning}
              className="gap-1 text-xs"
            >
              {isUnassigning ? <Loader2 className="size-3.5 animate-spin" /> : null}
              <span>Confirm Unassign</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. Slide-out Report Details Drawer */}
      <ReportDetailsDrawer
        incidentId={drawerIncidentId}
        isOpen={Boolean(drawerIncidentId)}
        departments={departments}
        staffMembers={staffMembers}
        onClose={() => setDrawerIncidentId(null)}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}

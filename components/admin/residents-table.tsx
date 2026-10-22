"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
  Radio,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
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
import { updateUserRoleAction } from "@/app/admin/actions";
import { ResidentDetailsDrawer } from "@/components/admin/resident-details-drawer";
import { ReportDetailsDrawer } from "@/components/admin/report-details-drawer";
import { BUTUAN_BARANGAYS } from "@/lib/constants/barangays";
import type { AdminResidentItem } from "@/lib/data/admin";
import type { Profile, UserRole } from "@/types";

interface ResidentsTableProps {
  residents: AdminResidentItem[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  currentUserId: string;
}

const ROLE_CONFIG: Record<
  UserRole,
  {
    label: string;
    color: string;
    badgeVariant: "default" | "secondary" | "outline" | "destructive";
    icon: React.ComponentType<{ className?: string }>;
    desc: string;
  }
> = {
  admin: {
    label: "Administrator",
    color: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
    badgeVariant: "default",
    icon: ShieldAlert,
    desc: "Full administrative access: user management, department settings, category controls, and audit logs.",
  },
  dispatcher: {
    label: "Dispatcher",
    color: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
    badgeVariant: "secondary",
    icon: Radio,
    desc: "Staff operations: review incidents, triage severity, assign departments/responders, and manage updates.",
  },
  responder: {
    label: "Responder",
    color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
    badgeVariant: "outline",
    icon: ShieldCheck,
    desc: "Field operations: access assigned department reports, publish field updates, and mark incidents resolved.",
  },
  resident: {
    label: "Resident",
    color: "text-muted-foreground bg-muted border-border",
    badgeVariant: "outline",
    icon: User,
    desc: "Standard citizen account: submit civic reports, track report progress, and view public incident timelines.",
  },
};

export function ResidentsTable({
  residents,
  totalCount,
  currentPage,
  pageSize,
  totalPages,
  currentUserId,
}: ResidentsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavPending, startNavTransition] = useTransition();
  const [isActionPending, startActionTransition] = useTransition();

  // URL Filters State
  const currentRole = searchParams.get("role") || "all";
  const currentBarangay = searchParams.get("barangay") || "all";
  const currentQuery = searchParams.get("q") || "";
  const [searchTerm, setSearchTerm] = useState(currentQuery);

  // Drawer and Dialog States
  const [selectedResidentId, setSelectedResidentId] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [roleModalTarget, setRoleModalTarget] = useState<Profile | null>(null);
  const [targetRole, setTargetRole] = useState<UserRole>("resident");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const applyFilters = (updates: {
    role?: string;
    barangay?: string;
    q?: string;
    page?: number;
  }) => {
    const params = new URLSearchParams(searchParams.toString());
    const nextRole = updates.role !== undefined ? updates.role : currentRole;
    const nextBarangay = updates.barangay !== undefined ? updates.barangay : currentBarangay;
    const nextQ = updates.q !== undefined ? updates.q : searchTerm;
    const nextPage = updates.page !== undefined ? updates.page : 1;

    if (nextRole && nextRole !== "all") {
      params.set("role", nextRole);
    } else {
      params.delete("role");
    }

    if (nextBarangay && nextBarangay !== "all") {
      params.set("barangay", nextBarangay);
    } else {
      params.delete("barangay");
    }

    if (nextQ && nextQ.trim()) {
      params.set("q", nextQ.trim());
    } else {
      params.delete("q");
    }

    if (nextPage > 1) {
      params.set("page", String(nextPage));
    } else {
      params.delete("page");
    }

    startNavTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ q: searchTerm, page: 1 });
  };

  const handleOpenRoleModal = (user: Profile) => {
    if (user.id === currentUserId) return; // Prevent modifying self
    setRoleModalTarget(user);
    setTargetRole((user.role as UserRole) || "resident");
    setActionError(null);
  };

  const handleConfirmRoleChange = () => {
    if (!roleModalTarget) return;
    setActionError(null);

    const formData = new FormData();
    formData.append("user_id", roleModalTarget.id);
    formData.append("role", targetRole);

    startActionTransition(async () => {
      const result = await updateUserRoleAction(formData);
      if (!result.success) {
        setActionError(result.error || "Failed to update user role");
      } else {
        setActionSuccess(
          `Successfully updated ${roleModalTarget.full_name || "user"}'s role to ${ROLE_CONFIG[targetRole].label}.`
        );
        setRoleModalTarget(null);
        startNavTransition(() => {
          router.refresh();
        });
        setTimeout(() => setActionSuccess(null), 5000);
      }
    });
  };

  const hasActiveFilters =
    currentRole !== "all" || currentBarangay !== "all" || currentQuery !== "";

  const startIdx = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(totalCount, currentPage * pageSize);

  return (
    <div className="space-y-4">
      {/* Success Notification Banner */}
      {actionSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between bg-card p-4 rounded-xl border border-border/70 shadow-xs">
        {/* Search form */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="search"
            aria-label="Search residents"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search residents by name, phone, barangay, or identity ID..."
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

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Barangay Filter */}
          <div className="relative">
            <select
              value={currentBarangay}
              disabled={isNavPending}
              aria-label="Filter by Barangay"
              onChange={(e) => applyFilters({ barangay: e.target.value, page: 1 })}
              className="h-9 max-w-[180px] rounded-md border border-input bg-background px-3 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring truncate"
            >
              <option value="all">All Barangays (86)</option>
              {BUTUAN_BARANGAYS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div className="relative">
            <select
              value={currentRole}
              disabled={isNavPending}
              aria-label="Filter by Role"
              onChange={(e) => applyFilters({ role: e.target.value, page: 1 })}
              className="h-9 rounded-md border border-input bg-background px-3 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">All Roles</option>
              <option value="resident">Residents</option>
              <option value="responder">Responders</option>
              <option value="dispatcher">Dispatchers</option>
              <option value="admin">Administrators</option>
            </select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                startNavTransition(() => router.push(pathname));
              }}
              disabled={isNavPending}
              className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              <RotateCcw className="size-3.5" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* Residents Data Table */}
      <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-2xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[280px] text-xs font-semibold">Resident Details</TableHead>
              <TableHead className="w-[140px] text-xs font-semibold">Role</TableHead>
              <TableHead className="text-xs font-semibold">Barangay</TableHead>
              <TableHead className="text-xs font-semibold">Phone</TableHead>
              <TableHead className="text-xs font-semibold">Submitted Reports</TableHead>
              <TableHead className="text-xs font-semibold">Joined Date</TableHead>
              <TableHead className="text-right text-xs font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {residents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-xs">
                  {hasActiveFilters
                    ? "No resident profiles found matching your active filter criteria."
                    : "No resident profiles currently registered."}
                </TableCell>
              </TableRow>
            ) : (
              residents.map((r) => {
                const isCurrentAdmin = r.id === currentUserId;
                const roleInfo = ROLE_CONFIG[r.role as UserRole] || ROLE_CONFIG.resident;
                const RoleIcon = roleInfo.icon;
                const joinDate = new Date(r.created_at).toLocaleDateString("en-PH", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });

                return (
                  <TableRow key={r.id} className="hover:bg-muted/30 transition-colors">
                    {/* Resident Details */}
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-500/20">
                          {r.full_name?.charAt(0)?.toUpperCase() || "R"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate flex items-center gap-1.5">
                            <span>{r.full_name || "Unnamed Resident"}</span>
                            {isCurrentAdmin && (
                              <Badge variant="outline" className="text-[10px] py-0 px-1 border-blue-500/30 text-blue-600 dark:text-blue-400">
                                You
                              </Badge>
                            )}
                          </p>
                          <p className="text-[11px] font-mono text-muted-foreground truncate">
                            ID: {r.id.slice(0, 13)}...
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Role */}
                    <TableCell className="py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${roleInfo.color}`}
                      >
                        <RoleIcon className="size-3" />
                        <span>{roleInfo.label}</span>
                      </span>
                    </TableCell>

                    {/* Barangay */}
                    <TableCell className="text-xs text-foreground py-3">
                      {r.barangay ? (
                        <span className="font-medium">{r.barangay}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Phone */}
                    <TableCell className="text-xs text-foreground font-mono py-3">
                      {r.phone || <span className="text-muted-foreground font-sans">—</span>}
                    </TableCell>

                    {/* Submitted Reports */}
                    <TableCell className="py-3">
                      {r.report_count > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className="text-xs font-semibold bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                          >
                            <FileText className="size-3 mr-1" />
                            {r.report_count} {r.report_count === 1 ? "report" : "reports"}
                          </Badge>
                          {r.resolved_count > 0 && (
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                              ({r.resolved_count} resolved)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">0 reports</span>
                      )}
                    </TableCell>

                    {/* Joined Date */}
                    <TableCell className="text-xs text-muted-foreground py-3">
                      {joinDate}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => setSelectedResidentId(r.id)}
                          className="h-7 text-xs border-border/80 hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400 gap-1"
                          title="View Resident Profile & Reports"
                        >
                          <Eye className="size-3" />
                          <span>View</span>
                        </Button>

                        {!isCurrentAdmin && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleOpenRoleModal(r)}
                            className="h-7 text-xs text-muted-foreground hover:text-foreground"
                            title="Change Role"
                          >
                            <Shield className="size-3" />
                            <span className="sr-only">Change Role</span>
                          </Button>
                        )}
                      </div>
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
            <strong>{totalCount}</strong> residents
          </p>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1 || isNavPending}
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
              disabled={currentPage >= totalPages || isNavPending}
              onClick={() => applyFilters({ page: currentPage + 1 })}
              className="h-8 px-2.5 text-xs gap-1"
            >
              <span>Next</span>
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Resident Details Drawer */}
      <ResidentDetailsDrawer
        residentId={selectedResidentId}
        isOpen={!!selectedResidentId}
        onClose={() => setSelectedResidentId(null)}
        currentAdminId={currentUserId}
        onOpenRoleModal={(prof) => {
          handleOpenRoleModal(prof as Profile);
        }}
        onSelectReport={(incId) => {
          setSelectedReportId(incId);
        }}
      />

      {/* Report Details Drawer (when admin clicks a report from inside resident details) */}
      <ReportDetailsDrawer
        incidentId={selectedReportId}
        isOpen={!!selectedReportId}
        onClose={() => setSelectedReportId(null)}
        onSuccess={() => {
          startNavTransition(() => {
            router.refresh();
          });
        }}
      />

      {/* Role Change Confirmation Dialog */}
      <Dialog open={!!roleModalTarget} onOpenChange={(open) => !open && setRoleModalTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="size-5 text-blue-600" />
              <span>Modify User Role Authorization</span>
            </DialogTitle>
            <DialogDescription>
              Assign a new security role for{" "}
              <strong className="text-foreground">{roleModalTarget?.full_name || "this user"}</strong>.
            </DialogDescription>
          </DialogHeader>

          {actionError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Select New Role</label>
              <div className="grid grid-cols-2 gap-2">
                {(["resident", "responder", "dispatcher", "admin"] as UserRole[]).map((r) => {
                  const cfg = ROLE_CONFIG[r];
                  const Icon = cfg.icon;
                  const isSelected = targetRole === r;

                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setTargetRole(r)}
                      className={`p-2.5 rounded-lg border text-left transition-all flex flex-col gap-1 ${
                        isSelected
                          ? "border-blue-600 bg-blue-500/5 ring-1 ring-blue-600/30"
                          : "border-border hover:border-muted-foreground/30 bg-card"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Icon className="size-3.5 text-foreground" />
                        <span className="text-xs font-bold text-foreground">{cfg.label}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground leading-tight line-clamp-2">
                        {cfg.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 p-3 text-[11px] text-muted-foreground border border-border/50">
              <p>
                <strong>Security Notice:</strong> All role changes are recorded in the immutable
                audit trail. Only authorized administrators may promote or demote municipal
                personnel.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRoleModalTarget(null)}
              disabled={isActionPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmRoleChange}
              disabled={isActionPending || targetRole === roleModalTarget?.role}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
            >
              {isActionPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>Confirm Role Change</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

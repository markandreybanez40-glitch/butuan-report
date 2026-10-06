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
import type { Profile, UserRole } from "@/types";

interface UsersTableProps {
  users: Profile[];
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
    color: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20",
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

export function UsersTable({ users, currentUserId }: UsersTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavPending, startNavTransition] = useTransition();
  const [isActionPending, startActionTransition] = useTransition();

  const currentRole = searchParams.get("role") || "all";
  const currentQuery = searchParams.get("q") || "";
  const [searchTerm, setSearchTerm] = useState(currentQuery);

  // Dialog State for Changing Role
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [targetRole, setTargetRole] = useState<UserRole>("resident");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const applyFilters = (updates: { role?: string; q?: string }) => {
    const params = new URLSearchParams(searchParams.toString());
    const nextRole = updates.role !== undefined ? updates.role : currentRole;
    const nextQ = updates.q !== undefined ? updates.q : searchTerm;

    if (nextRole && nextRole !== "all") {
      params.set("role", nextRole);
    } else {
      params.delete("role");
    }

    if (nextQ && nextQ.trim()) {
      params.set("q", nextQ.trim());
    } else {
      params.delete("q");
    }

    startNavTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ q: searchTerm });
  };

  const handleOpenRoleModal = (user: Profile) => {
    if (user.id === currentUserId) return; // Prevent modifying self
    setSelectedUser(user);
    setTargetRole(user.role as UserRole);
    setActionError(null);
  };

  const handleConfirmRoleChange = () => {
    if (!selectedUser) return;
    setActionError(null);

    const formData = new FormData();
    formData.append("user_id", selectedUser.id);
    formData.append("role", targetRole);

    startActionTransition(async () => {
      const result = await updateUserRoleAction(formData);
      if (!result.success) {
        setActionError(result.error || "Failed to update user role");
      } else {
        setActionSuccess(
          `Successfully updated ${selectedUser.full_name || "user"}'s role to ${ROLE_CONFIG[targetRole].label}.`
        );
        setSelectedUser(null);
        startNavTransition(() => {
          router.refresh();
        });
        setTimeout(() => setActionSuccess(null), 5000);
      }
    });
  };

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
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-card p-4 rounded-xl border border-border/70 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users by full name, phone number, or barangay..."
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

        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={currentRole}
              disabled={isNavPending}
              onChange={(e) => applyFilters({ role: e.target.value })}
              className="h-9 rounded-md border border-input bg-background px-3 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">All Roles</option>
              <option value="resident">Residents</option>
              <option value="responder">Responders</option>
              <option value="dispatcher">Dispatchers</option>
              <option value="admin">Administrators</option>
            </select>
          </div>

          {(currentRole !== "all" || currentQuery !== "") && (
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

      {/* Users Data Table */}
      <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-2xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[280px] text-xs font-semibold">User Details</TableHead>
              <TableHead className="w-[140px] text-xs font-semibold">Authorized Role</TableHead>
              <TableHead className="text-xs font-semibold">Barangay</TableHead>
              <TableHead className="text-xs font-semibold">Phone</TableHead>
              <TableHead className="text-xs font-semibold">Member Since</TableHead>
              <TableHead className="text-right text-xs font-semibold">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-xs">
                  No users found matching the selected filter criteria.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => {
                const isCurrentAdmin = u.id === currentUserId;
                const roleInfo = ROLE_CONFIG[u.role as UserRole] || ROLE_CONFIG.resident;
                const RoleIcon = roleInfo.icon;
                const joinDate = new Date(u.created_at).toLocaleDateString("en-PH", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });

                return (
                  <TableRow key={u.id} className="hover:bg-muted/30">
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold text-xs shrink-0">
                          {u.full_name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate flex items-center gap-1.5">
                            <span>{u.full_name || "Unnamed Resident"}</span>
                            {isCurrentAdmin && (
                              <Badge variant="outline" className="text-[10px] py-0 px-1 border-purple-500/30 text-purple-600">
                                You
                              </Badge>
                            )}
                          </p>
                          <p className="text-[11px] font-mono text-muted-foreground truncate">
                            ID: {u.id.slice(0, 13)}...
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${roleInfo.color}`}
                      >
                        <RoleIcon className="size-3" />
                        <span>{roleInfo.label}</span>
                      </span>
                    </TableCell>

                    <TableCell className="text-xs text-foreground py-3">
                      {u.barangay || <span className="text-muted-foreground">—</span>}
                    </TableCell>

                    <TableCell className="text-xs text-foreground font-mono py-3">
                      {u.phone || <span className="text-muted-foreground">—</span>}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground py-3">
                      {joinDate}
                    </TableCell>

                    <TableCell className="text-right py-3">
                      {isCurrentAdmin ? (
                        <span className="text-[11px] font-medium text-muted-foreground italic px-2">
                          Protected (Self)
                        </span>
                      ) : (
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleOpenRoleModal(u)}
                          className="h-7 text-xs border-border/80 hover:border-purple-500/50 hover:text-purple-600"
                        >
                          Change Role
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Role Change Confirmation Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="size-5 text-purple-600" />
              <span>Modify User Authorization</span>
            </DialogTitle>
            <DialogDescription>
              Assign a new security role for{" "}
              <strong className="text-foreground">{selectedUser?.full_name || "this user"}</strong>.
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
                          ? "border-purple-600 bg-purple-500/5 ring-1 ring-purple-600/30"
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
              onClick={() => setSelectedUser(null)}
              disabled={isActionPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmRoleChange}
              disabled={isActionPending || targetRole === selectedUser?.role}
              className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
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

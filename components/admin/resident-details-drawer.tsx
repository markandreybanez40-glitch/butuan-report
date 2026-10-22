"use client";

import { useState, useEffect } from "react";
import {
  X,
  User,
  Phone,
  MapPin,
  Calendar,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Radio,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  ChevronRight,
  Fingerprint,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IncidentStatusBadge, IncidentSeverityBadge } from "@/components/dashboard/status-badge";
import {
  getAdminResidentDetailsAction,
  type AdminResidentDetailsData,
} from "@/app/admin/actions";
import type { UserRole } from "@/types";

interface ResidentDetailsDrawerProps {
  residentId: string | null;
  isOpen: boolean;
  onClose: () => void;
  currentAdminId: string;
  onOpenRoleModal?: (profile: AdminResidentDetailsData["profile"]) => void;
  onSelectReport?: (incidentId: string) => void;
}

const ROLE_DISPLAY_CONFIG: Record<
  UserRole,
  {
    label: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  admin: {
    label: "Administrator",
    color: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
    icon: ShieldAlert,
  },
  dispatcher: {
    label: "Dispatcher",
    color: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
    icon: Radio,
  },
  responder: {
    label: "Responder",
    color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
    icon: ShieldCheck,
  },
  resident: {
    label: "Resident",
    color: "text-muted-foreground bg-muted border-border",
    icon: User,
  },
};

export function ResidentDetailsDrawer({
  residentId,
  isOpen,
  onClose,
  currentAdminId,
  onOpenRoleModal,
  onSelectReport,
}: ResidentDetailsDrawerProps) {
  const [data, setData] = useState<AdminResidentDetailsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (isOpen && residentId) {
      setIsLoading(true);
      setErrorMessage(null);

      getAdminResidentDetailsAction(residentId)
        .then((res) => {
          if (!isMounted) return;
          if (res.success && res.data) {
            setData(res.data);
          } else {
            setErrorMessage(res.error || "Failed to load resident profile.");
          }
        })
        .catch((err) => {
          if (!isMounted) return;
          console.error("Error loading resident details:", err);
          setErrorMessage("Failed to connect to server. Please try again.");
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    } else {
      setData(null);
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, residentId]);

  const profile = data?.profile;
  const stats = data?.stats;
  const recentReports = data?.recentReports || [];

  const isCurrentAdmin = profile?.id === currentAdminId;
  const userRole = (profile?.role as UserRole) || "resident";
  const roleCfg = ROLE_DISPLAY_CONFIG[userRole] || ROLE_DISPLAY_CONFIG.resident;
  const RoleIcon = roleCfg.icon;

  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl p-0 flex flex-col bg-background border-l border-border shadow-2xl overflow-hidden"
      >
        {/* Drawer Header */}
        <SheetHeader className="p-4 sm:p-6 border-b border-border/70 bg-muted/20 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="size-11 rounded-full bg-blue-600/10 text-blue-700 dark:text-blue-300 font-bold text-base flex items-center justify-center border border-blue-500/20 shrink-0">
                {profile?.full_name?.charAt(0)?.toUpperCase() || <User className="size-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <SheetTitle className="text-base sm:text-lg font-bold text-foreground truncate">
                    {profile?.full_name || "Resident Details"}
                  </SheetTitle>
                  {isCurrentAdmin && (
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-blue-500/30 text-blue-600 dark:text-blue-400">
                      You (Current Admin)
                    </Badge>
                  )}
                </div>
                <SheetDescription className="text-xs text-muted-foreground flex items-center gap-1.5 pt-0.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${roleCfg.color}`}
                  >
                    <RoleIcon className="size-3" />
                    <span>{roleCfg.label}</span>
                  </span>
                  {profile?.barangay && (
                    <span className="truncate">• {profile.barangay}</span>
                  )}
                </SheetDescription>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="size-8 rounded-full text-muted-foreground hover:text-foreground shrink-0"
              aria-label="Close resident details"
            >
              <X className="size-4" />
            </Button>
          </div>
        </SheetHeader>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3 text-muted-foreground">
              <Loader2 className="size-8 animate-spin text-blue-600 dark:text-blue-400" />
              <p className="text-xs font-medium">Loading resident profile & report history...</p>
            </div>
          ) : errorMessage && !profile ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-center space-y-2">
              <AlertTriangle className="size-6 text-destructive mx-auto" />
              <p className="text-xs font-semibold text-destructive">{errorMessage}</p>
              <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
                Close
              </Button>
            </div>
          ) : profile ? (
            <>
              {/* 1. Basic Profile Information Card */}
              <div className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                    <User className="size-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Resident Profile Information</span>
                  </h4>

                  {!isCurrentAdmin && onOpenRoleModal && (
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => onOpenRoleModal(profile)}
                      className="h-7 text-xs border-border/80 hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400 gap-1"
                    >
                      <Shield className="size-3" />
                      <span>Change Role</span>
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <User className="size-3 text-muted-foreground" />
                      Full Legal / Registered Name
                    </span>
                    <p className="text-foreground font-semibold">{profile.full_name || "—"}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Phone className="size-3 text-muted-foreground" />
                      Contact Phone
                    </span>
                    <p className="text-foreground font-mono font-medium">
                      {profile.phone || <span className="text-muted-foreground font-normal">Not provided</span>}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <MapPin className="size-3 text-muted-foreground" />
                      Registered Barangay
                    </span>
                    <p className="text-foreground font-medium">
                      {profile.barangay || <span className="text-muted-foreground font-normal">Not set</span>}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="size-3 text-muted-foreground" />
                      Account Registered On
                    </span>
                    <p className="text-foreground font-medium">{joinDate || "—"}</p>
                  </div>

                  <div className="sm:col-span-2 space-y-1 pt-1 border-t border-border/40">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Fingerprint className="size-3 text-muted-foreground" />
                      Citizen Identity Key (Clerk UID)
                    </span>
                    <p className="font-mono text-[11px] text-muted-foreground bg-muted/40 px-2.5 py-1.5 rounded-md border border-border/40 select-all truncate">
                      {profile.clerk_user_id}
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Submitted Reports KPI Breakdown */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Civic Participation & Report Metrics
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="rounded-xl border border-border/70 bg-card p-3 shadow-2xs">
                    <div className="flex items-center justify-between text-muted-foreground mb-1">
                      <span className="text-[11px] font-medium">Total</span>
                      <FileText className="size-3.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-xl font-extrabold text-foreground">{stats?.totalReports || 0}</p>
                    <span className="text-[10px] text-muted-foreground">Submitted</span>
                  </div>

                  <div className="rounded-xl border border-border/70 bg-card p-3 shadow-2xs">
                    <div className="flex items-center justify-between text-muted-foreground mb-1">
                      <span className="text-[11px] font-medium">Resolved</span>
                      <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                      {stats?.resolvedReports || 0}
                    </p>
                    <span className="text-[10px] text-muted-foreground">Completed</span>
                  </div>

                  <div className="rounded-xl border border-border/70 bg-card p-3 shadow-2xs">
                    <div className="flex items-center justify-between text-muted-foreground mb-1">
                      <span className="text-[11px] font-medium">In Progress</span>
                      <Clock className="size-3.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
                      {stats?.inProgressReports || 0}
                    </p>
                    <span className="text-[10px] text-muted-foreground">Assigned/Active</span>
                  </div>

                  <div className="rounded-xl border border-border/70 bg-card p-3 shadow-2xs">
                    <div className="flex items-center justify-between text-muted-foreground mb-1">
                      <span className="text-[11px] font-medium">Pending</span>
                      <Clock className="size-3.5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
                      {stats?.pendingReports || 0}
                    </p>
                    <span className="text-[10px] text-muted-foreground">Under Review</span>
                  </div>
                </div>
              </div>

              {/* 3. Submitted Incident Reports List */}
              <div className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                    <FileText className="size-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Recent Incident Reports ({recentReports.length})</span>
                  </h4>
                  <span className="text-[10px] text-muted-foreground">Real-time status</span>
                </div>

                {recentReports.length === 0 ? (
                  <div className="rounded-lg border border-border/50 bg-muted/20 p-6 text-center text-xs text-muted-foreground">
                    <p>This resident has not submitted any incident reports yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {recentReports.map((report) => {
                      const repDate = new Date(report.created_at).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });

                      return (
                        <div
                          key={report.id}
                          className="p-3 rounded-lg border border-border/70 bg-muted/10 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                        >
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-[11px] font-bold px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                                {report.report_number}
                              </span>
                              <IncidentStatusBadge status={report.status} />
                              <IncidentSeverityBadge severity={report.severity} />
                              {report.category && (
                                <Badge variant="outline" className="text-[10px] py-0 px-1 text-muted-foreground border-border">
                                  {report.category.name}
                                </Badge>
                              )}
                            </div>
                            <h5 className="text-xs sm:text-sm font-semibold text-foreground truncate">
                              {report.title}
                            </h5>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-2 truncate">
                              <span>Brgy. {report.barangay}</span>
                              <span>•</span>
                              <span>{repDate}</span>
                            </p>
                          </div>

                          {onSelectReport && (
                            <Button
                              type="button"
                              variant="outline"
                              size="xs"
                              onClick={() => onSelectReport(report.id)}
                              className="h-7 text-xs border-border/80 hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400 shrink-0 gap-1"
                            >
                              <span>View Report</span>
                              <ChevronRight className="size-3" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Drawer Footer */}
        <SheetFooter className="p-4 border-t border-border/70 bg-muted/20 shrink-0 flex flex-row items-center justify-between gap-2">
          {profile && (
            <span className="text-[11px] text-muted-foreground font-mono truncate">
              Resident ID: {profile.id.slice(0, 18)}...
            </span>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs ml-auto"
          >
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

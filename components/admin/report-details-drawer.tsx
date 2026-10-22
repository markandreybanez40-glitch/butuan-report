"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  X,
  MapPin,
  Calendar,
  User,
  Phone,
  Paperclip,
  ExternalLink,
  CheckCircle2,
  Save,
  Loader2,
  Clock,
  Lock,
  Globe,
  AlertCircle,
  FileText,
  Building,
  Maximize2,
  UserCheck,
  Truck,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { IncidentStatusBadge, IncidentSeverityBadge } from "@/components/dashboard/status-badge";
import {
  getAdminReportDetailsAction,
  updateAdminReportQuickAction,
  adminAssignIncidentAction,
  getAdminAssignmentOptionsAction,
} from "@/app/admin/actions";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { IncidentDetailMapView } from "@/components/map/incident-detail-map-view";
import {
  FIELD_RESPONDERS,
  DISPATCH_VEHICLES,
  type IncidentStatus,
  type Department,
  type FieldResponder,
  type DispatchVehicle,
} from "@/types";
import type { StaffIncidentFullDetails, AssignableStaffMember } from "@/lib/data/staff";

interface ReportDetailsDrawerProps {
  incidentId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  departments?: Department[];
  staffMembers?: AssignableStaffMember[];
}

const STATUS_SELECT_OPTIONS: { value: IncidentStatus; label: string; desc: string }[] = [
  { value: "submitted", label: "Pending (Submitted)", desc: "Initial receipt from resident" },
  { value: "under_review", label: "Under Review", desc: "Triage & verification in progress" },
  { value: "assigned", label: "Assigned", desc: "Dispatched to responding department" },
  { value: "in_progress", label: "In Progress", desc: "Active response operations ongoing" },
  { value: "resolved", label: "Resolved", desc: "Resolution verified and completed" },
  { value: "closed", label: "Closed", desc: "Archived after resolution" },
  { value: "rejected", label: "Rejected", desc: "Out of scope, invalid or unauthorized" },
  { value: "duplicate", label: "Duplicate", desc: "Merged with another incident" },
  { value: "cancelled", label: "Cancelled", desc: "Cancelled or withdrawn" },
];

export function ReportDetailsDrawer({
  incidentId,
  isOpen,
  onClose,
  onSuccess,
  departments = [],
  staffMembers = [],
}: ReportDetailsDrawerProps) {
  const [incident, setIncident] = useState<StaffIncidentFullDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Departments & Staff options
  const [departmentsList, setDepartmentsList] = useState<Department[]>(departments);
  const [staffList, setStaffList] = useState<AssignableStaffMember[]>(staffMembers);

  // Form state
  const [selectedStatus, setSelectedStatus] = useState<IncidentStatus>("submitted");
  const [adminRemarks, setAdminRemarks] = useState<string>("");
  const [isInternalNote, setIsInternalNote] = useState<boolean>(true);
  const [isSaving, startSavingTransition] = useTransition();
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Assignment state
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [selectedResponderId, setSelectedResponderId] = useState<string>("");
  const [selectedFieldResponder, setSelectedFieldResponder] = useState<string>("");
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [assignmentNote, setAssignmentNote] = useState<string>("");
  const [isAssigning, startAssignTransition] = useTransition();
  const [assignSuccessMsg, setAssignSuccessMsg] = useState<string | null>(null);
  const [assignErrorMsg, setAssignErrorMsg] = useState<string | null>(null);

  // Lightbox state for attachment zoom
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Load departments and staff members if not provided via props
  useEffect(() => {
    let isMounted = true;
    if (departments.length > 0) setDepartmentsList(departments);
    if (staffMembers.length > 0) setStaffList(staffMembers);

    if (isOpen && (departments.length === 0 || staffMembers.length === 0)) {
      getAdminAssignmentOptionsAction().then((opts) => {
        if (!isMounted) return;
        if (opts.departments && opts.departments.length > 0) {
          setDepartmentsList(opts.departments);
        }
        if (opts.staffMembers && opts.staffMembers.length > 0) {
          setStaffList(opts.staffMembers);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, departments, staffMembers]);

  // Fetch report data when incidentId changes and drawer opens
  useEffect(() => {
    let isMounted = true;

    if (isOpen && incidentId) {
      setIsLoading(true);
      setErrorMessage(null);
      setSaveSuccessMsg(null);
      setAssignSuccessMsg(null);
      setAssignErrorMsg(null);
      setAdminRemarks("");

      getAdminReportDetailsAction(incidentId)
        .then((res) => {
          if (!isMounted) return;
          if (res.success && res.incident) {
            setIncident(res.incident);
            setSelectedStatus(res.incident.status as IncidentStatus);

            const active = res.incident.assignments?.find((a) => a.unassigned_at === null);
            setSelectedDeptId(active?.department_id || "");
            setSelectedResponderId(active?.assigned_user_id || "");
            setSelectedFieldResponder(active?.field_responder || "");
            setSelectedVehicle(active?.dispatch_vehicle || "");
            setAssignmentNote("");
          } else {
            setErrorMessage(res.error || "Failed to load report details.");
          }
        })
        .catch((err) => {
          if (!isMounted) return;
          console.error("Error fetching report details:", err);
          setErrorMessage("Failed to connect to server. Please try again.");
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    } else {
      setIncident(null);
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, incidentId]);

  // Handle department change with intelligent responder resetting
  const handleDepartmentChange = (deptId: string) => {
    setSelectedDeptId(deptId);
    if (deptId) {
      const stillValid = staffList.some(
        (s) => s.id === selectedResponderId && s.department_id === deptId
      );
      if (!stillValid) {
        setSelectedResponderId("");
      }
    }
  };

  // Handle field responder assignment
  const handleAssignResponder = () => {
    if (!incidentId) return;

    if (!selectedDeptId && !selectedFieldResponder && !selectedVehicle) {
      setAssignErrorMsg("Please choose a department, field responder, or dispatch vehicle.");
      return;
    }

    if (selectedFieldResponder && !FIELD_RESPONDERS.includes(selectedFieldResponder as FieldResponder)) {
      setAssignErrorMsg("Please choose a valid responder from Responder 1–5.");
      return;
    }

    if (selectedVehicle && !DISPATCH_VEHICLES.includes(selectedVehicle as DispatchVehicle)) {
      setAssignErrorMsg("Please choose a valid dispatch vehicle from Vehicle 1–5.");
      return;
    }

    setAssignErrorMsg(null);
    setAssignSuccessMsg(null);

    startAssignTransition(async () => {
      const res = await adminAssignIncidentAction({
        incidentId,
        departmentId: selectedDeptId || null,
        responderId: selectedResponderId || null,
        fieldResponder: (selectedFieldResponder as FieldResponder) || null,
        dispatchVehicle: (selectedVehicle as DispatchVehicle) || null,
        assignmentNote: assignmentNote.trim() || undefined,
      });

      if (res.success) {
        setAssignSuccessMsg("Field responder & department successfully assigned!");
        setAssignmentNote("");

        // Refresh incident details to update UI immediately
        const refreshed = await getAdminReportDetailsAction(incidentId);
        if (refreshed.success && refreshed.incident) {
          setIncident(refreshed.incident);
          setSelectedStatus(refreshed.incident.status as IncidentStatus);
          const active = refreshed.incident.assignments?.find((a) => a.unassigned_at === null);
          setSelectedDeptId(active?.department_id || "");
          setSelectedResponderId(active?.assigned_user_id || "");
          setSelectedFieldResponder(active?.field_responder || "");
        }

        if (onSuccess) {
          onSuccess();
        }
      } else {
        setAssignErrorMsg(res.error || "Failed to assign incident. Please try again.");
      }
    });
  };

  const handleSaveChanges = (markResolved = false) => {
    if (!incidentId) return;

    setErrorMessage(null);
    setSaveSuccessMsg(null);

    startSavingTransition(async () => {
      const res = await updateAdminReportQuickAction({
        incidentId,
        status: markResolved ? "resolved" : selectedStatus,
        adminRemarks: adminRemarks.trim() || undefined,
        isInternalNote,
        markResolved,
      });

      if (res.success) {
        setSaveSuccessMsg(
          markResolved
            ? "Report successfully marked as Resolved!"
            : "Report status & admin remarks saved successfully!"
        );
        setAdminRemarks("");

        // Refresh drawer details
        const refreshed = await getAdminReportDetailsAction(incidentId);
        if (refreshed.success && refreshed.incident) {
          setIncident(refreshed.incident);
          setSelectedStatus(refreshed.incident.status as IncidentStatus);
        }

        if (onSuccess) {
          onSuccess();
        }
      } else {
        setErrorMessage(res.error || "Failed to save changes. Please try again.");
      }
    });
  };

  const formattedDate = incident?.created_at
    ? new Date(incident.created_at).toLocaleDateString("en-PH", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const activeAssignment = incident?.assignments?.find((a) => a.unassigned_at === null);

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-xl md:max-w-2xl p-0 flex flex-col bg-background border-l border-border shadow-2xl overflow-hidden"
        >
          {/* Drawer Header */}
          <SheetHeader className="p-4 sm:p-6 border-b border-border/70 bg-muted/20 shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-600/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                    {incident?.report_number || "Loading..."}
                  </span>
                  {incident && (
                    <>
                      <IncidentStatusBadge status={incident.status} />
                      <IncidentSeverityBadge severity={incident.severity} />
                    </>
                  )}
                </div>
                <SheetTitle className="text-base sm:text-lg font-bold text-foreground truncate pt-0.5">
                  {incident?.title || "Incident Report Details"}
                </SheetTitle>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="size-8 rounded-full text-muted-foreground hover:text-foreground shrink-0"
                aria-label="Close panel"
              >
                <X className="size-4" />
              </Button>
            </div>
            <SheetDescription className="text-xs text-muted-foreground line-clamp-1">
              Civic administration, verified citizen dispatch, and real-time status management
            </SheetDescription>
          </SheetHeader>

          {/* Drawer Content / Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-3 text-muted-foreground">
                <Loader2 className="size-8 animate-spin text-blue-600 dark:text-blue-400" />
                <p className="text-xs font-medium">Loading report records & attachments...</p>
              </div>
            ) : errorMessage && !incident ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center space-y-2">
                <AlertCircle className="size-6 text-destructive mx-auto" />
                <p className="text-xs font-semibold text-destructive">{errorMessage}</p>
                <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
                  Close
                </Button>
              </div>
            ) : incident ? (
              <>
                {/* Feedback Alerts */}
                {saveSuccessMsg && (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="size-4 shrink-0" />
                    <span>{saveSuccessMsg}</span>
                  </div>
                )}
                {errorMessage && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* 1. Resident / Citizen Contact Information */}
                <div className="rounded-xl border border-border/70 bg-card p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between text-xs border-b border-border/50 pb-2">
                    <div className="flex items-center gap-1.5 font-bold text-foreground">
                      <User className="size-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Citizen Reporter</span>
                    </div>
                    {formattedDate && (
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                        <Calendar className="size-3" />
                        <span>{formattedDate}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Full Name</span>
                      <strong className="text-foreground font-semibold">
                        {incident.reporter?.full_name || "Anonymous Resident"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Contact Phone</span>
                      <div className="flex items-center gap-1 text-foreground font-medium">
                        <Phone className="size-3 text-muted-foreground" />
                        <span>{incident.reporter?.phone || "None Listed"}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Registered Barangay</span>
                      <span className="text-foreground font-medium">
                        {incident.reporter?.barangay || "Butuan City"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Incident Summary & Category */}
                <div className="rounded-xl border border-border/70 bg-card p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Report Overview
                    </h4>
                    {incident.category && (
                      <Badge variant="outline" className="text-xs font-medium bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                        {incident.category.name}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-sm sm:text-base font-bold text-foreground">
                      {incident.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap bg-muted/20 p-3 rounded-lg border border-border/40">
                      {incident.description}
                    </p>
                  </div>

                  {/* Location info */}
                  <div className="space-y-2 pt-2 border-t border-border/50 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-foreground">
                        <MapPin className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span>
                          Barangay <strong>{incident.barangay}</strong>
                          {incident.street_area ? `, ${incident.street_area}` : ""}
                          {incident.landmark ? ` • ${incident.landmark}` : ""}
                        </span>
                      </div>
                    </div>

                    {incident.latitude !== null && incident.longitude !== null ? (
                      <div className="pt-1">
                        <IncidentDetailMapView
                          latitude={incident.latitude}
                          longitude={incident.longitude}
                          title={incident.title}
                          barangay={incident.barangay}
                          severity={incident.severity}
                          height="h-[180px] sm:h-[200px]"
                          viewOnMapHref={`/admin/map?reportId=${incident.id}`}
                        />
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 p-2.5 text-xs text-muted-foreground flex items-center gap-2">
                        <MapPin className="size-3.5 text-muted-foreground shrink-0" />
                        <span className="text-[11px]">
                          No GPS coordinates pinned. Manual location: Barangay <strong>{incident.barangay}</strong>
                          {incident.landmark ? ` (${incident.landmark})` : ""}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Attachment Previews */}
                <div className="rounded-xl border border-border/70 bg-card p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Paperclip className="size-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Photographic Evidence ({incident.attachments?.length || 0})</span>
                    </h4>
                  </div>

                  {!incident.attachments || incident.attachments.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic bg-muted/20 p-3 rounded-lg">
                      No photographic attachments uploaded for this report.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {incident.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="group relative rounded-lg border border-border/70 overflow-hidden bg-muted/40 aspect-video flex flex-col justify-between"
                        >
                          {att.signed_url ? (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={att.signed_url}
                                alt={att.original_filename}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                                onClick={() => setPreviewImageUrl(att.signed_url || null)}
                              />
                              <button
                                type="button"
                                onClick={() => setPreviewImageUrl(att.signed_url || null)}
                                className="absolute top-1.5 right-1.5 size-6 rounded-md bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Enlarge photo"
                              >
                                <Maximize2 className="size-3" />
                              </button>
                            </>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-2 text-center">
                              <FileText className="size-5 mb-1" />
                              <span className="text-[10px] truncate max-w-full">
                                {att.original_filename}
                              </span>
                            </div>
                          )}

                          <div className="bg-background/90 backdrop-blur-xs p-1 px-1.5 text-[10px] truncate text-foreground border-t border-border/40 flex items-center justify-between">
                            <span className="truncate">{att.original_filename}</span>
                            {att.signed_url && (
                              <a
                                href={att.signed_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700 ml-1 shrink-0"
                                title="Open full resolution in new tab"
                              >
                                <ExternalLink className="size-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Active Department Dispatch Snapshot & Assignment Form */}
                <div className="rounded-xl border border-border/70 bg-card p-4 shadow-2xs space-y-3.5 text-xs">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2">
                    <div className="flex items-center gap-1.5 font-bold text-foreground">
                      <Building className="size-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Department & Field Responder Assignment</span>
                    </div>
                    {activeAssignment ? (
                      <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                        Dispatched
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
                        Pending Assignment
                      </Badge>
                    )}
                  </div>

                  {/* Current Active Assignment Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted/20 p-3 rounded-lg border border-border/40">
                    <div>
                      <span className="text-[10px] text-muted-foreground block uppercase tracking-wider font-semibold">
                        Assigned Department:
                      </span>
                      <strong className="text-foreground text-xs sm:text-sm font-semibold block mt-0.5">
                        {activeAssignment?.department?.name || "No Department Assigned"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block uppercase tracking-wider font-semibold">
                        Assigned Field Responder:
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <strong className="text-foreground text-xs sm:text-sm font-semibold">
                          {activeAssignment?.field_responder || activeAssignment?.assigned_user?.full_name || "Unassigned"}
                        </strong>
                        {activeAssignment?.field_responder && (
                          <Badge variant="outline" className="text-[9px] py-0 px-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 font-semibold">
                            ACTIVE RESPONDER
                          </Badge>
                        )}
                        {activeAssignment?.assigned_user && !activeAssignment?.field_responder && (
                          <Badge variant="outline" className="text-[9px] py-0 px-1 bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20">
                            {activeAssignment.assigned_user.role.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block uppercase tracking-wider font-semibold">
                        Dispatch Vehicle:
                      </span>
                      <strong className="text-foreground text-xs sm:text-sm font-semibold block mt-0.5">
                        {activeAssignment?.dispatch_vehicle || "Unassigned"}
                      </strong>
                    </div>
                  </div>

                  {/* Assignment / Reassignment Actions */}
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <h5 className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                        <UserCheck className="size-3.5 text-blue-600 dark:text-blue-400" />
                        <span>{activeAssignment ? "Reassign Field Responder" : "Assign to Department & Field Responder"}</span>
                      </h5>
                      {activeAssignment && (
                        <span className="text-[10px] text-muted-foreground">Reassignment preserves audit history</span>
                      )}
                    </div>

                    {assignSuccessMsg && (
                      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                        <CheckCircle2 className="size-3.5 shrink-0" />
                        <span>{assignSuccessMsg}</span>
                      </div>
                    )}
                    {assignErrorMsg && (
                      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive flex items-center gap-2">
                        <AlertCircle className="size-3.5 shrink-0" />
                        <span>{assignErrorMsg}</span>
                      </div>
                    )}

                    {/* Department Dropdown */}
                    <div className="space-y-1">
                      <Label htmlFor="drawer-department" className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                        <Building className="size-3 text-muted-foreground" />
                        <span>Responsible Department</span>
                      </Label>
                      <select
                        id="drawer-department"
                        value={selectedDeptId}
                        disabled={isAssigning}
                        onChange={(e) => handleDepartmentChange(e.target.value)}
                        className="w-full h-8 rounded-lg border border-input bg-background px-2.5 text-xs font-medium shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                      >
                        <option value="">-- Select Department --</option>
                        {departmentsList.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Field Responder Dropdown (Select Responder 1–5) */}
                    <div className="space-y-1">
                      <Label htmlFor="drawer-field-responder" className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                        <UserCheck className="size-3 text-blue-600 dark:text-blue-400" />
                        <span>Field Responder (Select Responder 1–5)</span>
                      </Label>
                      <select
                        id="drawer-field-responder"
                        value={selectedFieldResponder}
                        disabled={isAssigning}
                        onChange={(e) => setSelectedFieldResponder(e.target.value)}
                        className="w-full h-8 rounded-lg border border-input bg-background px-2.5 text-xs font-medium shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                      >
                        <option value="">-- Select Field Responder (Responder 1–5) --</option>
                        {FIELD_RESPONDERS.map((responder) => (
                          <option key={responder} value={responder}>
                            {responder}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Dispatch Vehicle Dropdown (Vehicle 1–5 only) */}
                    <div className="space-y-1">
                      <Label htmlFor="drawer-dispatch-vehicle" className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                        <Truck className="size-3 text-blue-600 dark:text-blue-400" />
                        <span>Dispatch Vehicle (Vehicle 1–5)</span>
                      </Label>
                      <Select
                        value={selectedVehicle || undefined}
                        onValueChange={(val) => setSelectedVehicle((val as string) || "")}
                        disabled={isAssigning}
                      >
                        <SelectTrigger
                          id="drawer-dispatch-vehicle"
                          className="w-full h-8 rounded-lg border border-input bg-background px-2.5 text-xs font-medium shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 justify-between"
                        >
                          <SelectValue placeholder="-- Select Dispatch Vehicle (Vehicle 1–5) --" />
                        </SelectTrigger>
                        <SelectContent>
                          {DISPATCH_VEHICLES.map((v) => (
                            <SelectItem key={v} value={v}>
                              {v}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Optional Remarks */}
                    <div className="space-y-1">
                      <Label htmlFor="drawer-assign-note" className="text-[11px] font-semibold text-foreground block">
                        Internal Remarks / Notes (Optional)
                      </Label>
                      <input
                        id="drawer-assign-note"
                        type="text"
                        value={assignmentNote}
                        onChange={(e) => setAssignmentNote(e.target.value)}
                        disabled={isAssigning}
                        placeholder="e.g. Expedited equipment response requested..."
                        className="w-full h-8 rounded-lg border border-input bg-background px-2.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAssignResponder}
                        disabled={isAssigning || (!selectedDeptId && !selectedFieldResponder)}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold gap-1.5 h-8 shadow-xs"
                      >
                        {isAssigning ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <UserCheck className="size-3.5" />
                        )}
                        <span>{activeAssignment ? "Confirm Reassignment" : "Confirm Assignment"}</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 5. Administrative Control Form (Status Update & Remarks) */}
                <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="size-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Administrative Actions & Remarks</span>
                    </h4>
                    <span className="text-[10px] text-muted-foreground">Admin Access</span>
                  </div>

                  {/* Status Selection Dropdown */}
                  <div className="space-y-1.5">
                    <Label htmlFor="drawer-status-select" className="text-xs font-semibold text-foreground block">
                      Update Incident Status
                    </Label>
                    <select
                      id="drawer-status-select"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value as IncidentStatus)}
                      disabled={isSaving}
                      className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs sm:text-sm font-medium shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      {STATUS_SELECT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label} — {opt.desc}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Administrative Remarks / Timeline Update Textarea */}
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <Label htmlFor="drawer-status-note" className="text-xs font-semibold text-foreground block">
                        Administrative Remarks
                      </Label>

                      {/* Explicit Note Type Switcher */}
                      <div className="inline-flex rounded-lg border border-border/80 bg-background p-0.5 text-xs">
                        <button
                          type="button"
                          onClick={() => setIsInternalNote(true)}
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors",
                            isInternalNote
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <Lock className="size-3" />
                          <span>Internal Note</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsInternalNote(false)}
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors",
                            !isInternalNote
                              ? "bg-blue-600 text-white font-semibold shadow-xs"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <Globe className="size-3" />
                          <span>Public Update</span>
                        </button>
                      </div>
                    </div>

                    <Textarea
                      id="drawer-status-note"
                      value={adminRemarks}
                      onChange={(e) => setAdminRemarks(e.target.value)}
                      disabled={isSaving}
                      rows={3}
                      placeholder={
                        isInternalNote
                          ? "Add internal status change explanation for staff/audit trail (confidential, hidden from residents)..."
                          : "Add official public status update (will be visible to the resident in their portal)..."
                      }
                      className="text-xs sm:text-sm bg-background"
                    />
                  </div>

                  {/* Save and Mark Resolved Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleSaveChanges(false)}
                      disabled={isSaving}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold gap-1.5 shadow-xs"
                    >
                      {isSaving ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Save className="size-3.5" />
                      )}
                      <span>Save Changes</span>
                    </Button>

                    {incident.status !== "resolved" && incident.status !== "closed" && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleSaveChanges(true)}
                        disabled={isSaving}
                        className="border-emerald-500/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-lg text-xs font-semibold gap-1.5"
                      >
                        <CheckCircle2 className="size-3.5" />
                        <span>Mark as Resolved</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* 6. Timeline of Public Updates & Internal Notes */}
                {incident.updates && incident.updates.length > 0 && (
                  <div className="rounded-xl border border-border/70 bg-card p-4 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Timeline & Progress Updates ({incident.updates.length})
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-medium">
                          <Lock className="size-2.5" /> Internal
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400 font-medium">
                          <Globe className="size-2.5" /> Public
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                      {incident.updates.map((upd) => {
                        const isInternal = upd.visibility === "internal";
                        return (
                          <div
                            key={upd.id}
                            className={cn(
                              "p-3 rounded-lg border text-xs space-y-1.5",
                              isInternal
                                ? "bg-amber-500/5 border-amber-500/20"
                                : "bg-blue-500/5 border-blue-500/20"
                            )}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                              <div className="flex items-center gap-1.5">
                                <strong className="font-semibold text-foreground">
                                  {upd.author?.full_name || "Official"}
                                </strong>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[9px] py-0 px-1 font-mono uppercase",
                                    isInternal
                                      ? "border-amber-500/30 text-amber-600 dark:text-amber-400"
                                      : "border-blue-500/30 text-blue-600 dark:text-blue-400"
                                  )}
                                >
                                  {isInternal ? "Internal Note" : "Public Update"}
                                </Badge>
                              </div>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {new Date(upd.created_at).toLocaleDateString("en-PH", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
                              {upd.message}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* Drawer Footer */}
          <SheetFooter className="p-4 border-t border-border/70 bg-muted/20 shrink-0 flex flex-row items-center justify-between sm:justify-between gap-2">
            {incident && (
              <Link
                href={`/admin/reports/${incident.id}`}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium inline-flex items-center gap-1"
                onClick={onClose}
              >
                <span>Open Full Page View</span>
                <ExternalLink className="size-3" />
              </Link>
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

      {/* Lightbox Dialog for Full Image Preview */}
      <Dialog open={!!previewImageUrl} onOpenChange={(open) => !open && setPreviewImageUrl(null)}>
        <DialogContent className="max-w-4xl p-2 bg-black/95 border-border/20 text-white flex flex-col items-center">
          <DialogTitle className="sr-only">Evidence Photo Preview</DialogTitle>
          {previewImageUrl && (
            <div className="relative max-h-[80vh] w-full flex items-center justify-center p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImageUrl}
                alt="Enlarged Evidence"
                className="max-h-[75vh] max-w-full object-contain rounded-md"
              />
            </div>
          )}
          <div className="w-full flex items-center justify-end p-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setPreviewImageUrl(null)}
              className="text-xs"
            >
              Close Preview
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

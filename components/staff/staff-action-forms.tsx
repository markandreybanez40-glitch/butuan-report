"use client";

import { useTransition, useState, useEffect } from "react";
import {
  Activity,
  Lock,
  MessageSquare,
  Send,
  UserCheck,
  Building,
  Loader2,
  AlertTriangle,
  Check,
  Clock,
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
  updateStaffIncidentStatusAction,
  assignIncidentStaffAction,
  addStaffIncidentUpdateAction,
  updateIncidentSeverityAction,
} from "@/app/staff/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  FIELD_RESPONDERS,
  DISPATCH_VEHICLES,
  type IncidentStatus,
  type IncidentSeverity,
  type Department,
  type UserRole,
} from "@/types";

interface StatusUpdateFormProps {
  incidentId: string;
  currentStatus: IncidentStatus;
  userRole: UserRole;
}

export function StatusUpdateForm({
  incidentId,
  currentStatus,
  userRole,
}: StatusUpdateFormProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedStatus, setSelectedStatus] = useState<IncidentStatus>(currentStatus);
  const [note, setNote] = useState("");
  const [feedback, setFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  const isResponder = userRole === "responder";

  const statusOptions: { value: IncidentStatus; label: string }[] = isResponder
    ? [
        { value: "in_progress", label: "In Progress (Field Action)" },
        { value: "resolved", label: "Resolved (Hazard Cleared)" },
      ]
    : [
        { value: "submitted", label: "Submitted (New Report)" },
        { value: "under_review", label: "Under Review (Triage)" },
        { value: "assigned", label: "Assigned to Department/Unit" },
        { value: "in_progress", label: "In Progress (Operations Active)" },
        { value: "resolved", label: "Resolved (Action Completed)" },
        { value: "closed", label: "Closed (Archived)" },
        { value: "rejected", label: "Rejected (Invalid/Out of Scope)" },
        { value: "duplicate", label: "Duplicate Report" },
        { value: "cancelled", label: "Cancelled" },
      ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const formData = new FormData();
    formData.append("incident_id", incidentId);
    formData.append("status", selectedStatus);
    if (note.trim()) {
      formData.append("status_change_note", note.trim());
      formData.append("note", note.trim());
    }

    startTransition(async () => {
      const res = await updateStaffIncidentStatusAction(formData);
      if (res.success) {
        setFeedback({ success: true, msg: `Status updated to ${selectedStatus.toUpperCase().replace("_", " ")}.` });
        setNote("");
      } else {
        setFeedback({ success: false, msg: res.error || "Failed to update status." });
      }
    });
  };

  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Activity className="size-4 text-primary" />
          Update Operational Status
        </CardTitle>
        <CardDescription className="text-xs">
          Transition ticket through municipal dispatch stages
        </CardDescription>
      </CardHeader>
      <CardContent>
        {feedback && (
          <div
            className={`p-2.5 rounded-lg text-xs mb-3 flex items-center gap-1.5 ${
              feedback.success
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                : "bg-destructive/10 text-destructive dark:text-red-400 border border-destructive/20"
            }`}
          >
            {feedback.success ? <Check className="size-3.5 shrink-0" /> : <AlertTriangle className="size-3.5 shrink-0" />}
            <span>{feedback.msg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label htmlFor="status" className="text-xs font-semibold text-foreground">
              Select New Status
            </label>
            <select
              id="status"
              value={selectedStatus}
              disabled={isPending}
              onChange={(e) => setSelectedStatus(e.target.value as IncidentStatus)}
              className="w-full h-8 rounded-md border border-input bg-card px-2.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="status-note" className="text-xs font-semibold text-foreground">
              Status Change Note (Internal Audit Trail)
            </Label>
            <Textarea
              id="status-note"
              placeholder="Explain why the operational status is changing..."
              value={note}
              disabled={isPending}
              onChange={(e) => setNote(e.target.value)}
              className="text-xs bg-card min-h-[64px]"
            />
          </div>

          <Button
            type="submit"
            size="sm"
            disabled={isPending || selectedStatus === currentStatus}
            className="w-full rounded-full text-xs h-8 shadow-xs"
          >
            {isPending ? (
              <>
                <Loader2 className="size-3 animate-spin mr-1" />
                <span>Updating...</span>
              </>
            ) : (
              <span>Save Status Change</span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export interface AssignmentFormProps {
  incidentId: string;
  departments: Department[];
  staffMembers?: {
    id: string;
    full_name: string;
    role: string;
    phone?: string | null;
    department_id?: string | null;
    department?: { id: string; name: string } | null;
  }[];
  currentDepartmentId?: string | null;
  currentResponderId?: string | null;
  currentFieldResponder?: string | null;
  currentDispatchVehicle?: string | null;
  currentStatus?: IncidentStatus;
  showStatusSelector?: boolean;
  userRole?: UserRole;
  onSuccess?: () => void;
}

export function AssignmentForm({
  incidentId,
  departments,
  currentDepartmentId = null,
  currentFieldResponder = null,
  currentDispatchVehicle = null,
  currentStatus,
  showStatusSelector = Boolean(currentStatus),
  userRole = "admin",
  onSuccess,
}: AssignmentFormProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedStatus, setSelectedStatus] = useState<IncidentStatus>(currentStatus || "submitted");
  const [selectedDept, setSelectedDept] = useState(currentDepartmentId || "");
  const [selectedFieldResponder, setSelectedFieldResponder] = useState<string>(currentFieldResponder || "");
  const [selectedVehicle, setSelectedVehicle] = useState<string>(currentDispatchVehicle || "");
  const [feedback, setFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  // Sync state if server revalidates and passes updated props
  useEffect(() => {
    if (currentStatus) setSelectedStatus(currentStatus);
  }, [currentStatus]);

  useEffect(() => {
    setSelectedDept(currentDepartmentId || "");
  }, [currentDepartmentId]);

  useEffect(() => {
    setSelectedFieldResponder(currentFieldResponder || "");
  }, [currentFieldResponder]);

  useEffect(() => {
    setSelectedVehicle(currentDispatchVehicle || "");
  }, [currentDispatchVehicle]);

  const isResponder = userRole === "responder";
  const statusOptions: { value: IncidentStatus; label: string }[] = isResponder
    ? [
        { value: "in_progress", label: "In Progress (Field Action)" },
        { value: "resolved", label: "Resolved (Hazard Cleared)" },
      ]
    : [
        { value: "submitted", label: "Submitted (New Report)" },
        { value: "under_review", label: "Under Review (Triage)" },
        { value: "assigned", label: "Assigned to Department/Unit" },
        { value: "in_progress", label: "In Progress (Operations Active)" },
        { value: "resolved", label: "Resolved (Action Completed)" },
        { value: "closed", label: "Closed (Archived)" },
        { value: "rejected", label: "Rejected (Invalid/Out of Scope)" },
        { value: "duplicate", label: "Duplicate Report" },
        { value: "cancelled", label: "Cancelled" },
      ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const isStatusChanged = Boolean(showStatusSelector && currentStatus && selectedStatus !== currentStatus);
    const isAssignmentSpecified = Boolean(selectedDept || selectedFieldResponder || selectedVehicle);
    const isAssignmentModified =
      selectedDept !== (currentDepartmentId || "") ||
      selectedFieldResponder !== (currentFieldResponder || "") ||
      selectedVehicle !== (currentDispatchVehicle || "");

    const shouldRunAssignment =
      Boolean(selectedDept || selectedFieldResponder || selectedVehicle) &&
      (isAssignmentModified || (!currentDepartmentId && !currentFieldResponder && !currentDispatchVehicle && isAssignmentSpecified));

    if (selectedVehicle && !selectedDept && !selectedFieldResponder) {
      setFeedback({
        success: false,
        msg: "Please select a responsible department or field responder when assigning a dispatch vehicle.",
      });
      return;
    }

    if (!isStatusChanged && !shouldRunAssignment) {
      setFeedback({ success: false, msg: "Please select a new status, department, responder, or vehicle to save." });
      return;
    }

    startTransition(async () => {
      let assignmentError: string | null = null;
      let statusError: string | null = null;

      // 1. Process assignment update if department, field responder, or vehicle was specified / modified
      if (shouldRunAssignment) {
        const formData = new FormData();
        formData.append("incident_id", incidentId);
        if (selectedDept) formData.append("department_id", selectedDept);
        if (selectedFieldResponder) formData.append("field_responder", selectedFieldResponder);
        if (selectedVehicle) formData.append("dispatch_vehicle", selectedVehicle);
        if (isStatusChanged) formData.append("skip_status_update", "true");

        const res = await assignIncidentStaffAction(formData);
        if (!res.success) {
          assignmentError = res.error || "Failed to update assignment.";
        }
      }

      // 2. Process status update if status actually changed
      if (!assignmentError && isStatusChanged) {
        const formData = new FormData();
        formData.append("incident_id", incidentId);
        formData.append("status", selectedStatus);

        const res = await updateStaffIncidentStatusAction(formData);
        if (!res.success) {
          statusError = res.error || "Failed to update status.";
        }
      }

      // If any error occurred, display clear feedback while keeping all entered state untouched
      if (assignmentError || statusError) {
        setFeedback({ success: false, msg: assignmentError || statusError || "Failed to save changes." });
      } else {
        const messages: string[] = [];
        if (isStatusChanged) messages.push(`status updated to ${selectedStatus.toUpperCase().replace("_", " ")}`);
        if (shouldRunAssignment) messages.push("assignment updated");
        setFeedback({
          success: true,
          msg: `Changes saved successfully${messages.length > 0 ? ` (${messages.join(", ")})` : ""}.`,
        });
        if (onSuccess) onSuccess();
      }
    });
  };

  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <UserCheck className="size-4 text-primary" />
          Dispatch & Assignment
        </CardTitle>
        <CardDescription className="text-xs">
          Route incident to municipal departments, assign field responders, and update operational status
        </CardDescription>
      </CardHeader>
      <CardContent>
        {feedback && (
          <div
            className={`p-2.5 rounded-lg text-xs mb-3 flex items-center gap-1.5 ${
              feedback.success
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                : "bg-destructive/10 text-destructive dark:text-red-400 border border-destructive/20"
            }`}
          >
            {feedback.success ? <Check className="size-3.5 shrink-0" /> : <AlertTriangle className="size-3.5 shrink-0" />}
            <span>{feedback.msg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Select New Status */}
          {showStatusSelector && (
            <div className="space-y-1">
              <Label htmlFor="status" className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Clock className="size-3 text-muted-foreground" />
                  <span>Select New Status</span>
                </span>
                {currentStatus && (
                  <span className="text-[10px] text-muted-foreground font-normal">
                    Current: <span className="font-semibold text-foreground">{currentStatus.toUpperCase().replace("_", " ")}</span>
                  </span>
                )}
              </Label>
              <select
                id="status"
                value={selectedStatus}
                disabled={isPending}
                onChange={(e) => setSelectedStatus(e.target.value as IncidentStatus)}
                className="w-full h-8 rounded-md border border-input bg-card px-2.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Department */}
          <div className="space-y-1">
            <Label htmlFor="dept" className="text-xs font-semibold text-foreground flex items-center gap-1">
              <Building className="size-3 text-muted-foreground" />
              <span>Department</span>
            </Label>
            <select
              id="dept"
              value={selectedDept}
              disabled={isPending}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full h-8 rounded-md border border-input bg-card px-2.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">-- Select Department --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Field Responder (Responder 1–5 only) */}
          <div className="space-y-1">
            <Label htmlFor="staff-field-responder" className="text-xs font-semibold text-foreground flex items-center gap-1">
              <UserCheck className="size-3 text-muted-foreground" />
              <span>Field Responder</span>
            </Label>
            <select
              id="staff-field-responder"
              value={selectedFieldResponder}
              disabled={isPending}
              onChange={(e) => setSelectedFieldResponder(e.target.value)}
              className="w-full h-8 rounded-md border border-input bg-card px-2.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">-- Select Field Responder (Responder 1–5) --</option>
              {FIELD_RESPONDERS.map((responder) => (
                <option key={responder} value={responder}>
                  {responder}
                </option>
              ))}
            </select>
          </div>

          {/* Dispatch Vehicle (Vehicle 1–5 only) using shadcn Select */}
          <div className="space-y-1">
            <Label htmlFor="dispatch-vehicle" className="text-xs font-semibold text-foreground flex items-center gap-1">
              <Truck className="size-3 text-muted-foreground" />
              <span>Dispatch Vehicle</span>
            </Label>
            <Select
              value={selectedVehicle || null}
              onValueChange={(val) => setSelectedVehicle((val as string) || "")}
              disabled={isPending}
            >
              <SelectTrigger
                id="dispatch-vehicle"
                data-testid="dispatch-vehicle-trigger"
                className="w-full h-8 rounded-md border border-input bg-card px-2.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring justify-between"
              >
                <SelectValue placeholder="-- Select Dispatch Vehicle (Vehicle 1–5) --" />
              </SelectTrigger>
              <SelectContent>
                {DISPATCH_VEHICLES.map((vehicle) => (
                  <SelectItem key={vehicle} value={vehicle}>
                    {vehicle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            size="sm"
            disabled={isPending}
            className="w-full rounded-full text-xs h-8 shadow-xs"
          >
            {isPending ? (
              <>
                <Loader2 className="size-3 animate-spin mr-1" />
                <span>Saving changes...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

interface AddUpdateFormProps {
  incidentId: string;
}

export function AddUpdateForm({ incidentId }: AddUpdateFormProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [visibility, setVisibility] = useState<"public" | "internal">("public");
  const [feedback, setFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!message.trim() || message.trim().length < 3) {
      setFeedback({ success: false, msg: "Message must be at least 3 characters." });
      return;
    }

    const formData = new FormData();
    formData.append("incident_id", incidentId);
    formData.append("message", message.trim());
    formData.append("visibility", visibility);

    startTransition(async () => {
      const res = await addStaffIncidentUpdateAction(formData);
      if (res.success) {
        setFeedback({
          success: true,
          msg: visibility === "public" ? "Public update published to timeline." : "Internal note saved.",
        });
        setMessage("");
      } else {
        setFeedback({ success: false, msg: res.error || "Failed to add update." });
      }
    });
  };

  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <MessageSquare className="size-4 text-primary" />
          Add Timeline Update or Note
        </CardTitle>
        <CardDescription className="text-xs">
          Publish public notices to citizens or record internal staff notes
        </CardDescription>
      </CardHeader>
      <CardContent>
        {feedback && (
          <div
            className={`p-2.5 rounded-lg text-xs mb-3 flex items-center gap-1.5 ${
              feedback.success
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                : "bg-destructive/10 text-destructive dark:text-red-400 border border-destructive/20"
            }`}
          >
            {feedback.success ? <Check className="size-3.5 shrink-0" /> : <AlertTriangle className="size-3.5 shrink-0" />}
            <span>{feedback.msg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Visibility Toggle */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground block">Visibility</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setVisibility("public")}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold border text-center transition-all ${
                  visibility === "public"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/40 text-muted-foreground border-border/70 hover:bg-muted"
                }`}
              >
                Public Update
              </button>

              <button
                type="button"
                onClick={() => setVisibility("internal")}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold border text-center transition-all flex items-center justify-center gap-1.5 ${
                  visibility === "internal"
                    ? "bg-amber-600 text-white border-amber-600 dark:bg-amber-700"
                    : "bg-muted/40 text-muted-foreground border-border/70 hover:bg-muted"
                }`}
              >
                <Lock className="size-3" />
                <span>Internal Note</span>
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {visibility === "public"
                ? "Visible to the reporting citizen on their dashboard timeline."
                : "Strictly private to staff. Citizens cannot see this entry."}
            </p>
          </div>

          {/* Message Textarea */}
          <div className="space-y-1">
            <label htmlFor="update-message" className="text-xs font-semibold text-foreground">
              Update Message
            </label>
            <Textarea
              id="update-message"
              rows={3}
              placeholder={
                visibility === "public"
                  ? "e.g. CEO crew is on-site conducting road clearing..."
                  : "e.g. Contacted CDRRMO unit 3; waiting for water pump truck..."
              }
              value={message}
              disabled={isPending}
              onChange={(e) => setMessage(e.target.value)}
              className="text-xs bg-card resize-y"
            />
          </div>

          <Button
            type="submit"
            size="sm"
            disabled={isPending || !message.trim()}
            className="w-full rounded-full text-xs h-8 shadow-xs gap-1.5"
          >
            {isPending ? (
              <>
                <Loader2 className="size-3 animate-spin mr-1" />
                <span>Posting...</span>
              </>
            ) : (
              <>
                <Send className="size-3" />
                <span>Post {visibility === "public" ? "Public Update" : "Internal Note"}</span>
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

interface SeverityUpdateFormProps {
  incidentId: string;
  currentSeverity: IncidentSeverity;
}

export function SeverityUpdateForm({
  incidentId,
  currentSeverity,
}: SeverityUpdateFormProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedSeverity, setSelectedSeverity] = useState<IncidentSeverity>(currentSeverity);
  const [feedback, setFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  const severityOptions: { value: IncidentSeverity; label: string; desc: string }[] = [
    { value: "low", label: "Low", desc: "Minor civic nuisance or non-urgent repair" },
    { value: "medium", label: "Medium", desc: "Moderate hazard affecting neighborhood traffic" },
    { value: "high", label: "High", desc: "Significant obstruction or property hazard" },
    { value: "critical", label: "Critical", desc: "Severe emergency posing active public danger" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const formData = new FormData();
    formData.append("incident_id", incidentId);
    formData.append("severity", selectedSeverity);

    startTransition(async () => {
      const res = await updateIncidentSeverityAction(formData);
      if (res.success) {
        setFeedback({ success: true, msg: `Severity updated to ${selectedSeverity.toUpperCase()}.` });
      } else {
        setFeedback({ success: false, msg: res.error || "Failed to update severity." });
      }
    });
  };

  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <AlertTriangle className="size-4 text-amber-500" />
          Set Priority & Severity
        </CardTitle>
        <CardDescription className="text-xs">
          Calibrate emergency triage priority for municipal dispatch
        </CardDescription>
      </CardHeader>
      <CardContent>
        {feedback && (
          <div
            className={`p-2.5 rounded-lg text-xs mb-3 flex items-center gap-1.5 ${
              feedback.success
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                : "bg-destructive/10 text-destructive dark:text-red-400 border border-destructive/20"
            }`}
          >
            {feedback.success ? <Check className="size-3.5 shrink-0" /> : <AlertTriangle className="size-3.5 shrink-0" />}
            <span>{feedback.msg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label htmlFor="severity" className="text-xs font-semibold text-foreground">
              Select Severity Level
            </label>
            <select
              id="severity"
              value={selectedSeverity}
              disabled={isPending}
              onChange={(e) => setSelectedSeverity(e.target.value as IncidentSeverity)}
              className="w-full h-8 rounded-md border border-input bg-card px-2.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {severityOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} — {opt.desc}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="submit"
            size="sm"
            disabled={isPending || selectedSeverity === currentSeverity}
            className="w-full rounded-full text-xs h-8 shadow-xs"
          >
            {isPending ? (
              <>
                <Loader2 className="size-3 animate-spin mr-1" />
                <span>Updating Priority...</span>
              </>
            ) : (
              <span>Save Severity Level</span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

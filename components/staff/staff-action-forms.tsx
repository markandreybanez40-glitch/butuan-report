"use client";

import { useTransition, useState } from "react";
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
} from "lucide-react";
import {
  updateStaffIncidentStatusAction,
  assignIncidentStaffAction,
  addStaffIncidentUpdateAction,
  updateIncidentSeverityAction,
} from "@/app/staff/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import type { IncidentStatus, IncidentSeverity, Department, UserRole } from "@/types";

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
    if (note.trim()) formData.append("note", note.trim());

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
            <label htmlFor="status-note" className="text-xs font-semibold text-foreground">
              Status Change Note (Optional)
            </label>
            <Input
              id="status-note"
              placeholder="e.g. Field crew dispatched to clear debris..."
              value={note}
              disabled={isPending}
              onChange={(e) => setNote(e.target.value)}
              className="text-xs bg-card h-8"
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

interface AssignmentFormProps {
  incidentId: string;
  departments: Department[];
  staffMembers: { id: string; full_name: string; role: string }[];
  currentDepartmentId?: string | null;
  currentResponderId?: string | null;
}

export function AssignmentForm({
  incidentId,
  departments,
  staffMembers,
  currentDepartmentId = null,
  currentResponderId = null,
}: AssignmentFormProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedDept, setSelectedDept] = useState(currentDepartmentId || "");
  const [selectedResponder, setSelectedResponder] = useState(currentResponderId || "");
  const [note, setNote] = useState("");
  const [feedback, setFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!selectedDept && !selectedResponder) {
      setFeedback({ success: false, msg: "Please choose a department or a responder to assign." });
      return;
    }

    const formData = new FormData();
    formData.append("incident_id", incidentId);
    if (selectedDept) formData.append("department_id", selectedDept);
    if (selectedResponder) formData.append("assigned_user_id", selectedResponder);
    if (note.trim()) formData.append("assignment_note", note.trim());

    startTransition(async () => {
      const res = await assignIncidentStaffAction(formData);
      if (res.success) {
        setFeedback({ success: true, msg: "Assignment updated successfully." });
        setNote("");
      } else {
        setFeedback({ success: false, msg: res.error || "Failed to update assignment." });
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
          Route incident to municipal departments and response units
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
            <label htmlFor="dept" className="text-xs font-semibold text-foreground flex items-center gap-1">
              <Building className="size-3 text-muted-foreground" />
              <span>Department</span>
            </label>
            <select
              id="dept"
              value={selectedDept}
              disabled={isPending}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full h-8 rounded-md border border-input bg-card px-2.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">-- No Department Assigned --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="responder" className="text-xs font-semibold text-foreground flex items-center gap-1">
              <UserCheck className="size-3 text-muted-foreground" />
              <span>Field Responder</span>
            </label>
            <select
              id="responder"
              value={selectedResponder}
              disabled={isPending}
              onChange={(e) => setSelectedResponder(e.target.value)}
              className="w-full h-8 rounded-md border border-input bg-card px-2.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">-- No Specific Responder --</option>
              {staffMembers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} ({s.role.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="assign-note" className="text-xs font-semibold text-foreground">
              Internal Dispatch Instruction (Optional)
            </label>
            <Input
              id="assign-note"
              placeholder="e.g. Priority dispatch for heavy equipment..."
              value={note}
              disabled={isPending}
              onChange={(e) => setNote(e.target.value)}
              className="text-xs bg-card h-8"
            />
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
                <span>Assigning...</span>
              </>
            ) : (
              <span>Save Assignment</span>
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

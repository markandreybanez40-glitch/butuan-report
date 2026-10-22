"use client";

import {
  FileText,
  Clock,
  Building2,
  Activity,
  CheckCircle2,
  Archive,
  XCircle,
  CopyCheck,
  AlertTriangle,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { IncidentStatus } from "@/types";

interface IncidentStatusStepperProps {
  currentStatus: IncidentStatus;
  createdDate?: string;
  resolvedDate?: string | null;
  closedDate?: string | null;
  assignedDepartment?: string | null;
}

const STEP_SEQUENCE: {
  status: IncidentStatus;
  label: string;
  shortDesc: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    status: "submitted",
    label: "Submitted",
    shortDesc: "Report filed in city system",
    icon: FileText,
  },
  {
    status: "under_review",
    label: "Under Review",
    shortDesc: "Dispatcher evaluation",
    icon: Clock,
  },
  {
    status: "assigned",
    label: "Assigned",
    shortDesc: "Routed to department",
    icon: Building2,
  },
  {
    status: "in_progress",
    label: "In Progress",
    shortDesc: "Field responders active",
    icon: Activity,
  },
  {
    status: "resolved",
    label: "Resolved",
    shortDesc: "Action completed on-site",
    icon: CheckCircle2,
  },
  {
    status: "closed",
    label: "Closed",
    shortDesc: "Verified and archived",
    icon: Archive,
  },
];

const TERMINAL_STATUSES: Record<
  string,
  {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    variant: "destructive" | "secondary" | "outline";
    className: string;
  }
> = {
  rejected: {
    title: "Report Rejected",
    description: "This filing was reviewed by city dispatchers and determined to be out of municipal jurisdiction or invalid.",
    icon: XCircle,
    variant: "destructive",
    className: "border-destructive/30 bg-destructive/5 text-destructive dark:text-red-400",
  },
  duplicate: {
    title: "Duplicate Filing",
    description: "This incident was consolidated with an existing active report already under management by city responders.",
    icon: CopyCheck,
    variant: "secondary",
    className: "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400",
  },
  cancelled: {
    title: "Report Cancelled",
    description: "This incident submission has been withdrawn and cancelled.",
    icon: AlertTriangle,
    variant: "outline",
    className: "border-muted bg-muted/30 text-muted-foreground",
  },
};

export function IncidentStatusStepper({
  currentStatus,
  assignedDepartment,
}: IncidentStatusStepperProps) {
  // Check if status is a terminal / special status
  const terminalConfig = TERMINAL_STATUSES[currentStatus];

  if (terminalConfig) {
    const TerminalIcon = terminalConfig.icon;
    return (
      <div className={cn("rounded-2xl border p-5 shadow-xs space-y-2", terminalConfig.className)}>
        <div className="flex items-center gap-2 font-bold text-sm sm:text-base">
          <TerminalIcon className="size-5 shrink-0" />
          <span>{terminalConfig.title}</span>
        </div>
        <p className="text-xs sm:text-sm leading-relaxed opacity-90">
          {terminalConfig.description}
        </p>
      </div>
    );
  }

  // Find index of current status in the progression sequence
  const currentStepIndex = STEP_SEQUENCE.findIndex((s) => s.status === currentStatus);
  const activeIndex = currentStepIndex === -1 ? 0 : currentStepIndex;

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <span>Resolution Lifecycle</span>
            <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5 py-0">
              Live Progress
            </Badge>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time milestone tracking as city officials and responders process your submission
          </p>
        </div>

        {assignedDepartment && (
          <div className="inline-flex items-center gap-1.5 text-xs bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full self-start sm:self-center font-medium">
            <Building2 className="size-3.5 shrink-0" />
            <span>Assigned: <strong>{assignedDepartment}</strong></span>
          </div>
        )}
      </div>

      {/* Responsive Stepper */}
      <div className="relative">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {STEP_SEQUENCE.map((step, index) => {
            const isCompleted = index < activeIndex;
            const isCurrent = index === activeIndex;
            const StepIcon = step.icon;

            return (
              <div
                key={step.status}
                className={cn(
                  "relative rounded-xl border p-3 flex flex-col justify-between transition-all gap-2 text-xs",
                  isCurrent
                    ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/30"
                    : isCompleted
                    ? "border-emerald-500/30 bg-emerald-500/5 text-foreground"
                    : "border-border/60 bg-muted/20 text-muted-foreground opacity-60"
                )}
              >
                {/* Step Header */}
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-mono font-semibold opacity-70">
                    Step {index + 1}
                  </span>
                  {isCompleted ? (
                    <div className="size-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                      <Check className="size-2.5 stroke-[3]" />
                    </div>
                  ) : isCurrent ? (
                    <div className="size-2 rounded-full bg-primary animate-ping" />
                  ) : null}
                </div>

                {/* Step Icon & Label */}
                <div className="space-y-1 my-1">
                  <div className="flex items-center gap-1.5">
                    <StepIcon
                      className={cn(
                        "size-4",
                        isCurrent
                          ? "text-primary"
                          : isCompleted
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground"
                      )}
                    />
                    <strong
                      className={cn(
                        "text-xs block truncate",
                        isCurrent ? "text-primary font-bold" : isCompleted ? "text-foreground font-semibold" : "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </strong>
                  </div>
                  <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight">
                    {step.shortDesc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

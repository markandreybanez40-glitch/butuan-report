import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Eye,
  UserCheck,
  Activity,
  CheckCircle2,
  Archive,
  XCircle,
  Ban,
} from "lucide-react";
import type { IncidentStatus, IncidentSeverity } from "@/types";

export function IncidentStatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase() as IncidentStatus;

  switch (normalized) {
    case "submitted":
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400 gap-1.5 font-medium">
          <Clock className="size-3" />
          <span>Submitted</span>
        </Badge>
      );
    case "under_review":
      return (
        <Badge variant="outline" className="bg-sky-500/10 text-sky-600 border-sky-500/30 dark:text-sky-400 gap-1.5 font-medium">
          <Eye className="size-3" />
          <span>Under Review</span>
        </Badge>
      );
    case "assigned":
      return (
        <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30 dark:text-purple-400 gap-1.5 font-medium">
          <UserCheck className="size-3" />
          <span>Assigned</span>
        </Badge>
      );
    case "in_progress":
      return (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30 dark:text-blue-400 gap-1.5 font-medium">
          <Activity className="size-3" />
          <span>In Progress</span>
        </Badge>
      );
    case "resolved":
      return (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400 gap-1.5 font-medium">
          <CheckCircle2 className="size-3" />
          <span>Resolved</span>
        </Badge>
      );
    case "closed":
      return (
        <Badge variant="outline" className="bg-zinc-500/10 text-zinc-600 border-zinc-500/30 dark:text-zinc-400 gap-1.5 font-medium">
          <Archive className="size-3" />
          <span>Closed</span>
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30 dark:text-red-400 gap-1.5 font-medium">
          <XCircle className="size-3" />
          <span>Rejected</span>
        </Badge>
      );
    case "cancelled":
      return (
        <Badge variant="outline" className="bg-zinc-500/10 text-zinc-500 border-zinc-500/30 gap-1.5 font-medium">
          <Ban className="size-3" />
          <span>Cancelled</span>
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="gap-1.5">
          <span>{status}</span>
        </Badge>
      );
  }
}

export function IncidentSeverityBadge({ severity }: { severity: string }) {
  const normalized = severity.toLowerCase() as IncidentSeverity;

  switch (normalized) {
    case "critical":
      return (
        <Badge variant="destructive" className="font-semibold uppercase text-[10px] tracking-wider">
          Critical
        </Badge>
      );
    case "high":
      return (
        <Badge variant="outline" className="bg-orange-500/15 text-orange-600 border-orange-500/40 dark:text-orange-400 font-semibold uppercase text-[10px] tracking-wider">
          High
        </Badge>
      );
    case "medium":
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400 font-medium uppercase text-[10px] tracking-wider">
          Medium
        </Badge>
      );
    case "low":
    default:
      return (
        <Badge variant="secondary" className="font-medium uppercase text-[10px] tracking-wider text-muted-foreground">
          Low
        </Badge>
      );
  }
}

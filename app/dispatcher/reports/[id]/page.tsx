import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  FileText,
  Lock,
  MapPin,
  Paperclip,
  ShieldAlert,
  User,
  ExternalLink,
  Building,
  Activity,
} from "lucide-react";
import { getCurrentProfile } from "@/lib/data/profiles";
import { getStaffIncidentDetails, getAssignableStaff } from "@/lib/data/staff";
import { getActiveDepartments } from "@/lib/data/departments";
import { DispatcherHeader } from "@/components/dispatcher/dispatcher-header";
import { IncidentStatusBadge, IncidentSeverityBadge } from "@/components/dashboard/status-badge";
import {
  StatusUpdateForm,
  AssignmentForm,
  AddUpdateForm,
  SeverityUpdateForm,
} from "@/components/staff/staff-action-forms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { IncidentDetailMapView } from "@/components/map/incident-detail-map-view";
import type { IncidentStatus, IncidentSeverity } from "@/types";

interface DispatcherReportDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Incident Triage & Dispatch | Butuan Report",
  description: "Incident details, departmental routing, severity calibration, and citizen updates",
};

export default async function DispatcherReportDetailPage({ params }: DispatcherReportDetailPageProps) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "dispatcher") {
    redirect("/dashboard");
  }

  const incident = await getStaffIncidentDetails(id, profile);

  if (!incident) {
    return (
      <>
        <DispatcherHeader title="Report Not Found" />
        <main className="flex-1 p-6 lg:p-12 max-w-2xl mx-auto flex flex-col items-center justify-center text-center space-y-4">
          <div className="size-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <ShieldAlert className="size-7 text-destructive" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-foreground">Incident Record Not Found</h1>
            <p className="text-sm text-muted-foreground">
              The requested report could not be found or has been removed.
            </p>
          </div>
          <Link
            href="/dispatcher/reports"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            &larr; Back to Reports Queue
          </Link>
        </main>
      </>
    );
  }

  const departments = await getActiveDepartments();
  const assignableStaff = await getAssignableStaff();

  const formattedDate = new Date(incident.created_at).toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const activeAssignment = incident.assignments.find((a) => a.unassigned_at === null);

  return (
    <>
      <DispatcherHeader
        title={`Report ${incident.report_number}`}
        subtitle={`Submitted on ${formattedDate} in Barangay ${incident.barangay}`}
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Top Navigation & Status Badges */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-border/60">
          <Link
            href="/dispatcher/reports"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
          >
            <ArrowLeft className="size-3.5" />
            Back to Reports Queue
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {incident.report_number}
            </span>
            <IncidentStatusBadge status={incident.status} />
            <IncidentSeverityBadge severity={incident.severity} />
            {incident.category && (
              <Badge variant="outline" className="text-xs">
                {incident.category.name}
              </Badge>
            )}
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Details, Attachments, Location, Timeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description & Citizen Info */}
            <Card className="border-border/80 shadow-2xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-bold text-foreground">
                  {incident.title}
                </CardTitle>
                <CardDescription className="text-xs">
                  Barangay {incident.barangay}
                  {incident.landmark ? ` • Landmark: ${incident.landmark}` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Description & Hazard Details
                  </h4>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {incident.description}
                  </p>
                </div>

                {/* Reporter Information Box */}
                <div className="rounded-lg border border-border/70 bg-muted/40 p-3.5 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <User className="size-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Citizen Reporter Profile</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-muted-foreground">
                    <div>
                      <span className="text-[11px] block">Full Name:</span>
                      <strong className="text-foreground">
                        {incident.reporter?.full_name || "Anonymous Resident"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[11px] block">Contact Phone:</span>
                      <strong className="text-foreground">
                        {incident.reporter?.phone || "None Provided"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[11px] block">Registered Barangay:</span>
                      <strong className="text-foreground">
                        {incident.reporter?.barangay || "Butuan City"}
                      </strong>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Evidence & Photo Attachments */}
            <Card className="border-border/80 shadow-2xs">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Paperclip className="size-4 text-amber-600 dark:text-amber-400" />
                    Evidence & Photographic Attachments ({incident.attachments.length})
                  </CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Secure citizen evidence stored in protected Supabase vault
                </CardDescription>
              </CardHeader>
              <CardContent>
                {incident.attachments.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    No photographic evidence uploaded for this report.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {incident.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="group relative rounded-xl border border-border/70 overflow-hidden bg-muted/30 flex flex-col"
                      >
                        {att.signed_url ? (
                          <div className="aspect-video w-full bg-muted flex items-center justify-center overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={att.signed_url}
                              alt={att.original_filename}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        ) : (
                          <div className="aspect-video w-full bg-muted flex items-center justify-center text-muted-foreground text-xs">
                            <FileText className="size-6" />
                          </div>
                        )}
                        <div className="p-2 text-xs flex items-center justify-between gap-1 bg-card">
                          <span className="truncate text-[11px] font-medium text-foreground">
                            {att.original_filename}
                          </span>
                          {att.signed_url && (
                            <a
                              href={att.signed_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-amber-600 hover:text-amber-700 shrink-0"
                              title="View Full Resolution"
                            >
                              <ExternalLink className="size-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Geographic Map & Coordinates */}
            <Card className="border-border/80 shadow-2xs">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <MapPin className="size-4 text-amber-600 dark:text-amber-400" />
                    Geographic Location
                  </CardTitle>
                  {incident.latitude !== null && incident.longitude !== null && (
                    <span className="text-xs font-mono text-muted-foreground">
                      {incident.latitude.toFixed(6)}, {incident.longitude.toFixed(6)}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl border border-border/80 p-3 bg-muted/30 text-xs">
                  <span className="font-semibold text-foreground">
                    Barangay {incident.barangay}
                  </span>
                  {incident.street_area && (
                    <p className="text-muted-foreground mt-0.5">Street: {incident.street_area}</p>
                  )}
                  {incident.landmark && (
                    <p className="text-muted-foreground mt-0.5">Landmark: {incident.landmark}</p>
                  )}
                </div>

                {incident.latitude !== null && incident.longitude !== null ? (
                  <div className="pt-1">
                    <IncidentDetailMapView
                      latitude={incident.latitude}
                      longitude={incident.longitude}
                      title={incident.title}
                      barangay={incident.barangay}
                      severity={incident.severity}
                      height="h-[220px] sm:h-[260px]"
                      viewOnMapHref={`/staff/map?reportId=${incident.id}`}
                    />
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-3.5 text-xs text-muted-foreground flex items-start gap-2.5">
                    <MapPin className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-semibold text-foreground">No GPS Coordinates Pinned</p>
                      <p className="text-[11px] leading-relaxed">
                        This report was submitted using descriptive address references without geographic coordinates.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Updates & Notes Timeline */}
            <Card className="border-border/80 shadow-2xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Activity className="size-4 text-amber-600 dark:text-amber-400" />
                  Incident Progress & Update History ({incident.updates.length})
                </CardTitle>
                <CardDescription className="text-xs">
                  Chronological record of public updates and internal operational notes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {incident.updates.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    No progress updates or internal notes recorded yet.
                  </p>
                ) : (
                  <div className="space-y-3 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
                    {incident.updates.map((upd) => {
                      const updateTime = new Date(upd.created_at).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      const isInternal = upd.visibility === "internal";

                      return (
                        <div key={upd.id} className="relative pl-8 space-y-1">
                          <div
                            className={cn(
                              "absolute left-2 top-1.5 size-3.5 rounded-full border-2 border-background",
                              isInternal
                                ? "bg-amber-500"
                                : "bg-blue-600 dark:bg-blue-400"
                            )}
                          />

                          <div
                            className={cn(
                              "rounded-xl border p-3 text-xs space-y-1.5",
                              isInternal
                                ? "bg-amber-500/5 border-amber-500/20 text-foreground"
                                : "bg-card border-border/80 text-foreground"
                            )}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-1">
                              <div className="flex items-center gap-1.5">
                                <strong className="text-foreground text-xs">
                                  {upd.author?.full_name || "Official"}
                                </strong>
                                <Badge
                                  variant={isInternal ? "secondary" : "outline"}
                                  className="text-[10px] py-0 px-1"
                                >
                                  {upd.author?.role?.toUpperCase() || "STAFF"}
                                </Badge>
                                {isInternal && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] py-0 px-1 text-amber-600 dark:text-amber-400 border-amber-500/30 flex items-center gap-0.5"
                                  >
                                    <Lock className="size-2.5" />
                                    Internal Note
                                  </Badge>
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {updateTime}
                              </span>
                            </div>

                            <p className="leading-relaxed whitespace-pre-wrap">{upd.message}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Dispatcher Action Panels */}
          <div className="space-y-6">
            {/* Snapshot */}
            <Card className="border-border/80 shadow-2xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-foreground">
                  Active Dispatch Snapshot
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Current Status:</span>
                  <IncidentStatusBadge status={incident.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Severity Level:</span>
                  <IncidentSeverityBadge severity={incident.severity} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Department:</span>
                  <span className="font-semibold text-foreground">
                    {activeAssignment?.department?.name || "None Assigned"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Lead Responder:</span>
                  <span className="font-semibold text-foreground">
                    {activeAssignment?.assigned_user?.full_name || "Unassigned"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Department & Responder Assignment Form */}
            <Card className="border-border/80 shadow-2xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Building className="size-4 text-amber-600 dark:text-amber-400" />
                  Assign Department & Officer
                </CardTitle>
                <CardDescription className="text-xs">
                  Route to responsible municipal agency and field responder
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AssignmentForm
                  incidentId={incident.id}
                  currentDepartmentId={activeAssignment?.department_id || null}
                  currentResponderId={activeAssignment?.assigned_user_id || null}
                  currentFieldResponder={activeAssignment?.field_responder || null}
                  currentDispatchVehicle={activeAssignment?.dispatch_vehicle || null}
                  departments={departments}
                  staffMembers={assignableStaff}
                />
              </CardContent>
            </Card>

            {/* Status Update Form */}
            <Card className="border-border/80 shadow-2xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Clock className="size-4 text-amber-600 dark:text-amber-400" />
                  Update Workflow Status
                </CardTitle>
                <CardDescription className="text-xs">
                  Advance operational status or mark resolved / closed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StatusUpdateForm
                  incidentId={incident.id}
                  currentStatus={incident.status as IncidentStatus}
                  userRole="dispatcher"
                />
              </CardContent>
            </Card>

            {/* Severity Adjustment */}
            <SeverityUpdateForm
              incidentId={incident.id}
              currentSeverity={incident.severity as IncidentSeverity}
            />

            {/* Add Public Update or Internal Note */}
            <Card className="border-border/80 shadow-2xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <FileText className="size-4 text-amber-600 dark:text-amber-400" />
                  Post Incident Note
                </CardTitle>
                <CardDescription className="text-xs">
                  Publish updates visible to the resident or confidential internal notes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AddUpdateForm incidentId={incident.id} />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}

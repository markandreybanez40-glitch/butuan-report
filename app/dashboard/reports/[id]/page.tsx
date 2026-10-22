import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  FileText,
  Paperclip,
  AlertTriangle,
  ShieldCheck,
  ExternalLink,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { getMyIncidentWithDetails } from "@/lib/data/incidents";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { IncidentStatusStepper } from "@/components/dashboard/incident-status-stepper";
import { IncidentStatusBadge, IncidentSeverityBadge } from "@/components/dashboard/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { IncidentDetailMapView } from "@/components/map/incident-detail-map-view";
import type { IncidentStatus } from "@/types";

export const dynamic = "force-dynamic";

interface ReportDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ReportDetailsPage({ params }: ReportDetailsPageProps) {
  const { id } = await params;
  const incident = await getMyIncidentWithDetails(id);

  if (!incident) {
    return (
      <>
        <DashboardHeader title="Report Details" />
        <main className="flex-1 p-6 sm:p-12 max-w-4xl mx-auto w-full">
          <Card className="p-10 text-center border-dashed">
            <AlertTriangle className="size-10 text-amber-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-foreground">Report Not Found</h2>
            <p className="text-sm text-muted-foreground mt-2 mb-6 max-w-md mx-auto">
              This incident either does not exist or you do not have permission to view it. Reports are restricted to their submitting residents.
            </p>
            <Link
              href="/dashboard/my-reports"
              className={cn(buttonVariants({ size: "sm" }), "rounded-full")}
            >
              <ArrowLeft className="mr-1.5 size-4" />
              Return to My Reports
            </Link>
          </Card>
        </main>
      </>
    );
  }

  const formattedCreated = new Date(incident.created_at).toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const formattedUpdated = new Date(incident.updated_at).toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const formattedResolved = incident.resolved_at
    ? new Date(incident.resolved_at).toLocaleDateString("en-PH", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const activeAssignment = incident.assignments?.find((a) => a.unassigned_at === null);
  const assignedDepartmentName = activeAssignment?.department?.name || null;

  return (
    <>
      <DashboardHeader
        title={`Report ${incident.report_number}`}
        subtitle="Detailed tracking and municipal progress timeline"
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl w-full mx-auto">
        {/* Top Back Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/my-reports"
            className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span>Back to My Reports</span>
          </Link>

          <span className="font-mono text-xs text-muted-foreground">
            ID: <span className="font-semibold text-foreground">{incident.report_number}</span>
          </span>
        </div>

        {/* Header Summary Banner */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-md">
                {incident.report_number}
              </span>
              <IncidentStatusBadge status={incident.status} />
              <IncidentSeverityBadge severity={incident.severity} />
              {incident.category && (
                <Badge variant="outline" className="text-xs font-normal">
                  {incident.category.name}
                </Badge>
              )}
            </div>

            <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1">
                <Calendar className="size-3.5 text-muted-foreground" />
                <span>Submitted {formattedCreated}</span>
              </div>
              <span>&bull;</span>
              <div className="flex items-center gap-1">
                <Clock className="size-3.5 text-muted-foreground" />
                <span>Last Updated {formattedUpdated}</span>
              </div>
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {incident.title}
            </h1>
          </div>
        </div>

        {/* Lifecycle Status Stepper Progression */}
        <IncidentStatusStepper
          currentStatus={incident.status as IncidentStatus}
          createdDate={formattedCreated}
          resolvedDate={formattedResolved}
          closedDate={incident.closed_at}
          assignedDepartment={assignedDepartmentName}
        />

        {/* Two Column Layout: Details & Updates on Left, Metadata & Attachments on Right */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Left Column (2 Cols): Description, Location, and Timeline */}
          <div className="md:col-span-2 space-y-6">
            {/* Description Card */}
            <Card className="border-border/70 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <FileText className="size-4 text-primary" />
                  Incident Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                  {incident.description}
                </p>
              </CardContent>
            </Card>

            {/* Location Details Card */}
            <Card className="border-border/70 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <MapPin className="size-4 text-primary" />
                  Incident Location
                </CardTitle>
                <CardDescription className="text-xs">
                  Accurate municipal coordinates and neighborhood references
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/40 p-3">
                    <span className="text-xs text-muted-foreground block font-medium">Barangay</span>
                    <span className="font-semibold text-foreground">{incident.barangay}</span>
                  </div>

                  <div className="rounded-lg bg-muted/40 p-3">
                    <span className="text-xs text-muted-foreground block font-medium">Street / Area</span>
                    <span className="font-semibold text-foreground">
                      {incident.street_area || "Not specified"}
                    </span>
                  </div>
                </div>

                {incident.landmark && (
                  <div className="rounded-lg bg-muted/40 p-3">
                    <span className="text-xs text-muted-foreground block font-medium">Nearby Landmark</span>
                    <span className="font-semibold text-foreground">{incident.landmark}</span>
                  </div>
                )}

                {incident.latitude != null && incident.longitude != null ? (
                  <div className="pt-2">
                    <IncidentDetailMapView
                      latitude={incident.latitude}
                      longitude={incident.longitude}
                      title={incident.title}
                      barangay={incident.barangay}
                      severity={incident.severity}
                      viewOnMapHref={`/dashboard/incident-map?reportId=${incident.id}`}
                    />
                  </div>
                ) : (
                  <div className="pt-2">
                    <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-3.5 text-xs text-muted-foreground flex items-start gap-2.5">
                      <MapPin className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="font-semibold text-foreground">No GPS Coordinates Pinned</p>
                        <p className="text-[11px] leading-relaxed">
                          This report was submitted using descriptive address references without geographic coordinates.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Public Status / Update Timeline */}
            <Card className="border-border/70 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Clock className="size-4 text-primary" />
                  Public Progress & Official Milestones ({incident.updates.length})
                </CardTitle>
                <CardDescription className="text-xs">
                  Official progress notifications and verified milestones published by city responders
                </CardDescription>
              </CardHeader>
              <CardContent>
                {incident.updates.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl p-6 bg-card/50">
                    <Clock className="size-7 mx-auto mb-2 text-muted-foreground/60" />
                    <p className="font-medium text-foreground text-sm">No progress updates published yet</p>
                    <p className="mt-1 max-w-sm mx-auto text-xs leading-relaxed">
                      Your report has been received and logged in the municipal triage queue. As dispatchers review and assign response crews, milestone notices will appear here automatically.
                    </p>
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/70">
                    {incident.updates.map((update, idx) => {
                      const updateDate = new Date(update.created_at).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return (
                        <div key={update.id} className="relative">
                          <div className="absolute -left-6 top-1 size-3 rounded-full bg-primary ring-4 ring-background" />
                          <div className="rounded-xl border border-border/70 bg-card p-4 space-y-2 shadow-2xs">
                            <div className="flex flex-wrap items-center justify-between gap-1 text-xs text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-foreground">
                                  Official Update #{idx + 1}
                                </span>
                                {update.author && (
                                  <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-medium">
                                    {update.author.role.toUpperCase()}
                                  </Badge>
                                )}
                              </div>
                              <span className="font-mono text-[11px]">{updateDate}</span>
                            </div>
                            <p className="text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                              {update.message}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column (1 Col): Key Milestones & Attachments */}
          <div className="space-y-6">
            {/* Key Milestones Card */}
            <Card className="border-border/70 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Incident Milestones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Submitted</span>
                  <span className="font-medium text-foreground text-right">{formattedCreated}</span>
                </div>

                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Current Status</span>
                  <IncidentStatusBadge status={incident.status} />
                </div>

                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Severity Level</span>
                  <IncidentSeverityBadge severity={incident.severity} />
                </div>

                {assignedDepartmentName && (
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-muted-foreground">Assigned Agency</span>
                    <span className="font-semibold text-foreground text-right flex items-center gap-1">
                      <Building2 className="size-3 text-primary" />
                      {assignedDepartmentName}
                    </span>
                  </div>
                )}

                {formattedResolved && (
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-muted-foreground">Resolved On</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-right flex items-center gap-1">
                      <CheckCircle2 className="size-3" />
                      {formattedResolved}
                    </span>
                  </div>
                )}

                {incident.closed_at && (
                  <div className="flex justify-between pt-1">
                    <span className="text-muted-foreground">Archived / Closed</span>
                    <span className="font-medium text-foreground text-right">
                      {new Date(incident.closed_at).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attachments Card */}
            <Card className="border-border/70 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                  <Paperclip className="size-4 text-primary" />
                  Your Attached Evidence ({incident.attachments.length})
                </CardTitle>
                <CardDescription className="text-xs">
                  Evidence encrypted and stored in private municipal vault
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs">
                {incident.attachments.length === 0 ? (
                  <p className="text-muted-foreground py-2 italic text-center">
                    No photo attachments were included with this report.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {incident.attachments.map((file) => {
                      const isImage = file.mime_type.startsWith("image/");
                      return (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-border/70 bg-card shadow-2xs gap-3"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Image Thumbnail Preview or File Icon */}
                            {isImage && file.signed_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={file.signed_url}
                                alt={file.original_filename}
                                className="size-11 rounded-lg object-cover shrink-0 border border-border/60 bg-muted"
                              />
                            ) : (
                              <div className="size-11 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 border border-border/60 text-muted-foreground">
                                <FileText className="size-5" />
                              </div>
                            )}

                            <div className="truncate">
                              <span className="font-semibold text-foreground truncate block text-xs">
                                {file.original_filename}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {(file.file_size / 1024).toFixed(1)} KB • {file.mime_type}
                              </span>
                            </div>
                          </div>

                          {file.signed_url && (
                            <a
                              href={file.signed_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(
                                buttonVariants({ variant: "outline", size: "sm" }),
                                "shrink-0 text-xs h-7 px-2.5 gap-1 text-primary hover:text-primary font-medium"
                              )}
                            >
                              <span>View</span>
                              <ExternalLink className="size-3" />
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Confidentiality & Security Notice */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <ShieldCheck className="size-4 text-primary" />
                <span>Verified City Response</span>
              </div>
              <p className="leading-relaxed">
                Your report is securely routed to authorized municipal personnel. All status changes and verified public updates will appear on this timeline in real time.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

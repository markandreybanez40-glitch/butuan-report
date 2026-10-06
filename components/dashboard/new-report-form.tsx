"use client";

import { useState, useRef, useTransition } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  FileText,
  Image as ImageIcon,
  Loader2,
  Send,
  Trash2,
  UploadCloud,
  X,
  Compass,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import dynamic from "next/dynamic";
import type { IncidentCategory } from "@/types";
import { BUTUAN_BARANGAYS } from "@/lib/constants/barangays";

const LocationPickerMap = dynamic(
  () => import("@/components/map/location-picker-map").then((m) => m.LocationPickerMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[280px] sm:h-[320px] rounded-2xl border border-border/80 bg-muted/40 animate-pulse flex items-center justify-center text-xs text-muted-foreground">
        Loading Interactive Location Picker Map...
      </div>
    ),
  }
);
import { submitIncidentAction, type SubmitReportResult } from "@/app/dashboard/new/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NewReportFormProps {
  categories: IncidentCategory[];
  defaultBarangay?: string;
}

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/gif",
  "application/pdf",
];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_FILES = 5;

const SEVERITY_OPTIONS = [
  {
    value: "low",
    label: "Low",
    badgeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/50",
    desc: "Minor inconvenience or cosmetic issue, non-urgent.",
  },
  {
    value: "medium",
    label: "Medium",
    badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50",
    desc: "Moderate community impact, needs timely resolution.",
  },
  {
    value: "high",
    label: "High",
    badgeClass: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-900/50",
    desc: "Significant hazard, traffic obstruction, or health risk.",
  },
  {
    value: "critical",
    label: "Critical",
    badgeClass: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900/50",
    desc: "Imminent safety risk or emergency requiring immediate action.",
  },
] as const;

export function NewReportForm({ categories, defaultBarangay = "" }: NewReportFormProps) {
  // Form fields
  const [categoryId, setCategoryId] = useState("");
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [barangay, setBarangay] = useState(defaultBarangay);
  const [streetArea, setStreetArea] = useState("");
  const [landmark, setLandmark] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  // Attachments
  const [attachments, setAttachments] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ [filename: string]: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status & UI state
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<SubmitReportResult | null>(null);
  const [copiedReportNumber, setCopiedReportNumber] = useState(false);

  // Selected category helper
  const selectedCategory = categories.find((c) => c.id === categoryId);

  const handleClearLocation = () => {
    setLatitude("");
    setLongitude("");
  };

  // Handle File Additions
  const handleFilesAdded = (incomingFiles: FileList | null) => {
    if (!incomingFiles || incomingFiles.length === 0) return;
    setErrorMsg(null);

    const newFiles: File[] = [];
    const newPreviews = { ...previews };

    for (let i = 0; i < incomingFiles.length; i++) {
      const file = incomingFiles[i];

      // Check max count
      if (attachments.length + newFiles.length >= MAX_FILES) {
        setErrorMsg(`You can attach up to ${MAX_FILES} files maximum.`);
        break;
      }

      // Check file size (10 MB)
      if (file.size > MAX_FILE_SIZE_BYTES) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        setErrorMsg(`"${file.name}" is ${sizeMb} MB. Maximum allowed size is 10 MB.`);
        continue;
      }

      // Check mime type
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        setErrorMsg(
          `"${file.name}" is an unsupported format. Supported formats: JPG, PNG, WebP, HEIC, GIF, or PDF.`
        );
        continue;
      }

      // Avoid duplicates
      if (
        attachments.some((f) => f.name === file.name && f.size === file.size) ||
        newFiles.some((f) => f.name === file.name && f.size === file.size)
      ) {
        continue;
      }

      newFiles.push(file);

      // Create preview for images
      if (file.type.startsWith("image/")) {
        newPreviews[file.name] = URL.createObjectURL(file);
      }
    }

    setAttachments((prev) => [...prev, ...newFiles]);
    setPreviews(newPreviews);

    // Reset native input so the same file could be re-selected if deleted
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (index: number) => {
    const fileToRemove = attachments[index];
    if (fileToRemove && previews[fileToRemove.name]) {
      URL.revokeObjectURL(previews[fileToRemove.name]);
      const nextPreviews = { ...previews };
      delete nextPreviews[fileToRemove.name];
      setPreviews(nextPreviews);
    }
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);

    // Basic client validation
    if (!categoryId) {
      setErrorMsg("Please select an incident category.");
      return;
    }

    if (title.trim().length < 5) {
      setErrorMsg("Title must be at least 5 characters long.");
      return;
    }

    if (description.trim().length < 15) {
      setErrorMsg("Description must be at least 15 characters long.");
      return;
    }

    if (barangay.trim().length < 2) {
      setErrorMsg("Please specify the barangay where this incident occurred.");
      return;
    }

    // Build FormData
    const formData = new FormData();
    formData.append("category_id", categoryId);
    formData.append("severity", severity);
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("barangay", barangay.trim());
    if (streetArea.trim()) formData.append("street_area", streetArea.trim());
    if (landmark.trim()) formData.append("landmark", landmark.trim());
    if (latitude.trim()) formData.append("latitude", latitude.trim());
    if (longitude.trim()) formData.append("longitude", longitude.trim());

    // Append attachments
    for (const file of attachments) {
      formData.append("attachments", file);
    }

    startTransition(async () => {
      try {
        const result = await submitIncidentAction(null, formData);
        if (result.success) {
          // Clear object URLs
          Object.values(previews).forEach((url) => URL.revokeObjectURL(url));
          setSubmitResult(result);
        } else {
          setErrorMsg(result.error || "An error occurred while submitting your report.");
        }
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Failed to connect to the server.");
      }
    });
  };

  // Reset form to file another report
  const handleResetForm = () => {
    setCategoryId("");
    setSeverity("medium");
    setTitle("");
    setDescription("");
    setBarangay(defaultBarangay);
    setStreetArea("");
    setLandmark("");
    setLatitude("");
    setLongitude("");
    setAttachments([]);
    setPreviews({});
    setErrorMsg(null);
    setSubmitResult(null);
  };

  // Copy report number to clipboard
  const handleCopyReportNumber = () => {
    if (submitResult?.reportNumber) {
      navigator.clipboard.writeText(submitResult.reportNumber);
      setCopiedReportNumber(true);
      setTimeout(() => setCopiedReportNumber(false), 2000);
    }
  };

  // ==========================================
  // SUCCESS STATE VIEW
  // ==========================================
  if (submitResult?.success) {
    return (
      <Card className="border-border/80 shadow-md overflow-hidden">
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 p-6 sm:p-8 text-center space-y-3">
          <div className="inline-flex items-center justify-center size-14 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 ring-8 ring-emerald-500/10">
            <CheckCircle2 className="size-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            Incident Report Successfully Filed!
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Your report has been logged into the Butuan City Civic Portal and queued for municipal dispatcher assessment.
          </p>
        </div>

        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Report Reference Box */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground block">
                  Official Report Number
                </span>
                <span className="text-xl sm:text-2xl font-mono font-extrabold text-primary">
                  {submitResult.reportNumber}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyReportNumber}
                  className="gap-1.5 text-xs rounded-full"
                >
                  {copiedReportNumber ? (
                    <>
                      <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      <span>Copy Number</span>
                    </>
                  )}
                </Button>
                <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/50">
                  Status: Submitted
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-border/50 text-xs">
              <div>
                <span className="text-muted-foreground block">Category:</span>
                <span className="font-semibold text-foreground">{selectedCategory?.name || "General Hazard"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Location:</span>
                <span className="font-semibold text-foreground">{barangay}, Butuan City</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Attachments:</span>
                <span className="font-semibold text-foreground">{attachments.length} file(s) uploaded</span>
              </div>
            </div>
          </div>

          {/* What happens next */}
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-2 text-xs">
            <h3 className="font-semibold text-foreground flex items-center gap-1.5">
              <Check className="size-3.5 text-primary" />
              What Happens Next?
            </h3>
            <ul className="space-y-1.5 text-muted-foreground pl-5 list-disc">
              <li>Our dispatch operations team will verify the report details and severity.</li>
              <li>The ticket will be assigned to the relevant department (e.g. CEO, CDRRMO, or ENRO).</li>
              <li>You will receive public updates on the timeline as municipal teams take action.</li>
            </ul>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetForm}
              className="rounded-full gap-1.5"
            >
              <RotateCcw className="size-3.5" />
              <span>Submit Another Report</span>
            </Button>

            <Link
              href={`/dashboard/reports/${submitResult.incidentId}`}
              className={cn(buttonVariants({ size: "sm" }), "rounded-full gap-1.5 shadow-sm")}
            >
              <span>View Report Details</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ==========================================
  // MULTI-SECTION REPORT FORM
  // ==========================================
  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader>
        <CardTitle className="text-xl font-bold">New Incident Report</CardTitle>
        <CardDescription className="text-xs">
          Provide complete and accurate details to facilitate fast verification and municipal dispatch.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Error Alert */}
        {errorMsg && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 mb-6 text-xs text-destructive dark:text-red-300 flex items-start gap-2.5">
            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="block font-semibold">Validation Error</strong>
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* SECTION 1: CLASSIFICATION */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2 w-full">
              <span className="flex items-center justify-center size-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                1
              </span>
              <span>Incident Classification</span>
            </legend>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Category */}
              <div className="space-y-1.5">
                <label htmlFor="category_id" className="text-xs font-semibold text-foreground">
                  Incident Category <span className="text-destructive">*</span>
                </label>
                <select
                  id="category_id"
                  name="category_id"
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-card px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select a category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {selectedCategory?.description && (
                  <p className="text-[11px] text-muted-foreground italic">
                    {selectedCategory.description}
                  </p>
                )}
              </div>

              {/* Severity */}
              <div className="space-y-1.5">
                <label htmlFor="severity" className="text-xs font-semibold text-foreground">
                  Estimated Severity <span className="text-destructive">*</span>
                </label>
                <select
                  id="severity"
                  name="severity"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as "low" | "medium" | "high" | "critical")}
                  className="w-full h-9 rounded-md border border-input bg-card px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {SEVERITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} — {opt.desc}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2 pt-0.5">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-medium py-0 px-2",
                      SEVERITY_OPTIONS.find((s) => s.value === severity)?.badgeClass
                    )}
                  >
                    Level: {severity.toUpperCase()}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">
                    {SEVERITY_OPTIONS.find((s) => s.value === severity)?.desc}
                  </span>
                </div>
              </div>
            </div>
          </fieldset>

          {/* SECTION 2: REPORT DETAILS */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2 w-full">
              <span className="flex items-center justify-center size-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                2
              </span>
              <span>Report Details</span>
            </legend>

            {/* Title */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between items-center">
                <label htmlFor="title" className="text-xs font-semibold text-foreground">
                  Incident Title <span className="text-destructive">*</span>
                </label>
                <span className="text-[10px] text-muted-foreground">
                  {title.length} / 150 chars
                </span>
              </div>
              <Input
                id="title"
                name="title"
                required
                maxLength={150}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Deep pothole causing vehicular damage near JC Aquino Ave"
                className="bg-card"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="description" className="text-xs font-semibold text-foreground">
                  Detailed Description <span className="text-destructive">*</span>
                </label>
                <span className="text-[10px] text-muted-foreground">
                  {description.length} / 3000 chars
                </span>
              </div>
              <Textarea
                id="description"
                name="description"
                required
                maxLength={3000}
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue in detail, its impact, current condition, and any hazards to residents or motorists..."
                className="bg-card resize-y"
              />
            </div>
          </fieldset>

          {/* SECTION 3: LOCATION & GEOLOCATION */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2 w-full">
              <span className="flex items-center justify-center size-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                3
              </span>
              <span>Incident Location</span>
            </legend>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Barangay with Datalist */}
              <div className="space-y-1.5">
                <label htmlFor="barangay" className="text-xs font-semibold text-foreground">
                  Barangay in Butuan City <span className="text-destructive">*</span>
                </label>
                <Input
                  id="barangay"
                  name="barangay"
                  required
                  list="butuan-barangays"
                  value={barangay}
                  onChange={(e) => setBarangay(e.target.value)}
                  placeholder="Select or type barangay (e.g. Doongan)"
                  className="bg-card"
                />
                <datalist id="butuan-barangays">
                  {BUTUAN_BARANGAYS.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
                <span className="text-[10px] text-muted-foreground">
                  Choose from official 86 Butuan City barangays
                </span>
              </div>

              {/* Street / Area */}
              <div className="space-y-1.5">
                <label htmlFor="street_area" className="text-xs font-semibold text-foreground">
                  Street / Area / Purok
                </label>
                <Input
                  id="street_area"
                  name="street_area"
                  value={streetArea}
                  onChange={(e) => setStreetArea(e.target.value)}
                  placeholder="e.g. Montilla Blvd, Purok 3A"
                  className="bg-card"
                />
              </div>
            </div>

            {/* Landmark */}
            <div className="space-y-1.5">
              <label htmlFor="landmark" className="text-xs font-semibold text-foreground">
                Prominent Landmark (Optional)
              </label>
              <Input
                id="landmark"
                name="landmark"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. In front of Robinsons Place Butuan, Beside Barangay Hall"
                className="bg-card"
              />
            </div>

            {/* Geolocation & Map Picker Section */}
            <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Compass className="size-4 text-primary" />
                  <span>Interactive Map & GPS Pinpoint</span>
                </div>

                {(latitude || longitude) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearLocation}
                    className="h-7 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear Map Pin
                  </Button>
                )}
              </div>

              {/* Leaflet Interactive Map Picker */}
              <LocationPickerMap
                latitude={latitude && !isNaN(parseFloat(latitude)) ? parseFloat(latitude) : null}
                longitude={longitude && !isNaN(parseFloat(longitude)) ? parseFloat(longitude) : null}
                onLocationChange={({ lat, lng }) => {
                  setLatitude(lat.toString());
                  setLongitude(lng.toString());
                }}
                disabled={isPending}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label htmlFor="latitude" className="text-[11px] font-medium text-muted-foreground">
                    Latitude
                  </label>
                  <Input
                    id="latitude"
                    name="latitude"
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="e.g. 8.9472"
                    className="bg-card text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="longitude" className="text-[11px] font-medium text-muted-foreground">
                    Longitude
                  </label>
                  <Input
                    id="longitude"
                    name="longitude"
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="e.g. 125.5406"
                    className="bg-card text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </fieldset>

          {/* SECTION 4: PHOTO & FILE ATTACHMENTS */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2 w-full">
              <span className="flex items-center justify-center size-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                4
              </span>
              <span>Photo & Document Evidence</span>
            </legend>

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Attach up to {MAX_FILES} photos or PDFs (max 10 MB per file).
                </span>
                <span className="text-xs font-medium text-foreground">
                  {attachments.length} / {MAX_FILES} attached
                </span>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed border-border/80 hover:border-primary/50 transition-colors rounded-xl p-6 text-center cursor-pointer bg-muted/10 hover:bg-muted/20",
                  attachments.length >= MAX_FILES && "opacity-50 pointer-events-none"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/heic,image/gif,application/pdf"
                  onChange={(e) => handleFilesAdded(e.target.files)}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <UploadCloud className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      Click to browse or drag and drop files
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      JPG, PNG, WebP, HEIC, GIF, or PDF (up to 10 MB each)
                    </p>
                  </div>
                </div>
              </div>

              {/* Attached Files List */}
              {attachments.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-semibold text-foreground block">
                    Selected Evidence ({attachments.length}):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {attachments.map((file, idx) => {
                      const isImage = file.type.startsWith("image/");
                      const previewUrl = previews[file.name];

                      return (
                        <div
                          key={`${file.name}-${idx}`}
                          className="flex items-center justify-between p-2.5 rounded-lg border border-border/70 bg-card shadow-2xs gap-2 min-w-0"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Preview or Icon */}
                            {isImage && previewUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={previewUrl}
                                alt={file.name}
                                className="size-10 rounded object-cover shrink-0 border border-border/60 bg-muted"
                              />
                            ) : (
                              <div className="size-10 rounded bg-muted/50 flex items-center justify-center shrink-0 border border-border/60">
                                {file.type === "application/pdf" ? (
                                  <FileText className="size-5 text-red-500" />
                                ) : (
                                  <ImageIcon className="size-5 text-muted-foreground" />
                                )}
                              </div>
                            )}

                            <div className="min-w-0 truncate">
                              <p className="text-xs font-medium text-foreground truncate">
                                {file.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {(file.size / 1024).toFixed(1)} KB • {file.type || "file"}
                              </p>
                            </div>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveFile(idx)}
                            className="size-7 rounded-full text-muted-foreground hover:text-destructive shrink-0"
                            aria-label={`Remove ${file.name}`}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </fieldset>

          {/* Submission Bar */}
          <div className="pt-4 border-t border-border/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="text-[11px] text-muted-foreground">
              By submitting, you confirm that this incident report is accurate to the best of your knowledge.
            </div>

            <div className="flex items-center justify-end gap-3">
              <Link
                href="/dashboard"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full")}
              >
                Cancel
              </Link>

              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                className="rounded-full gap-1.5 shadow-sm px-6 min-w-36"
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="size-3.5" />
                    <span>Submit Report</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

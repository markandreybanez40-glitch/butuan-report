import { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Scale,
  Ban,
  Upload,
  UserCheck,
  Clock,
} from "lucide-react";
import { LandingHeader } from "@/components/landing-header";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Terms of Service | Butuan Report",
  description: "Terms of Service, acceptable use policy, and reporting guidelines for Butuan Report",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <LandingHeader />

      <main className="flex-1 container mx-auto max-w-4xl px-4 sm:px-6 py-10 sm:py-16 space-y-8">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-5">
          <Link
            href="/"
            className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span>Return to Home</span>
          </Link>

          <span className="text-xs font-mono text-muted-foreground">
            Last Updated: October 2026
          </span>
        </div>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Scale className="size-3.5" />
            <span>Platform Agreement & Guidelines</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Terms of Service
          </h1>
          <p className="text-xs sm:text-base text-muted-foreground leading-relaxed">
            Please read these Terms of Service carefully before accessing or using the Butuan Report platform. By creating an account or submitting reports, you agree to be bound by these terms.
          </p>
        </div>

        {/* Emergency Disclaimer Banner */}
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-5 sm:p-6 space-y-3 text-destructive dark:text-red-300">
          <div className="flex items-center gap-2.5 font-bold text-sm sm:text-base">
            <AlertTriangle className="size-5 shrink-0 text-destructive" />
            <span>Emergency Services Disclaimer — Non-Emergency Channel</span>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed text-foreground/90">
            Butuan Report is an asynchronous civic reporting and hazard management application. It is <strong>NOT</strong> an instantaneous emergency dispatch system. If you are experiencing an active fire, medical crisis, robbery, armed conflict, or immediate life-threatening emergency, call national emergency hotline <strong>911</strong> or contact CDRRMO Emergency Dispatch directly at <strong>(085) 341-1111</strong> or <strong>0919-065-0105</strong>.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-6 text-sm leading-relaxed text-foreground">
          {/* Section 1: Proper Use of the Reporting System */}
          <Card className="border-border/70 p-6 space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              1. Proper Use of the Reporting System
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Butuan Report provides a civic channel for residents of Butuan City to report observable community hazards, infrastructure defects, public sanitation concerns, flooding, and related civic issues to municipal departments. Users agree to:
            </p>
            <ul className="list-disc pl-5 text-xs sm:text-sm text-muted-foreground space-y-1.5">
              <li>Submit reports exclusively for real, observable hazards located within Butuan City.</li>
              <li>Provide truthful, factual descriptions and precise barangay / landmark locations.</li>
              <li>Use the system in good faith to promote community safety and civic improvement.</li>
            </ul>
          </Card>

          {/* Section 2: Prohibited Conduct, Abuse & False Reports */}
          <Card className="border-border/70 p-6 space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Ban className="size-4 text-destructive" />
              2. Prohibited Conduct, Spam & False Reports
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              The following activities are strictly prohibited and may result in immediate account suspension and referral for legal action:
            </p>
            <ul className="list-disc pl-5 text-xs sm:text-sm text-muted-foreground space-y-1.5">
              <li>
                <strong>Fraudulent or False Submissions:</strong> Knowingly submitting fabricated, misleading, or hoax hazard reports.
              </li>
              <li>
                <strong>Spamming & Duplication:</strong> Flooding the system with redundant submissions, automated bot traffic, or promotional content.
              </li>
              <li>
                <strong>Harassment & Defamation:</strong> Using report fields or timeline comments to target, defame, harass, or insult individuals, neighbors, or municipal workers.
              </li>
              <li>
                <strong>Malicious Software:</strong> Uploading corrupted files, viruses, scripts, or materials designed to disrupt system security or database operations.
              </li>
            </ul>
          </Card>

          {/* Section 3: Attachment & Content Rules */}
          <Card className="border-border/70 p-6 space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Upload className="size-4 text-primary" />
              3. Evidence & Photo Attachment Guidelines
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Users may upload photographs or document attachments to support their reports, subject to the following rules:
            </p>
            <ul className="list-disc pl-5 text-xs sm:text-sm text-muted-foreground space-y-1.5">
              <li>Attachments must directly depict the hazard, road condition, or civic issue being reported.</li>
              <li>Do not upload images containing explicit, pornographic, violent, gory, or unlawful content.</li>
              <li>Avoid capturing private personal details of bystanders (such as private interior spaces or government IDs) without consent.</li>
              <li>Supported formats include JPEG, PNG, WEBP, and PDF files within designated file size limits.</li>
            </ul>
          </Card>

          {/* Section 4: Account Responsibility & Security */}
          <Card className="border-border/70 p-6 space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <UserCheck className="size-4 text-primary" />
              4. User Account Responsibility
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Users authenticate securely through Clerk authentication. You are responsible for:
            </p>
            <ul className="list-disc pl-5 text-xs sm:text-sm text-muted-foreground space-y-1.5">
              <li>Maintaining the confidentiality of your login credentials and authentication tokens.</li>
              <li>All activities and incident submissions initiated through your account.</li>
              <li>Promptly notifying technical support if you suspect unauthorized access to your account.</li>
            </ul>
          </Card>

          {/* Section 5: Report Handling & Service Expectations */}
          <Card className="border-border/70 p-6 space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              5. Report Handling & Operational Expectations
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Municipal response workflows depend on severity, resource availability, weather events, and agency jurisdiction:
            </p>
            <ul className="list-disc pl-5 text-xs sm:text-sm text-muted-foreground space-y-1.5">
              <li>
                <strong>Triage & Review:</strong> Submissions are placed in the review queue and routed to responsible departments based on reported category and severity.
              </li>
              <li>
                <strong>No Guaranteed Response Time:</strong> While departments aim for prompt triage, submission of a report does not guarantee immediate physical dispatch or instantaneous resolution.
              </li>
              <li>
                <strong>Status Updates:</strong> Official progress updates and resolutions will be reflected on your resident dashboard as field teams record updates.
              </li>
            </ul>
          </Card>

          {/* Section 6: Service Limitations & Modifications */}
          <Card className="border-border/70 p-6 space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <FileText className="size-4 text-primary" />
              6. Service Availability & Modifications
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              The platform is provided on an &quot;as is&quot; and &quot;as available&quot; basis. The management reserves the right to modify, suspend, or update platform features, terms, or reporting categories as necessary to improve civic services.
            </p>
          </Card>
        </div>

        {/* Footer Navigation */}
        <div className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-muted-foreground border-t border-border/60">
          <span>© 2026 Butuan Report. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/data-collection" className="hover:text-foreground transition-colors">
              Data Collection
            </Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">
              Contact & Support
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, AlertTriangle, FileText, Scale } from "lucide-react";
import { LandingHeader } from "@/components/landing-header";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Terms of Service | Butuan Report",
  description: "Terms of Service and Citizen Guidelines for Butuan Report",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <LandingHeader />

      <main className="flex-1 container mx-auto max-w-4xl px-4 sm:px-6 py-10 sm:py-16 space-y-8">
        <div className="flex items-center justify-between border-b border-border/60 pb-5">
          <Link
            href="/"
            className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span>Return to Home</span>
          </Link>

          <span className="text-xs font-mono text-muted-foreground">
            Effective: October 2026
          </span>
        </div>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Scale className="size-3.5" />
            <span>Citizen Guidelines & Terms of Use</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Terms of Service
          </h1>
          <p className="text-xs sm:text-base text-muted-foreground leading-relaxed">
            These terms govern the use of the Butuan Report civic reporting portal by residents, municipal staff, and site visitors.
          </p>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-foreground">
          {/* Section 1 */}
          <Card className="border-border/70 p-6 space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              1. Acceptance of Terms & Authentic Account Use
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              By registering an account and submitting reports through Butuan Report, users agree to provide accurate and truthful incident information. Submissions are linked to authenticated user profiles to maintain high reporting integrity across all 86 barangays.
            </p>
          </Card>

          {/* Section 2 */}
          <Card className="border-border/70 p-6 space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-500" />
              2. Emergency Reporting Notice
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              <strong>Emergency Warning:</strong> Butuan Report is an asynchronous civic hazard tracking system. It is <strong>NOT</strong> a substitute for real-time emergency dispatching. For active fires, violent crimes, immediate life threats, or acute medical emergencies, call national <strong>911</strong> or CDRRMO Emergency Hotline <strong>(085) 341-1111</strong> immediately.
            </p>
          </Card>

          {/* Section 3 */}
          <Card className="border-border/70 p-6 space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <FileText className="size-4 text-primary" />
              3. Responsible Reporting & Prohibited Conduct
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Users are strictly prohibited from submitting false, malicious, deceptive, or fraudulent hazard reports. Submitting false reports to municipal emergency services may subject offenders to administrative and legal penalties under applicable Philippine laws.
            </p>
          </Card>

          {/* Section 4 */}
          <Card className="border-border/70 p-6 space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Scale className="size-4 text-primary" />
              4. Municipal Response Timelines & Service Scope
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              While the City Government strives for rapid triage and dispatch, response times may vary depending on incident severity level, weather conditions, resource availability, and departmental workload.
            </p>
          </Card>
        </div>

        <div className="pt-4 flex justify-between items-center text-xs text-muted-foreground border-t border-border/60">
          <span>© 2026 City Government of Butuan</span>
          <Link href="/privacy" className="text-primary font-medium hover:underline">
            View Privacy Policy &rarr;
          </Link>
        </div>
      </main>
    </div>
  );
}

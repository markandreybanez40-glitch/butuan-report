import { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";
import { LandingHeader } from "@/components/landing-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Contact & Technical Support | Butuan Report",
  description: "Get technical support, report platform issues, or find official contact details for Butuan Report",
};

export default function ContactSupportPage() {
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
            Support Desk: Active
          </span>
        </div>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <HelpCircle className="size-3.5" />
            <span>Help Desk & Platform Assistance</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Contact & Support
          </h1>
          <p className="text-xs sm:text-base text-muted-foreground leading-relaxed">
            Need help submitting a report, experiencing account issues, or have questions about how Butuan Report works? Reach out to our technical support desk.
          </p>
        </div>

        {/* Emergency Notice */}
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 space-y-2 text-xs sm:text-sm text-destructive dark:text-red-300">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="size-4 shrink-0" />
            <span>Immediate Emergency Notice</span>
          </div>
          <p className="leading-relaxed text-foreground/90 text-xs sm:text-sm">
            This contact channel is dedicated to platform technical support. If you are reporting an active emergency (fires, active crimes, or acute life threats), call national emergency hotline <strong>911</strong> or CDRRMO Emergency Hotline <strong>(085) 341-1111</strong> immediately.
          </p>
        </div>

        {/* Support Grid */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Card 1: Technical & Account Support */}
          <Card className="border-border/70 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <Mail className="size-4 text-primary" />
                Technical & System Support
              </CardTitle>
              <CardDescription className="text-xs">
                For login issues, account inquiries, or bug reports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="rounded-lg bg-muted/40 p-3 space-y-1">
                <span className="font-semibold text-foreground block">Email Support Desk</span>
                <span className="font-mono text-primary select-all">support@butuanreport.gov.ph</span>
              </div>
              <div className="rounded-lg bg-muted/40 p-3 space-y-1">
                <span className="font-semibold text-foreground block">Operating Hours</span>
                <span className="text-muted-foreground">Monday – Friday: 8:00 AM – 5:00 PM (PST)</span>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Please include your registered email address and report reference number (e.g. BR-2026-XXXX) when inquiring about a specific submission.
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Privacy & Data Protection Inquiries */}
          <Card className="border-border/70 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <ShieldCheck className="size-4 text-primary" />
                Data Protection & Privacy Officer
              </CardTitle>
              <CardDescription className="text-xs">
                For data subject requests and privacy concerns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="rounded-lg bg-muted/40 p-3 space-y-1">
                <span className="font-semibold text-foreground block">Privacy Inquiries</span>
                <span className="font-mono text-primary select-all">dataprivacy@butuan.gov.ph</span>
              </div>
              <div className="rounded-lg bg-muted/40 p-3 space-y-1">
                <span className="font-semibold text-foreground block">Office Address</span>
                <span className="text-muted-foreground">
                  City Hall Complex, J.P. Rosales Avenue, Doongan, Butuan City, Agusan del Norte 8600
                </span>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Requests are processed in accordance with Republic Act No. 10173 (Data Privacy Act of 2012).
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Municipal Emergency & Agency Hotlines */}
          <Card className="sm:col-span-2 border-border/70 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <Phone className="size-4 text-primary" />
                Official Municipal Emergency & Agency Hotlines
              </CardTitle>
              <CardDescription className="text-xs">
                Direct contacts for urgent public safety and emergency coordination
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3 text-xs">
              <div className="rounded-lg bg-muted/40 p-3 space-y-1">
                <span className="font-semibold text-foreground block">CDRRMO Hotline</span>
                <span className="font-mono text-foreground font-bold">(085) 341-1111</span>
                <p className="text-[10px] text-muted-foreground">Disaster Risk Reduction & Rescue</p>
              </div>

              <div className="rounded-lg bg-muted/40 p-3 space-y-1">
                <span className="font-semibold text-foreground block">CDRRMO Mobile</span>
                <span className="font-mono text-foreground font-bold">0919-065-0105</span>
                <p className="text-[10px] text-muted-foreground">24/7 Mobile Emergency Line</p>
              </div>

              <div className="rounded-lg bg-muted/40 p-3 space-y-1">
                <span className="font-semibold text-foreground block">National Emergency</span>
                <span className="font-mono text-destructive font-bold text-sm">911</span>
                <p className="text-[10px] text-muted-foreground">National Emergency Dispatch</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Navigation */}
        <div className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-muted-foreground border-t border-border/60">
          <span>© 2026 Butuan Report. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href="/data-collection" className="hover:text-foreground transition-colors">
              Data Collection
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

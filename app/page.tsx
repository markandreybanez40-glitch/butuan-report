import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
  MapPin,
  Clock,
  CheckCircle2,
  Lock,
  PhoneCall,
  Construction,
  Waves,
  TreePine,
  Zap,
  Building2,
  FileCheck2,
  HelpCircle,
  Eye,
  AlertTriangle,
  Send,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LandingHeader } from "@/components/landing-header";
import { AuthCta } from "@/components/auth-cta";
import { getActiveCategories } from "@/lib/data/categories";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Fetch real categories from Supabase with safe fallback
  const dbCategories = await getActiveCategories().catch(() => []);

  const defaultCategories = [
    {
      id: "road-damage",
      name: "Road Damage & Potholes",
      description: "Potholes, broken pavement, damaged bridge joints, open manholes, and traffic obstructions.",
      icon: Construction,
      scope: "City Engineering Office (CEO)",
    },
    {
      id: "flooding",
      name: "Flooding & Drainage",
      description: "Clogged canals, flash floods, drainage overflow, and stagnant storm runoff.",
      icon: Waves,
      scope: "CDRRMO & City Engineering",
    },
    {
      id: "structural",
      name: "Fallen Trees & Physical Hazards",
      description: "Uprooted trees blocking roads, soil erosion, collapsed walls, and landslide hazards.",
      icon: TreePine,
      scope: "City ENRO & CDRRMO",
    },
    {
      id: "utilities",
      name: "Utilities & Streetlights",
      description: "Malfunctioning streetlights, exposed power lines, leaning utility poles, and burst water pipes.",
      icon: Zap,
      scope: "General Services & Utility Providers",
    },
    {
      id: "sanitation",
      name: "Waste & Sanitation",
      description: "Uncollected garbage piles, illegal creek dumping, hazardous runoff, and sewer leaks.",
      icon: ShieldAlert,
      scope: "City Environment & Health Office",
    },
    {
      id: "other",
      name: "Other Community Hazards",
      description: "Damaged public facilities, municipal park issues, and general civic concerns.",
      icon: HelpCircle,
      scope: "Municipal Operations Desk",
    },
  ];

  // Map real database categories if available, otherwise use standardized set
  const displayCategories = dbCategories.length > 0
    ? dbCategories.map((c, i) => ({
        id: c.id,
        name: c.name,
        description: c.description || "Report community concerns in this category for municipal review.",
        icon: [Construction, Waves, TreePine, Zap, ShieldAlert, HelpCircle][i % 6],
        scope: "Municipal Dispatch Desk",
      }))
    : defaultCategories;

  const steps = [
    {
      number: "01",
      title: "Report",
      subtitle: "Submit in 2 minutes",
      icon: Send,
      description: "Select your barangay, describe the hazard clearly, and upload optional photos from your mobile device or computer.",
    },
    {
      number: "02",
      title: "Track",
      subtitle: "Live transparent milestones",
      icon: Eye,
      description: "Receive a permanent reference number to follow triage, departmental routing, and official milestone updates in real time.",
    },
    {
      number: "03",
      title: "Respond",
      subtitle: "Coordinated city action",
      icon: Clock,
      description: "Municipal dispatchers assign responsible field teams (CDRRMO, CEO, City ENRO) who inspect and resolve the reported hazard.",
    },
  ];

  const trustValues = [
    {
      title: "Direct Municipal Dispatch",
      icon: Building2,
      description:
        "Every submission is placed in the official municipal triage queue and routed to responsible departments.",
    },
    {
      title: "Transparent Progress Timeline",
      icon: FileCheck2,
      description:
        "Residents receive notifications as reports advance from Submitted to Under Review, Assigned, and Resolved.",
    },
    {
      title: "Strict Identity Protection",
      icon: Lock,
      description:
        "Personal contact data is shielded and accessible solely to authorized dispatchers for verification. Public maps are anonymized.",
    },
    {
      title: "Citywide Coverage",
      icon: MapPin,
      description:
        "Active across all 86 barangays of Butuan City, connecting neighborhood concerns directly to city services.",
    },
  ];

  return (
    <div id="top" className="flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      {/* Navigation Header */}
      <LandingHeader />

      {/* Emergency Service Disclaimer Notice */}
      <aside
        aria-label="Emergency Service Notice"
        className="border-b border-destructive/20 bg-destructive/10 px-4 py-2.5 text-destructive dark:bg-destructive/15 dark:text-red-300"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0 text-destructive" />
            <span>
              <strong>Emergency Notice:</strong> This platform is for community incident reporting and does <strong>not</strong> replace emergency services. For immediate life threats, fires, or medical crises, call <strong>911</strong> or CDRRMO Hotline at <strong>(085) 341-1111</strong>.
            </span>
          </div>
          <div className="hidden lg:flex items-center gap-2 font-mono text-xs whitespace-nowrap">
            <PhoneCall className="size-3.5" />
            <span>CDRRMO Mobile: 0919-065-0105</span>
          </div>
        </div>
      </aside>

      <main className="flex-1">
        {/* ==============================================================================
            HERO SECTION
            ============================================================================== */}
        <section className="relative overflow-hidden border-b border-border/40 py-20 sm:py-28 lg:py-32">
          {/* Subtle civic background glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-40 left-1/2 -z-10 -translate-x-1/2 transform-gpu blur-3xl"
          >
            <div
              style={{
                clipPath:
                  "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
              }}
              className="aspect-1155/678 w-[68rem] bg-gradient-to-tr from-primary/20 via-primary/10 to-transparent opacity-50 dark:opacity-30"
            />
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              {/* Civic Tagline Badge */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3.5 py-1 text-xs font-medium text-foreground/80 shadow-xs backdrop-blur-sm">
                <Sparkles className="size-3.5 text-primary" />
                <span>Civic Hazard Reporting Portal</span>
                <span className="text-muted-foreground/60">•</span>
                <span className="text-muted-foreground">Butuan City</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl sm:leading-[1.15]">
                Report Incidents.{" "}
                <span className="bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
                  Build a Safer Butuan.
                </span>
              </h1>

              {/* Clear description */}
              <p className="mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg">
                An open civic platform connecting residents of Butuan City directly to municipal response units. Report road hazards, flooding, fallen trees, and community concerns with transparent real-time status tracking.
              </p>

              {/* Primary & Secondary Call to Actions */}
              <div className="mt-10">
                <AuthCta mode="hero" />
              </div>

              {/* Trust Metric Highlights */}
              <div className="mt-14 grid grid-cols-2 gap-4 border-t border-border/60 pt-8 sm:grid-cols-4 sm:gap-6 text-center">
                <div>
                  <div className="text-2xl font-extrabold text-foreground">86</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Barangays Covered</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-foreground">100%</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Public Transparency</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-foreground">RLS</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Privacy Safeguards</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-foreground">24/7</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Queue Intake</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==============================================================================
            HOW IT WORKS SECTION (#how-it-works)
            ============================================================================== */}
        <section id="how-it-works" className="py-20 sm:py-24 border-b border-border/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <Badge variant="outline" className="mb-3">
                Simple 3-Step Process
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                How Butuan Report Works
              </h2>
              <p className="mt-4 text-sm sm:text-base text-muted-foreground">
                From hazard submission to verified field resolution, every step is streamlined for citizen convenience and administrative accountability.
              </p>
            </div>

            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.number}
                    className="relative flex flex-col rounded-2xl border border-border/70 bg-card p-6 shadow-xs transition-all hover:border-primary/50 hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between pb-4">
                      <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
                        <Icon className="size-5" />
                      </div>
                      <span className="font-mono text-2xl font-black text-muted-foreground/40">
                        {step.number}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
                    <p className="text-xs font-semibold text-primary mt-0.5">{step.subtitle}</p>
                    <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==============================================================================
            INCIDENT CATEGORIES SECTION (#categories)
            ============================================================================== */}
        <section id="categories" className="py-20 sm:py-24 bg-muted/20 border-b border-border/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <Badge variant="outline" className="mb-3">
                Standardized Taxonomy
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Reportable Incident Categories
              </h2>
              <p className="mt-4 text-sm sm:text-base text-muted-foreground">
                Select from clear hazard categories so your report is automatically routed to the right operational department.
              </p>
            </div>

            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {displayCategories.map((cat) => {
                const IconComponent = cat.icon;
                return (
                  <Card key={cat.id} className="flex flex-col justify-between border-border/60 transition-all hover:border-primary/40 hover:shadow-xs">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <IconComponent className="size-5" />
                        </div>
                        <Badge variant="secondary" className="text-xs font-normal">
                          {cat.scope}
                        </Badge>
                      </div>
                      <CardTitle className="pt-3 text-base sm:text-lg font-semibold text-foreground">
                        {cat.name}
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm leading-normal">
                        {cat.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==============================================================================
            WORKFLOW & ROLE COLLABORATION SECTION (#about)
            ============================================================================== */}
        <section id="about" className="py-20 sm:py-24 border-b border-border/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-14">
              <Badge variant="outline" className="mb-3">
                Platform Architecture
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Citizen Reporting Meets City Operations
              </h2>
              <p className="mt-4 text-sm sm:text-base text-muted-foreground">
                A unified workflow connecting residents with municipal administrators and frontline responders.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              {/* Resident Experience Card */}
              <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 space-y-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <UserCheck className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Resident Portal</h3>
                    <p className="text-xs text-muted-foreground">Empowering citizen engagement</p>
                  </div>
                </div>
                <ul className="space-y-2.5 text-xs sm:text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                    <span>Submit reports with photos, GPS coordinates, and barangay references.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                    <span>Track progress milestones in real time on your personal dashboard.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                    <span>Explore the public incident map to stay informed on nearby community hazards.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                    <span>Receive instant alerts when city responders update your report.</span>
                  </li>
                </ul>
              </div>

              {/* Administrative & Responder Experience Card */}
              <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 space-y-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <Building2 className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Admin & Response Command</h3>
                    <p className="text-xs text-muted-foreground">Coordinated municipal triage</p>
                  </div>
                </div>
                <ul className="space-y-2.5 text-xs sm:text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="size-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                    <span>Triage citizen queue by urgency, severity, category, and barangay.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="size-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                    <span>Dispatch assignments to specialized departments and lead responders.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="size-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                    <span>Publish public milestone notices while keeping internal notes confidential.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="size-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                    <span>Maintain immutable audit logs and master department/category controls.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ==============================================================================
            PRIVACY & TRUST SECTION
            ============================================================================== */}
        <section className="py-20 sm:py-24 bg-muted/20 border-b border-border/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <Badge variant="outline" className="mb-3">
                Security & Governance
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Privacy Protected by Design
              </h2>
              <p className="mt-4 text-sm sm:text-base text-muted-foreground">
                We handle citizen data with the highest standards of confidentiality and security under Republic Act No. 10173 (Data Privacy Act of 2012).
              </p>
            </div>

            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {trustValues.map((t) => {
                const Icon = t.icon;
                return (
                  <div
                    key={t.title}
                    className="rounded-2xl border border-border/70 bg-card p-5 space-y-2 shadow-2xs"
                  >
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground">{t.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{t.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==============================================================================
            FINAL CALL TO ACTION SECTION
            ============================================================================== */}
        <section className="relative overflow-hidden py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-3xl border border-primary/20 bg-gradient-to-b from-primary/10 via-card to-card p-10 sm:p-16 text-center shadow-md">
              <Badge variant="secondary" className="mb-4">
                Citizen Action
              </Badge>
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                Your report makes Butuan safer.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base leading-relaxed">
                Spot a dangerous pothole, clogged stormwater drainage, or fallen utility pole? Submit a quick report today and track its resolution step-by-step.
              </p>

              <div className="mt-8">
                <AuthCta mode="final" />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ==============================================================================
          FOOTER
          ============================================================================== */}
      <footer className="border-t border-border bg-card text-card-foreground">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
            {/* Brand column */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
                  <ShieldCheck className="size-4" />
                </div>
                <span className="font-bold text-base tracking-tight text-foreground">
                  Butuan Report
                </span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground max-w-sm">
                A public civic reporting platform created for the residents of Butuan City to foster transparency, rapid hazard response, and community collaboration with local government agencies.
              </p>
              <div className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">City Hall Address:</span> J.P. Rosales Avenue, Doongan, Butuan City, Agusan del Norte, Philippines 8600
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-semibold text-foreground">Platform</h4>
              <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                <li>
                  <Link href="#top" className="hover:text-foreground transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="#how-it-works" className="hover:text-foreground transition-colors">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="#categories" className="hover:text-foreground transition-colors">
                    Incident Categories
                  </Link>
                </li>
                <li>
                  <Link href="/sign-in" className="hover:text-foreground transition-colors font-medium text-primary">
                    Resident Sign In
                  </Link>
                </li>
                <li>
                  <Link href="/admin/sign-in" className="hover:text-foreground transition-colors font-medium text-purple-600 dark:text-purple-400">
                    Admin Portal Sign In &rarr;
                  </Link>
                </li>
              </ul>
            </div>

            {/* Governance & Legal */}
            <div>
              <h4 className="text-sm font-semibold text-foreground">Legal & Privacy</h4>
              <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                <li>
                  <Link href="/privacy" className="hover:text-foreground transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-foreground transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/data-collection" className="hover:text-foreground transition-colors">
                    Data Collection Transparency
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-foreground transition-colors">
                    Contact & Support
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact & Support */}
            <div>
              <h4 className="text-sm font-semibold text-foreground">Contact & Emergency</h4>
              <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                <li>
                  <span className="font-semibold text-foreground">Emergency Hotline:</span> 911
                </li>
                <li>
                  <span className="font-semibold text-foreground">CDRRMO Hotline:</span> (085) 341-1111
                </li>
                <li>
                  <span className="font-semibold text-foreground">CDRRMO Mobile:</span> 0919-065-0105
                </li>
                <li>
                  <Link href="/contact" className="hover:text-foreground transition-colors text-primary font-medium">
                    View All Support Contacts &rarr;
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-border/60 pt-6 flex flex-col items-center justify-between gap-4 text-xs text-muted-foreground sm:flex-row">
            <p>© {new Date().getFullYear()} Butuan Report. City Government of Butuan. All rights reserved.</p>
            <p>Designed for public service, transparency, and citizen safety.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

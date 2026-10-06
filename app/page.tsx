import Link from "next/link";
import {
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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LandingHeader } from "@/components/landing-header";
import { AuthCta } from "@/components/auth-cta";

export default function HomePage() {
  const categories = [
    {
      title: "Road Issues",
      icon: Construction,
      description: "Potholes, broken asphalt, damaged bridges, open manholes, and street obstructions.",
      examples: "Potholes · Damaged curbs · Missing manhole covers",
      badge: "Infrastructure",
    },
    {
      title: "Flooding",
      icon: Waves,
      description: "Clogged stormwater drains, canal overflow, flash floods, and prolonged standing water.",
      examples: "Clogged canals · Street runoff · Riverbank swelling",
      badge: "Disaster Risk",
    },
    {
      title: "Public Safety",
      icon: ShieldAlert,
      description: "Fallen trees blocking rights-of-way, slope erosion, landslides, and structural hazards.",
      examples: "Uprooted trees · Soil erosion · Unstable walls",
      badge: "Urgent",
    },
    {
      title: "Environmental",
      icon: TreePine,
      description: "Illegal garbage dumpsites, waterway pollution, hazardous waste, and unauthorized burning.",
      examples: "Illegal dumping · Creek waste · Industrial runoff",
      badge: "Environment",
    },
    {
      title: "Utilities",
      icon: Zap,
      description: "Downed electric cables, leaning power poles, burst water mains, and malfunctioning streetlights.",
      examples: "Exposed wires · Broken water pipes · Dark intersections",
      badge: "Utilities",
    },
    {
      title: "Other",
      icon: HelpCircle,
      description: "Damaged municipal parks, civic facilities, sanitation risks, or unclassified community hazards.",
      examples: "Broken public facilities · Perimeter fences · Sanitation",
      badge: "Civic Concern",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Report",
      icon: Send,
      description: "Pinpoint your barangay and street, describe the issue clearly, and attach photo evidence from your phone or device.",
    },
    {
      number: "02",
      title: "Track",
      icon: Eye,
      description: "Receive a unique tracking number (e.g., BTN-20261002-0042) to monitor milestone progress from review to dispatch.",
    },
    {
      number: "03",
      title: "Respond",
      icon: Clock,
      description: "City dispatchers triage your report and coordinate with appropriate municipal engineering, emergency, or utility teams.",
    },
    {
      number: "04",
      title: "Safer Community",
      icon: CheckCircle2,
      description: "Verified on-site action is documented with timestamped progress updates until the civic concern is fully resolved.",
    },
  ];

  const trustValues = [
    {
      title: "Direct Municipal Routing",
      icon: Building2,
      description:
        "Every report is routed directly to the designated department — CDRRMO, City Engineering Office, City ENRO, or Traffic Management.",
    },
    {
      title: "Transparent Milestones",
      icon: FileCheck2,
      description:
        "No black box. Residents receive real-time notifications as their report transitions from Submitted to Under Review, Assigned, and Resolved.",
    },
    {
      title: "Secure Identity & Integrity",
      icon: Lock,
      description:
        "Clerk-authenticated citizen accounts protect against spam while keeping reporter contact information private and accessible solely for verification.",
    },
    {
      title: "Covering All 86 Barangays",
      icon: MapPin,
      description:
        "From urban business districts along Montilla Boulevard to riverbank communities and rural barangays across Butuan City.",
    },
  ];

  return (
    <div id="top" className="flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      {/* Navigation Header */}
      <LandingHeader />

      {/* Emergency Service Disclaimer Notice */}
      <aside
        aria-label="Emergency Service Notice"
        className="border-b border-destructive/20 bg-destructive/10 px-4 py-3 text-destructive dark:bg-destructive/15 dark:text-red-300"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="size-4 shrink-0 text-destructive" />
            <span>
              <strong>Emergency Notice:</strong> This platform is for non-immediate civic and infrastructure reporting. In life-threatening emergencies, call national <strong>911</strong> or Butuan CDRRMO at <strong>(085) 341-1111</strong> immediately.
            </span>
          </div>
          <div className="hidden lg:flex items-center gap-2 font-mono text-xs whitespace-nowrap">
            <PhoneCall className="size-3.5" />
            <span>CDRRMO Hotline: 0919-065-0105</span>
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
                <span>Butuan City Civic Engagement Portal</span>
                <span className="text-muted-foreground/60">•</span>
                <span className="text-muted-foreground">Official Platform</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl sm:leading-[1.15]">
                Report Incidents.{" "}
                <span className="bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
                  Build a Safer Butuan.
                </span>
              </h1>

              {/* Clear description */}
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
                A dedicated community portal for residents of Butuan City to report public infrastructure issues, drainage hazards, utility breakdowns, and road concerns — with transparent status tracking directly from city responders.
              </p>

              {/* Primary & Secondary Call to Actions */}
              <div className="mt-10">
                <AuthCta mode="hero" />
              </div>

              {/* Trust Metric Highlights */}
              <div className="mt-14 grid grid-cols-2 gap-4 border-t border-border/60 pt-8 sm:grid-cols-4 sm:gap-6">
                <div>
                  <div className="text-2xl font-bold text-foreground">86</div>
                  <div className="text-xs text-muted-foreground">Barangays Connected</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">6+</div>
                  <div className="text-xs text-muted-foreground">City Departments</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">100%</div>
                  <div className="text-xs text-muted-foreground">Transparent Tracking</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">24/7</div>
                  <div className="text-xs text-muted-foreground">Digital Ingestion</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==============================================================================
            TRUST & VALUE SECTION (#about)
            ============================================================================== */}
        <section id="about" className="py-20 sm:py-24 bg-muted/30 border-b border-border/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <Badge variant="outline" className="mb-3">
                Civic Accountability
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Built to Bridge Citizens and City Hall
              </h2>
              <p className="mt-4 text-base text-muted-foreground sm:text-lg">
                Butuan Report replaces fragmented social media complaints with structured, verifiable reports that city departments can immediately prioritize and action.
              </p>
            </div>

            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {trustValues.map((val) => {
                const IconComponent = val.icon;
                return (
                  <Card key={val.title} className="border-border/60 bg-card/70 backdrop-blur-xs transition-shadow hover:shadow-md">
                    <CardHeader className="pb-3">
                      <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <IconComponent className="size-5" />
                      </div>
                      <CardTitle className="text-lg font-semibold">{val.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-normal text-muted-foreground">{val.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
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
                Simple 4-Step Process
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                How Butuan Report Works
              </h2>
              <div className="mt-3 inline-flex flex-wrap items-center justify-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
                <span>Report</span>
                <span className="text-primary/40">→</span>
                <span>Track</span>
                <span className="text-primary/40">→</span>
                <span>Respond</span>
                <span className="text-primary/40">→</span>
                <span>Safer Community</span>
              </div>
              <p className="mt-4 text-base text-muted-foreground sm:text-lg">
                From initial incident discovery to on-site resolution, our streamlined workflow keeps you informed at every milestone.
              </p>
            </div>

            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((st) => {
                const IconComponent = st.icon;
                return (
                  <div key={st.number} className="relative flex flex-col items-start p-6 rounded-2xl border border-border/50 bg-card">
                    <div className="flex w-full items-center justify-between pb-4">
                      <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                        <IconComponent className="size-5" />
                      </div>
                      <span className="font-mono text-xs font-bold text-muted-foreground tracking-wider uppercase">
                        Step {st.number}
                      </span>
                    </div>
                    <h3 className="mt-2 text-xl font-bold text-foreground">{st.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{st.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==============================================================================
            REPORT CATEGORIES SECTION (#categories)
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
              <p className="mt-4 text-base text-muted-foreground sm:text-lg">
                Select from clear civic hazard categories to ensure your submission reaches the proper specialized operational department.
              </p>
            </div>

            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((cat) => {
                const IconComponent = cat.icon;
                return (
                  <Card key={cat.title} className="flex flex-col justify-between border-border/60 transition-all hover:border-primary/40 hover:shadow-sm">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <IconComponent className="size-5" />
                        </div>
                        <Badge variant="secondary" className="text-xs font-normal">
                          {cat.badge}
                        </Badge>
                      </div>
                      <CardTitle className="pt-3 text-lg font-semibold text-foreground">{cat.title}</CardTitle>
                      <CardDescription className="text-sm leading-normal">{cat.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="rounded-lg bg-muted/60 p-2.5 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground/80">Examples:</span> {cat.examples}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==============================================================================
            PRIVACY & DATA HANDLING SECTION (#privacy)
            ============================================================================== */}
        <section id="privacy" className="py-20 sm:py-24 border-b border-border/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <Badge variant="outline" className="mb-3">
                  Data Governance & Security
                </Badge>
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Your Privacy is Protected by Design
                </h2>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  Civic incident reporting requires authentic citizen engagement while rigorously safeguarding personal information. Butuan Report is engineered around strict privacy principles:
                </p>

                <ul className="mt-6 space-y-4 text-sm text-foreground/90">
                  <li className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <CheckCircle2 className="size-3.5" />
                    </div>
                    <span>
                      <strong>Role-Based Access Control:</strong> Only authorized municipal dispatchers and assigned responders can view reporter contact details for verification purposes.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <CheckCircle2 className="size-3.5" />
                    </div>
                    <span>
                      <strong>Private Evidence Storage:</strong> Uploaded photo evidence is stored in private, access-controlled buckets restricted strictly to the reporter and active responders.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <CheckCircle2 className="size-3.5" />
                    </div>
                    <span>
                      <strong>Segregated Internal Notes:</strong> Sensitive municipal coordination discussions are kept in protected internal channels; residents only receive public progress milestones.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <CheckCircle2 className="size-3.5" />
                    </div>
                    <span>
                      <strong>Immutable Audit Logging:</strong> Municipal staff and administrative actions are logged in tamper-evident audit records to ensure integrity and accountability.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Data Policy Card */}
              <div className="rounded-2xl border border-border bg-card p-8 shadow-xs">
                <div className="flex items-center gap-3 border-b border-border/60 pb-4">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Lock className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">Data Privacy Commitment</h3>
                    <p className="text-xs text-muted-foreground">Republic Act 10173 (Data Privacy Act of 2012)</p>
                  </div>
                </div>

                <div className="mt-6 space-y-4 text-xs leading-relaxed text-muted-foreground">
                  <p>
                    The City Government of Butuan collects user identity, contact details, and location coordinates solely for the operational purpose of investigating, validating, and resolving reported civic concerns.
                  </p>
                  <p>
                    Under no circumstance is resident data commercialized, rented, or shared with third-party advertising entities. Information is retained in accordance with Philippine municipal recordkeeping policies and securely archived once incidents are permanently closed.
                  </p>
                  <div className="rounded-lg border border-border/80 bg-muted/40 p-3">
                    <span className="font-semibold text-foreground">Inquiries:</span> For privacy concerns or data subject requests, citizens may contact the Butuan City Data Protection Officer via{" "}
                    <span className="font-mono text-foreground underline">dataprivacy@butuan.gov.ph</span>.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==============================================================================
            TERMS & RESPONSIBLE REPORTING SECTION (#terms)
            ============================================================================== */}
        <section id="terms" className="py-20 sm:py-24 bg-muted/20 border-b border-border/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <Badge variant="outline" className="mb-3">
                Community Guidelines
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Terms of Responsible Civic Reporting
              </h2>
              <p className="mt-4 text-base text-muted-foreground sm:text-lg">
                To ensure municipal resources are efficiently deployed to legitimate hazards, all users agree to adhere to community standards:
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              <Card className="border-border/60 bg-card">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">1. Genuine Concerns Only</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Reports must represent real, observable community issues within the territorial jurisdiction of Butuan City. Filing false, frivolous, or fraudulent claims harms community safety and violates municipal regulations.
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">2. Accurate Location & Proof</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Provide exact barangay names, street references, and nearby landmarks whenever possible. Upload recent, unedited photos of the hazard to enable swift assessment by dispatchers.
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">3. Respectful Communication</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Interactions with city responders and municipal teams must remain constructive and professional. Content containing defamation, profanity, harassment, or political propaganda will be rejected.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ==============================================================================
            FINAL CALL TO ACTION SECTION
            ============================================================================== */}
        <section className="relative overflow-hidden py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-3xl border border-primary/20 bg-gradient-to-b from-primary/10 via-card to-card p-10 sm:p-16 text-center shadow-lg">
              <Badge variant="secondary" className="mb-4">
                Citizen Action
              </Badge>
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                Your report matters.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                Every alert citizen who spots a road hazard, a blocked floodway, or a dangerous utility pole helps prevent accidents before they happen. Take 2 minutes to submit an incident today.
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
                  <ShieldAlert className="size-4" />
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
                  <Link href="#about" className="hover:text-foreground transition-colors">
                    About the Platform
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
                    Terms of Use
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-foreground transition-colors">
                    Data Collection Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-foreground transition-colors">
                    Community Guidelines
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact & Support */}
            <div>
              <h4 className="text-sm font-semibold text-foreground">Contact & Emergency</h4>
              <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                <li>
                  <span className="font-semibold text-foreground">National Hotline:</span> 911
                </li>
                <li>
                  <span className="font-semibold text-foreground">CDRRMO Landline:</span> (085) 341-1111
                </li>
                <li>
                  <span className="font-semibold text-foreground">CDRRMO Mobile:</span> 0919-065-0105
                </li>
                <li>
                  <span className="font-semibold text-foreground">Email Support:</span>{" "}
                  <span className="font-mono">support@butuanreport.gov.ph</span>
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

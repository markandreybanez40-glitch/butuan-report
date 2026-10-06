import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { SignIn, SignOutButton } from "@clerk/nextjs";
import { ShieldCheck, ShieldAlert, Building2, User, LogOut } from "lucide-react";
import { getCurrentProfile } from "@/lib/data/profiles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Administrator Sign In | Butuan Report",
  description: "Official administrative login gateway for Butuan City municipal officials and authorized personnel",
};

export default async function AdminSignInPage() {
  const user = await currentUser();

  if (user) {
    const profile = await getCurrentProfile();

    if (profile?.role === "admin") {
      redirect("/admin");
    }

    // Authenticated user with non-admin role: show structured switcher alert
    return (
      <div className="min-h-screen bg-muted/30 dark:bg-background flex flex-col justify-between p-4 sm:p-6 lg:p-8">
        <header className="flex items-center justify-between max-w-6xl w-full mx-auto">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-foreground text-sm hover:opacity-80 transition-opacity"
          >
            <div className="size-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-black">
              B
            </div>
            <span>Butuan Report</span>
          </Link>
          <ThemeToggle />
        </header>

        <main className="max-w-md w-full mx-auto my-8">
          <div className="rounded-2xl border border-destructive/30 bg-card p-6 sm:p-8 shadow-lg text-center space-y-5">
            <div className="size-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <ShieldAlert className="size-7" />
            </div>

            <div className="space-y-2">
              <Badge variant="destructive" className="uppercase font-semibold tracking-wider text-[10px]">
                Access Restricted
              </Badge>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Administrator Privileges Required
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You are currently signed in as <strong className="text-foreground">{profile?.full_name || user.firstName || "Resident"}</strong> with the role of <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono font-semibold">{profile?.role || "resident"}</code>.
              </p>
              <p className="text-xs text-muted-foreground">
                This gateway is strictly restricted to designated city executive administrators.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <Link href="/dashboard" className="w-full">
                <Button className="w-full font-medium" variant="default">
                  Continue to Resident Dashboard
                </Button>
              </Link>
              <SignOutButton redirectUrl="/admin/sign-in">
                <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                  <LogOut className="size-4" />
                  Sign Out to Switch Accounts
                </Button>
              </SignOutButton>
            </div>
          </div>
        </main>

        <footer className="text-center text-xs text-muted-foreground max-w-md mx-auto">
          City Government of Butuan &bull; Official Incident Response System
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950/10 via-background to-background flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Bar */}
      <header className="flex items-center justify-between max-w-6xl w-full mx-auto">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-foreground text-sm hover:opacity-80 transition-opacity"
        >
          <div className="size-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-black shadow-xs">
            B
          </div>
          <div className="flex flex-col">
            <span className="leading-tight">Butuan Report</span>
            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold tracking-wider uppercase">
              Admin Portal
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="max-w-md w-full mx-auto my-6 space-y-6">
        {/* Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-semibold">
            <ShieldCheck className="size-3.5" />
            Official Administrative Gateway
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Command Center Login
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
            Authorized access for municipal executives, department heads, and dispatch controllers.
          </p>
        </div>

        {/* Clerk Sign-In Component with explicit admin paths */}
        <div className="flex justify-center">
          <SignIn
            routing="path"
            path="/admin/sign-in"
            fallbackRedirectUrl="/admin"
            forceRedirectUrl="/admin"
            signUpUrl={undefined}
            appearance={{
              elements: {
                rootBox: "w-full mx-auto",
                card: "shadow-lg border border-purple-500/20 bg-card/95 backdrop-blur-xs",
                headerTitle: "text-foreground font-bold",
                headerSubtitle: "text-muted-foreground text-xs",
              },
            }}
          />
        </div>

        {/* Security Notice & Resident Switcher */}
        <div className="rounded-xl border border-border/80 bg-card/60 p-4 space-y-3 text-xs text-muted-foreground shadow-2xs">
          <div className="flex items-start gap-2.5">
            <Building2 className="size-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-foreground block">
                Official Government Access Notice
              </span>
              <p className="leading-relaxed">
                Administrative actions and access logs are recorded for municipal audit compliance. Resident accounts logging in here will be automatically redirected to the citizen dashboard.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Looking for public citizen services?</span>
            <Link
              href="/sign-in"
              className="font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              <User className="size-3" />
              Resident Sign In &rarr;
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-muted-foreground max-w-md mx-auto space-y-1">
        <p>City Government of Butuan &bull; Public Safety & Operations</p>
        <p className="text-[11px] text-muted-foreground/80">
          Protected by Row Level Security and Clerk Multi-Factor Authentication
        </p>
      </footer>
    </div>
  );
}

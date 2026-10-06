import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { Shield, UserCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata = {
  title: "Citizen Sign In | Butuan Report",
  description: "Sign in to Butuan Report to submit and monitor municipal hazard reports",
};

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-muted/20 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <header className="flex items-center justify-between max-w-6xl w-full mx-auto">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-foreground text-sm hover:opacity-80 transition-opacity"
        >
          <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-black shadow-xs">
            B
          </div>
          <span className="leading-tight">Butuan Report</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Center Sign In Box */}
      <main className="max-w-md w-full mx-auto my-6 space-y-6">
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <UserCheck className="size-3.5" />
            Resident & Citizen Access
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Sign in to your account
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
            Submit hazard reports, track dispatch status, and receive real-time municipal alerts.
          </p>
        </div>

        <div className="flex justify-center">
          <SignIn
            routing="path"
            path="/sign-in"
            fallbackRedirectUrl="/dashboard"
            forceRedirectUrl="/dashboard"
            signUpUrl="/sign-up"
            appearance={{
              elements: {
                rootBox: "w-full mx-auto",
                card: "shadow-md border border-border bg-card",
                headerTitle: "text-foreground font-bold",
                headerSubtitle: "text-muted-foreground text-xs",
              },
            }}
          />
        </div>

        {/* Link to Admin Sign-In */}
        <div className="rounded-xl border border-border/80 bg-card/60 p-4 text-center text-xs text-muted-foreground shadow-2xs space-y-2">
          <div className="flex items-center justify-center gap-1.5 font-medium text-foreground">
            <Shield className="size-3.5 text-purple-600 dark:text-purple-400" />
            <span>Are you a City Official or Administrator?</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Authorized municipal personnel can access the executive management portal:
          </p>
          <div className="pt-1">
            <Link
              href="/admin/sign-in"
              className="inline-flex items-center gap-1 font-semibold text-purple-600 dark:text-purple-400 hover:underline"
            >
              Go to Administrator Sign In &rarr;
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-muted-foreground max-w-md mx-auto">
        City Government of Butuan &bull; Public Safety Reporting System
      </footer>
    </div>
  );
}

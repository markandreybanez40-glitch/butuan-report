import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { UserPlus, Shield } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata = {
  title: "Create Account | Butuan Report",
  description: "Register for Butuan Report to submit incident reports and receive emergency notifications",
};

export default function SignUpPage() {
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

      {/* Center Sign Up Box */}
      <main className="max-w-md w-full mx-auto my-6 space-y-6">
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <UserPlus className="size-3.5" />
            Citizen Registration
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Create your account
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
            Join the community in keeping Butuan City safe and clean.
          </p>
        </div>

        <div className="flex justify-center">
          <SignUp
            routing="path"
            path="/sign-up"
            fallbackRedirectUrl="/dashboard"
            forceRedirectUrl="/dashboard"
            signInUrl="/sign-in"
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

        <div className="rounded-xl border border-border/80 bg-card/60 p-4 text-center text-xs text-muted-foreground shadow-2xs">
          <span>Already have an administrative account? </span>
          <Link
            href="/admin/sign-in"
            className="font-semibold text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-1 ml-1"
          >
            <Shield className="size-3" />
            Admin Login
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-muted-foreground max-w-md mx-auto">
        City Government of Butuan &bull; Public Safety Reporting System
      </footer>
    </div>
  );
}

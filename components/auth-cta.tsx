"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { ArrowRight, LayoutDashboard } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AuthCtaProps {
  mode: "hero" | "final";
}

export function AuthCta({ mode }: AuthCtaProps) {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
        <Link
          href="/dashboard"
          className={cn(buttonVariants({ size: "lg" }), "rounded-full px-8 shadow-md opacity-90")}
        >
          Report an Incident
          <ArrowRight className="ml-1.5 size-4" />
        </Link>
        {mode === "hero" ? (
          <Link
            href="#about"
            className={cn(buttonVariants({ size: "lg", variant: "outline" }), "rounded-full px-7")}
          >
            Learn More
          </Link>
        ) : (
          <Link
            href="/sign-in"
            className={cn(buttonVariants({ size: "lg", variant: "outline" }), "rounded-full px-8")}
          >
            Sign In
          </Link>
        )}
      </div>
    );
  }

  if (isSignedIn) {
    return (
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
        <Link
          href="/dashboard"
          className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto rounded-full px-8 shadow-md")}
        >
          {mode === "hero" ? "Report an Incident" : "Report an Incident Now"}
          <ArrowRight className="ml-1.5 size-4" />
        </Link>
        {mode === "hero" ? (
          <Link
            href="#about"
            className={cn(buttonVariants({ size: "lg", variant: "outline" }), "w-full sm:w-auto rounded-full px-7")}
          >
            Learn More
          </Link>
        ) : (
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ size: "lg", variant: "outline" }), "w-full sm:w-auto rounded-full px-8")}
          >
            <LayoutDashboard className="mr-2 size-4" />
            Go to Dashboard
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
      <Link
        href="/sign-in?redirect_url=/dashboard"
        className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto rounded-full px-8 shadow-md")}
      >
        {mode === "hero" ? "Report an Incident" : "Report an Incident Now"}
        <ArrowRight className="ml-1.5 size-4" />
      </Link>
      {mode === "hero" ? (
        <Link
          href="#about"
          className={cn(buttonVariants({ size: "lg", variant: "outline" }), "w-full sm:w-auto rounded-full px-7")}
        >
          Learn More
        </Link>
      ) : (
        <Link
          href="/sign-in"
          className={cn(buttonVariants({ size: "lg", variant: "outline" }), "w-full sm:w-auto rounded-full px-8")}
        >
          Sign In to Existing Account
        </Link>
      )}
    </div>
  );
}

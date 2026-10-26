import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

// Security Guard: Prevent any execution or bundling in browser client-side environments
if (typeof window !== "undefined") {
  throw new Error(
    "Security Violation: lib/supabase/server.ts cannot be imported or executed in browser client-side code."
  );
}

/**
 * Creates a server-side Supabase client authenticated with the user's Clerk session token
 * via Supabase's native third-party authentication integration.
 *
 * Uses:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (Strictly publishable/anon key only)
 * - Clerk's server-side auth().getToken()
 *
 * Enforces database Row Level Security (RLS) under the authenticated caller's identity.
 */
export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    );
  }

  return createClient<Database>(supabaseUrl, supabaseKey, {
    async accessToken() {
      try {
        const authObj = await auth();
        return (await authObj?.getToken()) ?? null;
      } catch {
        return null;
      }
    },
  });
}

/**
 * Alias for createServerSupabaseClient
 */
export const createClerkSupabaseClient = createServerSupabaseClient;

/**
 * Creates a privileged service-role Supabase client for trusted server-side operations
 * (such as system-level cross-user notifications and immutable audit log insertions).
 *
 * SECURITY POLICY:
 * - Strictly isolated to server-side execution.
 * - Requires explicit server-side role/permission validation before invocation.
 * - Strict key isolation: Requires SUPABASE_SECRET_KEY. Never uses NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as fallback.
 * - Never expose SUPABASE_SECRET_KEY to client code, logs, or error responses.
 */
export function createAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "Missing required Supabase environment variable: NEXT_PUBLIC_SUPABASE_URL."
    );
  }

  if (!serviceKey) {
    throw new Error(
      "Missing required Supabase environment variable: SUPABASE_SECRET_KEY. Privileged server operations require a valid service-role key."
    );
  }

  return createClient<Database>(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}



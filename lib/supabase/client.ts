import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Creates a browser-side Supabase client authenticated with the user's Clerk session token
 * via Supabase's native third-party authentication integration.
 *
 * @param sessionOrGetToken An object containing getToken() (e.g. from useSession()) or a getToken function
 */
export function createBrowserSupabaseClient(
  sessionOrGetToken?: { getToken: () => Promise<string | null> } | (() => Promise<string | null>) | null
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    );
  }

  return createClient<Database>(supabaseUrl, supabaseKey, {
    async accessToken() {
      if (typeof sessionOrGetToken === "function") {
        return (await sessionOrGetToken()) ?? null;
      }
      if (sessionOrGetToken && typeof sessionOrGetToken.getToken === "function") {
        return (await sessionOrGetToken.getToken()) ?? null;
      }
      return null;
    },
  });
}

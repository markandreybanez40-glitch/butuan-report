/**
 * Butuan Report — Test Safety Guard
 *
 * Prevents accidental execution of database-writing test suites against production
 * or non-test Supabase environments.
 */

export function assertSafeTestEnvironment(testSuiteName?: string): void {
  // 1. Strict production environment block
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      `[TEST SAFETY CRITICAL] Blocked execution of database-writing test suite "${testSuiteName || "unnamed"}": NODE_ENV is set to "production".`
    );
  }

  // 2. Explicit test database write authorization flag
  // Tests that perform INSERT, UPDATE, or DELETE on Supabase tables MUST have SUPABASE_ALLOW_TEST_WRITES="true"
  // configured in an isolated test environment (e.g. .env.test or CI test container).
  const allowWrites = process.env.SUPABASE_ALLOW_TEST_WRITES?.trim().toLowerCase();
  if (allowWrites !== "true") {
    throw new Error(
      `[TEST SAFETY BLOCKED] Refusing to run database-writing test suite "${testSuiteName || "unnamed"}".\n\n` +
      `SAFETY RULE: Automated tests that mutate database tables (profiles, incidents, assignments, notifications, audit logs)\n` +
      `are strictly disabled by default to protect live and production databases from accidental data corruption.\n\n` +
      `To run database integration tests safely against a dedicated, isolated test database:\n` +
      `  1. Ensure your .env.test or test configuration points to an isolated test Supabase project.\n` +
      `  2. Set the environment variable: SUPABASE_ALLOW_TEST_WRITES=true\n` +
      `  3. Never run database-writing tests against the deployed production database.\n`
    );
  }

  // 3. Prevent running against production URL if explicit production URL is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const prodUrl = process.env.PRODUCTION_SUPABASE_URL?.trim();
  if (prodUrl && supabaseUrl && prodUrl === supabaseUrl) {
    throw new Error(
      `[TEST SAFETY CRITICAL] Blocked execution: NEXT_PUBLIC_SUPABASE_URL matches PRODUCTION_SUPABASE_URL ("${prodUrl}").`
    );
  }
}

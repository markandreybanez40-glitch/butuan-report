import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";

describe("Supabase Server Client & Key Security Verification", () => {
  const originalSecretKey = process.env.SUPABASE_SECRET_KEY;
  const originalPubUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalPubKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  test("1. createAdminSupabaseClient strictly requires SUPABASE_SECRET_KEY and does not fall back to publishable key", () => {
    // Temporarily unset SUPABASE_SECRET_KEY while keeping publishable key present
    delete process.env.SUPABASE_SECRET_KEY;

    try {
      assert.throws(
        () => {
          createAdminSupabaseClient();
        },
        /SUPABASE_SECRET_KEY/,
        "createAdminSupabaseClient must throw when SUPABASE_SECRET_KEY is absent and NEVER fall back to publishable key"
      );
    } finally {
      process.env.SUPABASE_SECRET_KEY = originalSecretKey;
    }
  });

  test("2. createAdminSupabaseClient strictly requires NEXT_PUBLIC_SUPABASE_URL", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;

    try {
      assert.throws(
        () => {
          createAdminSupabaseClient();
        },
        /NEXT_PUBLIC_SUPABASE_URL/,
        "createAdminSupabaseClient must throw when NEXT_PUBLIC_SUPABASE_URL is absent"
      );
    } finally {
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalPubUrl;
    }
  });

  test("3. createServerSupabaseClient strictly requires NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    try {
      assert.throws(
        () => {
          createServerSupabaseClient();
        },
        /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/,
        "createServerSupabaseClient must require publishable key and never fall back to secret key"
      );
    } finally {
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = originalPubKey;
    }
  });

  test("4. createAdminSupabaseClient successfully initializes with valid SUPABASE_SECRET_KEY", () => {
    assert.ok(process.env.SUPABASE_SECRET_KEY, "SUPABASE_SECRET_KEY must be configured in environment");
    const client = createAdminSupabaseClient();
    assert.ok(client, "Admin Supabase client should be instantiated");
    assert.equal(typeof client.from, "function", "Client must expose standard query builder");
  });

  test("5. createServerSupabaseClient successfully initializes with publishable key and Clerk session handler", () => {
    assert.ok(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, "Publishable key must be configured in environment");
    const client = createServerSupabaseClient();
    assert.ok(client, "Server Supabase client should be instantiated");
    assert.equal(typeof client.from, "function", "Client must expose standard query builder");
  });
});

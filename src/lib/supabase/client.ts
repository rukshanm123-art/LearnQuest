"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser Supabase client (anon key).
 *
 * The URL + anon key are PUBLIC by design — they ship to every browser; row
 * level security (see supabase/schema.sql) is the real boundary. They're
 * provided here as a build fallback so the client is always configured even
 * when the host marks env vars build-sensitive. The SECRET service_role key is
 * never here — see server.ts. Returns `null` only if both are somehow blank,
 * in which case the app runs in local demo mode.
 */
const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bqpzwxdljkznpvulvopt.supabase.co";
const anon =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxcHp3eGRsamt6bnB2dWx2b3B0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMzQ4MjUsImV4cCI6MjA5NzgxMDgyNX0.r-ERfzCqdkPYCQ2k2jwkVnGZwN2_-WjIOjt60utkw90";

export const isSupabaseConfigured = Boolean(url && anon);

let cached: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!cached) cached = createClient(url!, anon!);
  return cached;
}

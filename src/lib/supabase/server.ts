import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server Supabase client (service-role key) for trusted server actions and
 * route handlers — leaderboard aggregation, teacher analytics, reward writes
 * that must not be tamper-able from the client. NEVER import this into a
 * client component.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isServerSupabaseConfigured = Boolean(url && service);

export function getServerSupabase(): SupabaseClient | null {
  if (!isServerSupabaseConfigured) return null;
  return createClient(url!, service!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

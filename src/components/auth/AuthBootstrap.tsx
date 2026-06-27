"use client";

import { useEffect } from "react";
import { useEnsureSeeded, useAuthHydrated } from "@/lib/auth/guard";
import { useAuth } from "@/lib/auth/store";
import { useCloudProgressSync } from "@/lib/store/cloudSync";

/**
 * Mounted once in the root layout. Seeds the demo accounts, restores any
 * Supabase session (cloud mode), and keeps cloud progress synced. Renders
 * nothing.
 */
export function AuthBootstrap() {
  useEnsureSeeded();
  const hydrated = useAuthHydrated();
  const restoreSession = useAuth((s) => s.restoreSession);

  useEffect(() => {
    if (hydrated) void restoreSession();
  }, [hydrated, restoreSession]);

  useCloudProgressSync();
  return null;
}

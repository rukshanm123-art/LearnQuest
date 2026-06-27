"use client";

import { useEffect } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { savePlayerState } from "@/lib/supabase/cloud";
import { useGameStore } from "./useGameStore";
import { useAuth } from "@/lib/auth/store";

/**
 * Persists the logged-in cloud player's progress to Supabase. Subscribes to the
 * game store and debounce-writes player_state after changes. No-op for demo /
 * guest accounts (those keep localStorage persistence only).
 */
export function useCloudProgressSync() {
  const account = useAuth((s) => (s.currentId ? s.accounts[s.currentId] : null));
  const isCloud = isSupabaseConfigured && !!account?.cloud;
  const profileId = account?.id;

  useEffect(() => {
    if (!isCloud || !profileId) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsub = useGameStore.subscribe(() => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void savePlayerState(profileId, useGameStore.getState().snapshot());
      }, 1500);
    });
    return () => {
      if (timer) clearTimeout(timer);
      unsub();
    };
  }, [isCloud, profileId]);
}

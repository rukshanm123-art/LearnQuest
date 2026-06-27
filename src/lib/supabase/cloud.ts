"use client";

import { getSupabaseClient } from "./client";
import type { Role } from "@/lib/auth/types";
import type { AgeBand, PlayerState } from "@/types";

/**
 * Cloud data layer (Supabase Auth + profiles + player_state).
 * Used by the auth store / game store ONLY when Supabase is configured.
 * Full game progress is stored as a JSON blob in player_state.state, with the
 * hot counters mirrored into columns for leaderboard queries.
 */

export interface CloudProfile {
  id: string; // profiles.id (== player_state.profile_id)
  role: Role;
  displayName: string;
  ageBand?: AgeBand;
  email: string;
  createdAt: string;
  bio?: string;
  favouriteSubject?: string;
  avatarUrl?: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchProfile(authId: string, email: string): Promise<CloudProfile | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  // The handle_new_user trigger creates the row; retry briefly for timing.
  for (let i = 0; i < 4; i++) {
    const { data } = await sb
      .from("profiles")
      .select("id, role, display_name, age_band, created_at, bio, favourite_subject, avatar_url")
      .eq("auth_id", authId)
      .maybeSingle();
    if (data) {
      return {
        id: data.id,
        role: data.role as Role,
        displayName: data.display_name,
        ageBand: (data.age_band ?? undefined) as AgeBand | undefined,
        email,
        createdAt: data.created_at,
        bio: data.bio ?? undefined,
        favouriteSubject: data.favourite_subject ?? undefined,
        avatarUrl: data.avatar_url ?? undefined,
      };
    }
    await sleep(250);
  }
  return null;
}

export async function cloudSignUp(i: {
  email: string;
  password: string;
  displayName: string;
  role: Role;
  ageBand?: AgeBand;
}): Promise<{ ok: boolean; error?: string; profile?: CloudProfile; needsVerification?: boolean }> {
  const sb = getSupabaseClient();
  if (!sb) return { ok: false, error: "Cloud not configured." };
  const { data, error } = await sb.auth.signUp({
    email: i.email,
    password: i.password,
    options: { data: { display_name: i.displayName, role: i.role, age_band: i.ageBand ?? null } },
  });
  if (error) return { ok: false, error: error.message };
  if (!data.user) return { ok: false, error: "Sign up failed." };
  // No session means email confirmation is required before sign-in.
  if (!data.session) return { ok: true, needsVerification: true };
  const profile = await fetchProfile(data.user.id, i.email);
  if (!profile) return { ok: false, error: "Profile not ready — please sign in." };
  return { ok: true, profile };
}

/** Update the signed-in user's profile (bio / favourite subject / name / age / photo). */
export async function updateCloudProfile(
  profileId: string,
  patch: { bio?: string; favouriteSubject?: string; displayName?: string; ageBand?: AgeBand; avatarUrl?: string },
): Promise<void> {
  const sb = getSupabaseClient();
  if (!sb) return;
  const row: Record<string, unknown> = {};
  if (patch.bio !== undefined) row.bio = patch.bio;
  if (patch.favouriteSubject !== undefined) row.favourite_subject = patch.favouriteSubject;
  if (patch.displayName !== undefined) row.display_name = patch.displayName;
  if (patch.ageBand !== undefined) row.age_band = patch.ageBand;
  if (patch.avatarUrl !== undefined) row.avatar_url = patch.avatarUrl;
  if (Object.keys(row).length) await sb.from("profiles").update(row).eq("id", profileId);
}

/** Upload a profile photo to Storage and return its public URL. */
export async function uploadAvatar(profileId: string, file: File): Promise<string | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `${profileId}-${Date.now()}.${ext}`;
  const { error } = await sb.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
  if (error) return null;
  return sb.storage.from("avatars").getPublicUrl(path).data.publicUrl;
}

export async function cloudSignIn(
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string; profile?: CloudProfile }> {
  const sb = getSupabaseClient();
  if (!sb) return { ok: false, error: "Cloud not configured." };
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
  if (!data.user) return { ok: false, error: "Sign in failed." };
  const profile = await fetchProfile(data.user.id, email);
  if (!profile) return { ok: false, error: "Could not load your profile." };
  return { ok: true, profile };
}

export async function cloudCurrentProfile(): Promise<CloudProfile | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  if (!data.user) return null;
  return fetchProfile(data.user.id, data.user.email ?? "");
}

export async function cloudSignOut(): Promise<void> {
  const sb = getSupabaseClient();
  await sb?.auth.signOut();
}

export async function cloudResendVerification(email: string): Promise<void> {
  const sb = getSupabaseClient();
  if (!sb) return;
  await sb.auth.resend({ type: "signup", email });
}

/** Send a password-reset email that links back to /reset-password. */
export async function cloudResetPassword(email: string): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabaseClient();
  if (!sb) return { ok: false, error: "Cloud not configured." };
  const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
  return error ? { ok: false, error: error.message } : { ok: true };
}

/** Set a new password (during a recovery session) and return whether a session exists. */
export async function cloudUpdatePassword(password: string): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabaseClient();
  if (!sb) return { ok: false, error: "Cloud not configured." };
  const { error } = await sb.auth.updateUser({ password });
  return error ? { ok: false, error: error.message } : { ok: true };
}

/** True if there's an active session (used by /reset-password to validate the link). */
export async function cloudHasSession(): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb) return false;
  const { data } = await sb.auth.getSession();
  return !!data.session;
}

export async function loadPlayerState(profileId: string): Promise<PlayerState | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const { data } = await sb.from("player_state").select("state").eq("profile_id", profileId).maybeSingle();
  return (data?.state as PlayerState) ?? null;
}

export async function savePlayerState(profileId: string, player: PlayerState): Promise<void> {
  const sb = getSupabaseClient();
  if (!sb) return;
  await sb.from("player_state").upsert(
    {
      profile_id: profileId,
      total_xp: player.totalXp,
      coins: player.coins,
      gems: player.gems,
      streak_days: player.streakDays,
      last_active_date: player.lastActiveDate,
      equipped_pet_id: player.equippedPetId,
      equipped_avatar: player.equippedAvatar,
      state: player,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "profile_id" },
  );
}

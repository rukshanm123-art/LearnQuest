"use client";

import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { ContentItem, ContentStatus } from "./types";
import type { Question } from "@/types";

/**
 * Supabase content repository (production persistence for the CMS, #01/#15).
 *
 * When Supabase is configured these functions read/write the `questions` table
 * (RLS-guarded by author/reviewer/admin — see supabase/schema.sql). When it's
 * not configured they no-op / return empty, so the app stays fully functional
 * on the local demo store. The content store write-throughs call these.
 */

export const contentRemoteEnabled = isSupabaseConfigured;
const TABLE = "questions";

interface Row {
  id: string;
  subject: Question["subject"];
  strand_id: string;
  age_band: Question["ageBand"];
  level: number;
  type: Question["type"];
  difficulty: number;
  prompt: string;
  passage: string | null;
  options: string[] | null;
  tokens: string[] | null;
  answer: number | string;
  explanation: string;
  xp: number;
  coins: number;
  year: number | null;
  objective_ids: string[];
  status: ContentStatus;
  version: number;
  updated_at: string;
  author_name: string | null;
}

function toRow(it: ContentItem): Row {
  return {
    id: it.id, subject: it.subject, strand_id: it.strandId, age_band: it.ageBand,
    level: it.level, type: it.type, difficulty: it.difficulty, prompt: it.prompt,
    passage: it.passage ?? null, options: it.options ?? null, tokens: it.tokens ?? null,
    answer: it.answer, explanation: it.explanation, xp: it.xp, coins: it.coins,
    year: it.year ?? null, objective_ids: it.objectiveIds ?? [], status: it.status,
    version: it.version, updated_at: it.updatedAt, author_name: it.authorName ?? null,
  };
}

function fromRow(r: Row): ContentItem {
  return {
    id: r.id, subject: r.subject, strandId: r.strand_id, ageBand: r.age_band,
    level: r.level as ContentItem["level"], type: r.type, difficulty: r.difficulty as ContentItem["difficulty"],
    prompt: r.prompt, passage: r.passage ?? undefined, options: r.options ?? undefined, tokens: r.tokens ?? undefined,
    answer: r.answer, explanation: r.explanation, xp: r.xp, coins: r.coins,
    year: r.year ?? undefined, objectiveIds: r.objective_ids ?? [], status: r.status,
    version: r.version ?? 1, updatedAt: r.updated_at ?? new Date().toISOString(), authorName: r.author_name ?? undefined,
  };
}

export async function listContent(): Promise<ContentItem[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];
  const { data, error } = await sb.from(TABLE).select("*");
  if (error || !data) return [];
  return (data as Row[]).map(fromRow);
}

export async function upsertContent(it: ContentItem): Promise<void> {
  const sb = getSupabaseClient();
  if (!sb) return;
  await sb.from(TABLE).upsert(toRow(it));
}

export async function setContentStatus(id: string, status: ContentStatus): Promise<void> {
  const sb = getSupabaseClient();
  if (!sb) return;
  await sb.from(TABLE).update({ status, updated_at: new Date().toISOString() }).eq("id", id);
}

export async function deleteContent(id: string): Promise<void> {
  const sb = getSupabaseClient();
  if (!sb) return;
  await sb.from(TABLE).delete().eq("id", id);
}

export async function bulkUpsertContent(items: ContentItem[]): Promise<void> {
  const sb = getSupabaseClient();
  if (!sb || items.length === 0) return;
  await sb.from(TABLE).upsert(items.map(toRow));
}

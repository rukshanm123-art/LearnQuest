"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useEffect, useState } from "react";
import type { Question } from "@/types";
import { QUESTIONS } from "@/data/questions";
import type { ContentItem, ContentStatus } from "./types";
import {
  contentRemoteEnabled, listContent, upsertContent,
  setContentStatus as remoteSetStatus, deleteContent, bulkUpsertContent,
} from "./supabase-repo";

/**
 * Browser-local content store (the demo backend for the authoring CMS, #01).
 * Seeds from the static question bank as `published` items so the library and
 * coverage views have data. In production these actions become CMS API calls
 * writing to Postgres (see supabase/schema.sql + docs/CONTENT_PIPELINE.md).
 */

const now = () => new Date().toISOString();
const genId = () => "q-" + Math.random().toString(36).slice(2, 8);
const levelToYear = (level: number) => Math.min(8, Math.max(1, level * 2));

function seedItems(): Record<string, ContentItem> {
  const out: Record<string, ContentItem> = {};
  for (const q of QUESTIONS) {
    out[q.id] = {
      ...q,
      status: "published",
      version: 1,
      objectiveIds: q.objectiveIds ?? [],
      year: q.year ?? levelToYear(q.level),
      updatedAt: now(),
      authorName: q.id.startsWith("mb-") ? "Maths bank" : q.id.startsWith("eb-") ? "English bank" : q.id.startsWith("sb-") ? "Science bank" : "Seed",
    };
  }
  return out;
}

interface ContentStore {
  items: Record<string, ContentItem>;
  seeded: boolean;
  _hydrated: boolean;

  setHydrated: (v: boolean) => void;
  seed: () => void;
  hydrateFrom: (items: ContentItem[]) => void;
  save: (item: ContentItem) => string;
  setStatus: (id: string, status: ContentStatus) => void;
  duplicate: (id: string) => string | null;
  remove: (id: string) => void;
  importItems: (items: Question[], authorName?: string) => { added: number };
  resetContent: () => void;
}

export const useContentStore = create<ContentStore>()(
  persist(
    (set, get) => ({
      items: {},
      seeded: false,
      _hydrated: false,

      setHydrated: (v) => set({ _hydrated: v }),

      seed: () => {
        if (get().seeded) return;
        set((s) => ({ seeded: true, items: { ...seedItems(), ...s.items } }));
      },

      hydrateFrom: (list) =>
        set({ seeded: true, items: Object.fromEntries(list.map((i) => [i.id, i])) }),

      save: (item) => {
        const id = item.id || genId();
        const existing = get().items[id];
        const next: ContentItem = {
          ...item,
          id,
          version: existing ? existing.version + 1 : item.version || 1,
          updatedAt: now(),
        };
        set((s) => ({ items: { ...s.items, [id]: next } }));
        if (contentRemoteEnabled) void upsertContent(next).catch(() => {});
        return id;
      },

      setStatus: (id, status) => {
        if (!get().items[id]) return;
        set((s) => ({ items: { ...s.items, [id]: { ...s.items[id], status, updatedAt: now() } } }));
        if (contentRemoteEnabled) void remoteSetStatus(id, status).catch(() => {});
      },

      duplicate: (id) => {
        const src = get().items[id];
        if (!src) return null;
        const newId = genId();
        set((s) => ({ items: { ...s.items, [newId]: { ...src, id: newId, status: "draft", version: 1, updatedAt: now() } } }));
        return newId;
      },

      remove: (id) => {
        set((s) => {
          const items = { ...s.items };
          delete items[id];
          return { items };
        });
        if (contentRemoteEnabled) void deleteContent(id).catch(() => {});
      },

      importItems: (incoming, authorName) => {
        const items = { ...get().items };
        const addedItems: ContentItem[] = [];
        for (const q of incoming) {
          const id = items[q.id] ? genId() : q.id;
          const ci: ContentItem = {
            ...q,
            id,
            status: "draft",
            version: 1,
            objectiveIds: q.objectiveIds ?? [],
            year: q.year ?? levelToYear(q.level),
            updatedAt: now(),
            authorName: authorName ?? "Import",
          };
          items[id] = ci;
          addedItems.push(ci);
        }
        set({ items });
        if (contentRemoteEnabled) void bulkUpsertContent(addedItems).catch(() => {});
        return { added: addedItems.length };
      },

      resetContent: () => set({ items: seedItems(), seeded: true }),
    }),
    {
      name: "learnquest-content-v3",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : (undefined as unknown as Storage),
      ),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
      partialize: ({ _hydrated, ...rest }) => rest,
    },
  ),
);

export function useContentHydrated(): boolean {
  const hydrated = useContentStore((s) => s._hydrated);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted && hydrated;
}

/** Seeds the content store once after hydration. */
export function useEnsureContentSeeded() {
  const hydrated = useContentHydrated();
  const seeded = useContentStore((s) => s.seeded);
  const seed = useContentStore((s) => s.seed);
  useEffect(() => {
    if (hydrated && !seeded) seed();
  }, [hydrated, seeded, seed]);
}

/**
 * Bootstraps content for the CMS: loads from Supabase when configured,
 * otherwise seeds the local demo bank. Use this on the /author page.
 */
export function useContentBootstrap() {
  const hydrated = useContentHydrated();
  const seeded = useContentStore((s) => s.seeded);
  const seed = useContentStore((s) => s.seed);
  const hydrateFrom = useContentStore((s) => s.hydrateFrom);
  useEffect(() => {
    if (!hydrated) return;
    if (contentRemoteEnabled) {
      listContent()
        .then((items) => { if (items.length) hydrateFrom(items); else if (!seeded) seed(); })
        .catch(() => { if (!seeded) seed(); });
    } else if (!seeded) {
      seed();
    }
  }, [hydrated, seeded, seed, hydrateFrom]);
}

/** Published items not already in the static seed bank — merged into gameplay pools. */
export function usePublishedExtras(): Question[] {
  return useContentStore((s) =>
    Object.values(s.items).filter((i) => i.status === "published"),
  );
}

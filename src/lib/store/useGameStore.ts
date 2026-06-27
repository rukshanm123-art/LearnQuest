"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useEffect, useState } from "react";

import type {
  Achievement,
  AgeBand,
  AvatarPart,
  PlayerState,
  Question,
  Story,
  SubjectId,
  SubjectMastery,
} from "@/types";
import { SUBJECTS, WORLDS } from "@/lib/curriculum/nz-curriculum";
import {
  applyAttemptToMastery,
  computeReward,
  getLevelInfo,
  todayISO,
  updateStreak,
  type Reward,
} from "@/lib/gamification/engine";
import { COINS, DAILY_LOGIN_REWARDS, WEAKNESS_THRESHOLD } from "@/lib/gamification/constants";
import {
  ACHIEVEMENT_MAP,
  evaluateAchievements,
} from "@/lib/gamification/achievements";
import { PET_MAP } from "@/data/pets";
import { AVATAR_MAP } from "@/data/avatars";
import { QUEST_MAP } from "@/data/quests";
import { LESSON_MAP } from "@/data/lessons";
import { rollCritters, type Critter } from "@/data/critters";
import { DECOR_MAP } from "@/data/decor";

/** Outcome returned to the UI so it can fire celebrations (confetti, sfx). */
export interface AnswerOutcome {
  reward: Reward;
  leveledUp: boolean;
  newLevel: number;
  newlyUnlocked: Achievement[];
  correct: boolean;
  /** True when this correct answer was a replay of an already-cleared question. */
  repeat: boolean;
}

/** Outcome of a boss battle, used to gate the once-only reward. */
export interface BossOutcome {
  firstTime: boolean;
  xp: number;
  coins: number;
  newlyUnlocked: Achievement[];
}

/** Outcome of finishing a Learning Journey lesson. */
export interface LessonOutcome {
  stars: number; // best stars now held (0–3)
  coins: number; // bonus coins awarded this time
  firstClear: boolean;
  improved: boolean;
  critterId?: string; // critter awarded (first clear only)
}

/** Outcome of finishing a quest, used to drive the results celebration. */
export interface QuestOutcome {
  rewardXp: number;
  rewardCoins: number;
  leveledUp: boolean;
  newLevel: number;
  newlyUnlocked: Achievement[];
  isBoss: boolean;
  gotBossPet: boolean;
}

/** Pet awarded for defeating a boss. */
const BOSS_PET_ID = "dragon";

function emptyMastery(subject: SubjectId): SubjectMastery {
  return { subject, xp: 0, accuracy: 0, attempts: 0, weakStrands: [] };
}

function initialMastery(): Record<SubjectId, SubjectMastery> {
  return Object.fromEntries(
    SUBJECTS.map((s) => [s.id, emptyMastery(s.id)]),
  ) as Record<SubjectId, SubjectMastery>;
}

function worldsUnlockedAt(totalXp: number, existing: string[]): string[] {
  const set = new Set(existing);
  for (const w of WORLDS) if (totalXp >= w.unlockXp) set.add(w.id);
  return [...set];
}

const DEFAULT_PLAYER: PlayerState = {
  id: "demo-player",
  displayName: "Explorer",
  ageBand: "8-10",
  totalXp: 0,
  coins: 25,
  gems: 0,
  streakDays: 0,
  lastActiveDate: null,
  equippedPetId: null,
  ownedPetIds: [],
  equippedAvatar: { background: "bg-sky", base: "base-explorer", face: null, hat: null, outfit: "out-tshirt", accessory: null },
  ownedAvatarIds: ["base-explorer", "base-ava", "bg-sky", "out-tshirt"],
  rpmAvatarUrl: null,
  unlockedAchievementIds: [],
  completedQuestIds: [],
  lessonStars: {},
  defeatedBossIds: [],
  clearedQuestionIds: [],
  recentQuestionIds: [],
  unlockedWorldIds: WORLDS.filter((w) => w.unlockXp === 0).map((w) => w.id),
  mastery: initialMastery(),
  dailyXp: {},
};

/** How many recent questions to remember (to avoid serving immediate repeats). */
const RECENT_CAP = 30;
/** Replaying an already-cleared question earns this fraction of XP and no coins. */
const REPLAY_XP_FACTOR = 0.25;

interface GameStore extends PlayerState {
  _hasHydrated: boolean;
  lastDailyChallengeDate: string | null;
  lastLoginRewardDate: string | null;
  loginRewardDay: number;
  houseId: string | null;
  stories: Story[];
  /** Reading-age snapshot taken on first parent view, for "improvement this term". */
  readingBaseline: { age: number; since: string } | null;
  /** Critterpedia: ids of collected critters. */
  collectedCritterIds: string[];
  /** My Room: owned decor + placements (cell id → decor id). */
  ownedDecorIds: string[];
  roomItems: Record<string, string>;

  setHasHydrated: (v: boolean) => void;
  ensureReadingBaseline: (age: number) => void;
  discoverCritters: (n: number) => Critter[];
  buyDecor: (id: string) => boolean;
  placeDecor: (cell: string, id: string) => void;
  removeDecor: (cell: string) => void;
  claimLoginReward: () => { day: number; coins: number; gems: number } | null;
  joinHouse: (id: string) => void;
  spendCoins: (n: number) => boolean;
  grantReward: (r: { xp?: number; coins?: number; gems?: number }) => void;
  addStory: (s: Omit<Story, "id" | "createdAt">) => Story;
  removeStory: (id: string) => void;
  setDisplayName: (name: string) => void;
  setAgeBand: (age: AgeBand) => void;

  answer: (args: {
    question: Question;
    correct: boolean;
    answerText: string;
    timeMs: number;
  }) => AnswerOutcome;

  completeDailyChallenge: () => boolean;
  completeQuest: (questId: string, opts?: { perfect?: boolean }) => QuestOutcome | null;
  defeatBoss: (bossId: string, reward: { xp: number; coins: number }) => BossOutcome;
  completeLesson: (lessonId: string, stars: number) => LessonOutcome;
  adoptPet: (petId: string) => boolean;
  equipPet: (petId: string | null) => void;
  buyAvatarPart: (partId: string) => boolean;
  equipAvatarPart: (slot: AvatarPart["slot"], partId: string | null) => void;
  setRpmAvatar: (url: string | null) => void;
  resetProgress: () => void;

  /** Cloud sync: export the current progress / replace it from a cloud blob. */
  snapshot: () => PlayerState;
  hydratePlayer: (p: Partial<PlayerState>) => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_PLAYER,
      _hasHydrated: false,
      lastDailyChallengeDate: null,
      lastLoginRewardDate: null,
      loginRewardDay: 0,
      houseId: null,
      stories: [],
      readingBaseline: null,
      collectedCritterIds: [],
      ownedDecorIds: [],
      roomItems: {},

      setHasHydrated: (v) => set({ _hasHydrated: v }),
      ensureReadingBaseline: (age) => {
        if (!get().readingBaseline) set({ readingBaseline: { age, since: todayISO() } });
      },
      discoverCritters: (n) => {
        const s = get();
        const found = rollCritters(new Set(s.collectedCritterIds), n);
        if (found.length) set({ collectedCritterIds: [...s.collectedCritterIds, ...found.map((c) => c.id)] });
        return found;
      },
      buyDecor: (id) => {
        const s = get();
        const item = DECOR_MAP[id];
        if (!item || s.ownedDecorIds.includes(id)) return false;
        if (s.coins < item.cost) return false;
        set({ coins: s.coins - item.cost, ownedDecorIds: [...s.ownedDecorIds, id] });
        return true;
      },
      placeDecor: (cell, id) => set((s) => ({ roomItems: { ...s.roomItems, [cell]: id } })),
      removeDecor: (cell) => set((s) => {
        const next = { ...s.roomItems };
        delete next[cell];
        return { roomItems: next };
      }),

      addStory: (s) => {
        const story: Story = { ...s, id: "st-" + Math.random().toString(36).slice(2, 9), createdAt: new Date().toISOString() };
        set((st) => ({ stories: [story, ...st.stories].slice(0, 24) }));
        return story;
      },
      removeStory: (id) => set((st) => ({ stories: st.stories.filter((x) => x.id !== id) })),
      joinHouse: (id) => set({ houseId: id }),

      spendCoins: (n) => {
        if (get().coins < n) return false;
        set((s) => ({ coins: s.coins - n }));
        return true;
      },

      grantReward: ({ xp = 0, coins = 0, gems = 0 }) =>
        set((s) => {
          const totalXp = s.totalXp + xp;
          const today = todayISO();
          return {
            totalXp,
            coins: s.coins + coins,
            gems: s.gems + gems,
            dailyXp: { ...s.dailyXp, [today]: (s.dailyXp[today] ?? 0) + xp },
            unlockedWorldIds: worldsUnlockedAt(totalXp, s.unlockedWorldIds),
          };
        }),

      claimLoginReward: () => {
        const s = get();
        const today = todayISO();
        if (s.lastLoginRewardDate === today) return null;
        let day: number;
        if (!s.lastLoginRewardDate) {
          day = 1;
        } else {
          const gap = Math.round(
            (new Date(today + "T00:00:00Z").getTime() - new Date(s.lastLoginRewardDate + "T00:00:00Z").getTime()) / 86_400_000,
          );
          day = gap === 1 ? (s.loginRewardDay % 7) + 1 : 1;
        }
        const reward = DAILY_LOGIN_REWARDS[day - 1];
        set({
          coins: s.coins + reward.coins,
          gems: s.gems + reward.gems,
          lastLoginRewardDate: today,
          loginRewardDay: day,
        });
        return { day, coins: reward.coins, gems: reward.gems };
      },
      setDisplayName: (name) => set({ displayName: name.slice(0, 20) || "Explorer" }),
      setAgeBand: (age) => set({ ageBand: age }),

      answer: ({ question, correct, answerText, timeMs }) => {
        const s = get();
        const before = getLevelInfo(s.totalXp).level;

        // Streak first so the multiplier applies to this answer.
        const streakDays = updateStreak(s.lastActiveDate, s.streakDays);
        const full = computeReward({ question, correct, timeMs, streakDays });

        // Anti-farm: replaying a question you've already cleared earns only a
        // small "practice" XP trickle and no coins, so it can't be grinded.
        const isReplay = correct && s.clearedQuestionIds.includes(question.id);
        const reward: Reward = isReplay
          ? { ...full, xp: Math.max(1, Math.ceil(full.xp * REPLAY_XP_FACTOR)), coins: 0, bonuses: ["Practice"] }
          : full;

        const today = todayISO();
        const totalXp = s.totalXp + reward.xp;
        const coins = s.coins + reward.coins;

        // Update subject mastery + recompute weak strands.
        const m = s.mastery[question.subject];
        const updated = applyAttemptToMastery(m, {
          questionId: question.id,
          subject: question.subject,
          strandId: question.strandId,
          correct,
          timeMs,
          xpAwarded: reward.xp,
          coinsAwarded: reward.coins,
        });
        const weak = new Set(updated.weakStrands);
        if (!correct) weak.add(question.strandId);
        if (correct && updated.accuracy > WEAKNESS_THRESHOLD) weak.delete(question.strandId);
        const mastery = {
          ...s.mastery,
          [question.subject]: { ...updated, weakStrands: [...weak] },
        };

        const clearedQuestionIds =
          correct && !s.clearedQuestionIds.includes(question.id)
            ? [...s.clearedQuestionIds, question.id]
            : s.clearedQuestionIds;
        const recentQuestionIds = [question.id, ...s.recentQuestionIds.filter((id) => id !== question.id)].slice(0, RECENT_CAP);

        const nextState: Partial<GameStore> = {
          totalXp,
          coins,
          streakDays,
          lastActiveDate: today,
          mastery,
          clearedQuestionIds,
          recentQuestionIds,
          dailyXp: { ...s.dailyXp, [today]: (s.dailyXp[today] ?? 0) + reward.xp },
          unlockedWorldIds: worldsUnlockedAt(totalXp, s.unlockedWorldIds),
        };

        // Achievements evaluated against the *post-update* snapshot.
        const probe = { ...s, ...nextState } as PlayerState;
        const newIds = evaluateAchievements(probe, {
          gotSpeedBonus: reward.bonuses.some((b) => b.includes("Speedy")),
        });
        nextState.unlockedAchievementIds = [...s.unlockedAchievementIds, ...newIds];

        set(nextState);

        const after = getLevelInfo(totalXp).level;
        return {
          reward,
          correct,
          repeat: isReplay,
          leveledUp: after > before,
          newLevel: after,
          newlyUnlocked: newIds.map((id) => ACHIEVEMENT_MAP[id]).filter(Boolean),
        };
      },

      completeDailyChallenge: () => {
        const s = get();
        const today = todayISO();
        if (s.lastDailyChallengeDate === today) return false;
        set({
          coins: s.coins + COINS.DAILY_CHALLENGE,
          gems: s.gems + 1,
          lastDailyChallengeDate: today,
        });
        return true;
      },

      completeQuest: (questId, opts = {}) => {
        const s = get();
        const quest = QUEST_MAP[questId];
        if (!quest || s.completedQuestIds.includes(questId)) return null;

        const before = getLevelInfo(s.totalXp).level;
        const totalXp = s.totalXp + quest.rewardXp;
        const coins = s.coins + quest.rewardCoins;
        const today = todayISO();
        const gotBossPet = !!quest.isBoss && !s.ownedPetIds.includes(BOSS_PET_ID);

        const next: Partial<GameStore> = {
          totalXp,
          coins,
          completedQuestIds: [...s.completedQuestIds, questId],
          ownedPetIds: gotBossPet ? [...s.ownedPetIds, BOSS_PET_ID] : s.ownedPetIds,
          equippedPetId: s.equippedPetId ?? (gotBossPet ? BOSS_PET_ID : null),
          dailyXp: { ...s.dailyXp, [today]: (s.dailyXp[today] ?? 0) + quest.rewardXp },
          unlockedWorldIds: worldsUnlockedAt(totalXp, s.unlockedWorldIds),
        };

        const probe = { ...s, ...next } as PlayerState;
        const newIds = evaluateAchievements(probe, {
          defeatedBoss: quest.isBoss,
          perfectQuest: opts.perfect,
        });
        next.unlockedAchievementIds = [...s.unlockedAchievementIds, ...newIds];
        set(next);

        const after = getLevelInfo(totalXp).level;
        return {
          rewardXp: quest.rewardXp,
          rewardCoins: quest.rewardCoins,
          leveledUp: after > before,
          newLevel: after,
          newlyUnlocked: newIds.map((id) => ACHIEVEMENT_MAP[id]).filter(Boolean),
          isBoss: !!quest.isBoss,
          gotBossPet,
        };
      },

      defeatBoss: (bossId, reward) => {
        const s = get();
        // Full reward is granted only the first time a boss is beaten — no farming.
        if (s.defeatedBossIds.includes(bossId)) {
          return { firstTime: false, xp: 0, coins: 0, newlyUnlocked: [] };
        }
        const today = todayISO();
        const totalXp = s.totalXp + reward.xp;
        const next: Partial<GameStore> = {
          totalXp,
          coins: s.coins + reward.coins,
          defeatedBossIds: [...s.defeatedBossIds, bossId],
          dailyXp: { ...s.dailyXp, [today]: (s.dailyXp[today] ?? 0) + reward.xp },
          unlockedWorldIds: worldsUnlockedAt(totalXp, s.unlockedWorldIds),
        };
        const probe = { ...s, ...next } as PlayerState;
        const newIds = evaluateAchievements(probe, { defeatedBoss: true });
        next.unlockedAchievementIds = [...s.unlockedAchievementIds, ...newIds];
        set(next);
        return {
          firstTime: true,
          xp: reward.xp,
          coins: reward.coins,
          newlyUnlocked: newIds.map((id) => ACHIEVEMENT_MAP[id]).filter(Boolean),
        };
      },

      completeLesson: (lessonId, stars) => {
        const s = get();
        const lesson = LESSON_MAP[lessonId];
        const starsClamped = Math.max(0, Math.min(3, stars));
        if (!lesson) return { stars: starsClamped, coins: 0, firstClear: false, improved: false };
        const prev = (s.lessonStars ?? {})[lessonId] ?? 0;
        const best = Math.max(prev, starsClamped);
        const firstClear = prev === 0 && starsClamped > 0;
        const improved = starsClamped > prev;

        // Bonus on top of the per-question rewards earned during practice.
        // Full bonus (scaled by stars) on first clear; a little for improving; ~nothing on replay.
        let coins = 0;
        if (firstClear) coins = Math.round(lesson.coins * (starsClamped / 3));
        else if (improved) coins = Math.round(lesson.coins * ((starsClamped - prev) / 3) * 0.5);

        const gotCritter = !!(firstClear && lesson.critterId && !s.ownedPetIds.includes(lesson.critterId));
        const next: Partial<GameStore> = {
          lessonStars: { ...(s.lessonStars ?? {}), [lessonId]: best },
          coins: s.coins + coins,
          gems: s.gems + (firstClear && starsClamped === 3 ? 1 : 0),
          ownedPetIds: gotCritter ? [...s.ownedPetIds, lesson.critterId!] : s.ownedPetIds,
          equippedPetId: s.equippedPetId ?? (gotCritter ? lesson.critterId! : null),
        };
        set(next);
        return { stars: best, coins, firstClear, improved, critterId: gotCritter ? lesson.critterId : undefined };
      },

      adoptPet: (petId) => {
        const s = get();
        const pet = PET_MAP[petId];
        if (!pet || s.ownedPetIds.includes(petId)) return false;
        if (pet.cost === null || s.coins < pet.cost) return false;
        set({
          coins: s.coins - pet.cost,
          ownedPetIds: [...s.ownedPetIds, petId],
          equippedPetId: s.equippedPetId ?? petId,
          unlockedAchievementIds: s.unlockedAchievementIds.includes("pet-parent")
            ? s.unlockedAchievementIds
            : [...s.unlockedAchievementIds, "pet-parent"],
        });
        return true;
      },

      equipPet: (petId) => set({ equippedPetId: petId }),

      buyAvatarPart: (partId) => {
        const s = get();
        const part = AVATAR_MAP[partId];
        if (!part || s.ownedAvatarIds.includes(partId)) return false;
        if (s.coins < part.cost) return false;
        set({ coins: s.coins - part.cost, ownedAvatarIds: [...s.ownedAvatarIds, partId] });
        return true;
      },

      equipAvatarPart: (slot, partId) =>
        set((s) => ({ equippedAvatar: { ...s.equippedAvatar, [slot]: partId } })),

      setRpmAvatar: (url) => set({ rpmAvatarUrl: url }),

      resetProgress: () =>
        set({ ...DEFAULT_PLAYER, mastery: initialMastery(), _hasHydrated: true, lastDailyChallengeDate: null, lastLoginRewardDate: null, loginRewardDay: 0, houseId: null, stories: [] }),

      snapshot: () => {
        const s = get();
        return {
          id: s.id, displayName: s.displayName, ageBand: s.ageBand,
          totalXp: s.totalXp, coins: s.coins, gems: s.gems,
          streakDays: s.streakDays, lastActiveDate: s.lastActiveDate,
          equippedPetId: s.equippedPetId, ownedPetIds: s.ownedPetIds,
          equippedAvatar: s.equippedAvatar, ownedAvatarIds: s.ownedAvatarIds,
          rpmAvatarUrl: s.rpmAvatarUrl ?? null,
          unlockedAchievementIds: s.unlockedAchievementIds,
          completedQuestIds: s.completedQuestIds, unlockedWorldIds: s.unlockedWorldIds,
          lessonStars: s.lessonStars ?? {},
          defeatedBossIds: s.defeatedBossIds, clearedQuestionIds: s.clearedQuestionIds,
          recentQuestionIds: s.recentQuestionIds,
          mastery: s.mastery, dailyXp: s.dailyXp,
        };
      },

      hydratePlayer: (p) => set((s) => ({ ...s, ...p })),
    }),
    {
      name: "learnquest-player-v1",
      // Guard for SSR: localStorage doesn't exist on the server. Returning
      // undefined makes persistence a no-op there and hydrate on the client.
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : (undefined as unknown as Storage),
      ),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
      partialize: ({ _hasHydrated, ...rest }) => rest,
    },
  ),
);

/** Avoids hydration mismatch: returns true only after the store has rehydrated. */
export function useHydrated(): boolean {
  const hasHydrated = useGameStore((s) => s._hasHydrated);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted && hasHydrated;
}

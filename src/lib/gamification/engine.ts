import type {
  AgeBand,
  AttemptResult,
  LevelInfo,
  PlayerState,
  Question,
} from "@/types";
import { COINS, LEVEL_TITLES, XP } from "./constants";

/**
 * The LearnQuest gamification engine.
 *
 * Pure, deterministic functions — no React, no I/O — so they can be unit
 * tested, run on the server (Supabase edge functions), or run optimistically
 * on the client. The Zustand store (`useGameStore`) is the only stateful layer.
 */

// ─── Levels ──────────────────────────────────────────────────

/** XP required to advance FROM `level` to `level + 1`. Gentle quadratic. */
export function xpForLevel(level: number): number {
  return Math.round(100 + (level - 1) * 45);
}

/** Cumulative XP required to *reach* `level`. */
export function cumulativeXpForLevel(level: number): number {
  let total = 0;
  for (let l = 1; l < level; l++) total += xpForLevel(l);
  return total;
}

export function levelTitle(level: number): string {
  let title = LEVEL_TITLES[0].title;
  for (const band of LEVEL_TITLES) if (level >= band.from) title = band.title;
  return title;
}

/** Resolve a total XP figure into rich level info for the UI. */
export function getLevelInfo(totalXp: number): LevelInfo {
  let level = 1;
  while (totalXp >= cumulativeXpForLevel(level + 1)) level++;

  const base = cumulativeXpForLevel(level);
  const need = xpForLevel(level);
  const into = totalXp - base;

  return {
    level,
    title: levelTitle(level),
    xpIntoLevel: into,
    xpForNextLevel: need,
    totalXp,
    progress: Math.min(1, into / need),
  };
}

// ─── Rewards ─────────────────────────────────────────────────

interface RewardContext {
  question: Pick<Question, "difficulty" | "xp" | "coins">;
  correct: boolean;
  timeMs: number;
  streakDays: number;
}

export interface Reward {
  xp: number;
  coins: number;
  bonuses: string[];
}

/** Compute the XP + coins for a single attempt, with itemised bonuses. */
export function computeReward({
  question,
  correct,
  timeMs,
  streakDays,
}: RewardContext): Reward {
  const bonuses: string[] = [];

  if (!correct) {
    return { xp: XP.ATTEMPT_CONSOLATION, coins: 0, bonuses: ["Nice try +2 XP"] };
  }

  let xp =
    (question.xp || XP.CORRECT_BASE) +
    (question.difficulty - 1) * XP.DIFFICULTY_BONUS;
  let coins =
    (question.coins || COINS.CORRECT_BASE) +
    (question.difficulty - 1) * COINS.DIFFICULTY_BONUS;

  if (timeMs > 0 && timeMs < XP.SPEED_MS) {
    xp += XP.SPEED_BONUS;
    bonuses.push(`Speedy +${XP.SPEED_BONUS} XP`);
  }

  if (streakDays >= XP.STREAK_BONUS_DAYS) {
    const before = xp;
    xp = Math.round(xp * XP.STREAK_MULTIPLIER);
    bonuses.push(`🔥 Streak x${XP.STREAK_MULTIPLIER} (+${xp - before} XP)`);
  }

  return { xp, coins, bonuses };
}

// ─── Streaks ─────────────────────────────────────────────────

export function todayISO(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function daysBetween(aISO: string, bISO: string): number {
  const a = new Date(aISO + "T00:00:00Z").getTime();
  const b = new Date(bISO + "T00:00:00Z").getTime();
  return Math.round((b - a) / 86_400_000);
}

/**
 * Given the last active date and current streak, return the streak after an
 * activity today. Same day = unchanged, consecutive day = +1, gap = reset to 1.
 */
export function updateStreak(
  lastActiveDate: string | null,
  streakDays: number,
  today = todayISO(),
): number {
  if (!lastActiveDate) return 1;
  const gap = daysBetween(lastActiveDate, today);
  if (gap === 0) return Math.max(streakDays, 1);
  if (gap === 1) return streakDays + 1;
  return 1;
}

// ─── Adaptive difficulty ─────────────────────────────────────

/**
 * Pick the next question difficulty for an age band from a rolling accuracy.
 * High accuracy nudges difficulty up; struggling nudges it down — keeping the
 * learner in the "flow zone" (Csikszentmihalyi) where challenge ≈ skill.
 */
export function nextDifficulty(
  accuracy: number,
  ageBand: AgeBand,
): 1 | 2 | 3 | 4 | 5 {
  const ceiling: Record<AgeBand, number> = { "5-7": 3, "8-10": 4, "11-14": 5 };
  let target = 2;
  if (accuracy >= 0.85) target = 4;
  else if (accuracy >= 0.7) target = 3;
  else if (accuracy >= 0.5) target = 2;
  else target = 1;
  return Math.min(target, ceiling[ageBand]) as 1 | 2 | 3 | 4 | 5;
}

/**
 * From a pool of candidate questions, choose the one whose difficulty best
 * matches the adaptive target, preferring unseen and weak-strand questions.
 */
export function selectAdaptiveQuestion(
  pool: Question[],
  opts: { accuracy: number; ageBand: AgeBand; weakStrands: string[]; seenIds: Set<string> },
): Question | null {
  if (pool.length === 0) return null;
  const target = nextDifficulty(opts.accuracy, opts.ageBand);

  const scored = pool.map((q) => {
    let score = 10 - Math.abs(q.difficulty - target) * 3;
    if (opts.weakStrands.includes(q.strandId)) score += 4;
    if (opts.seenIds.has(q.id)) score -= 6;
    return { q, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].q;
}

// ─── Mastery accounting ──────────────────────────────────────

/** Fold a single attempt into a subject's rolling mastery snapshot. */
export function applyAttemptToMastery(
  current: PlayerState["mastery"][keyof PlayerState["mastery"]],
  attempt: AttemptResult,
): typeof current {
  const attempts = current.attempts + 1;
  // Rolling accuracy weighted toward recent attempts (EMA, alpha = 0.25).
  const alpha = 0.25;
  const accuracy =
    current.attempts === 0
      ? attempt.correct
        ? 1
        : 0
      : current.accuracy * (1 - alpha) + (attempt.correct ? 1 : 0) * alpha;

  return {
    ...current,
    xp: current.xp + attempt.xpAwarded,
    attempts,
    accuracy,
  };
}

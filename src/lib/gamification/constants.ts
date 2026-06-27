/** Tunable gamification constants. Keep all game-balance numbers here. */

export const XP = {
  /** Base XP awarded for a correct answer before multipliers. */
  CORRECT_BASE: 10,
  /** Bonus per difficulty point above 1. */
  DIFFICULTY_BONUS: 4,
  /** Awarded even on a wrong answer to reward effort (growth mindset). */
  ATTEMPT_CONSOLATION: 2,
  /** Fast-answer bonus (answered under SPEED_MS). */
  SPEED_BONUS: 5,
  SPEED_MS: 6000,
  /** Multiplier applied while a streak of >= STREAK_BONUS_DAYS is active. */
  STREAK_MULTIPLIER: 1.5,
  STREAK_BONUS_DAYS: 3,
} as const;

export const COINS = {
  CORRECT_BASE: 3,
  DIFFICULTY_BONUS: 1,
  DAILY_CHALLENGE: 50,
  QUEST_COMPLETE: 25,
  BOSS_DEFEAT: 150,
} as const;

/** Level titles by ascending level band. */
export const LEVEL_TITLES: { from: number; title: string }[] = [
  { from: 1, title: "Sprout" },
  { from: 4, title: "Explorer" },
  { from: 8, title: "Adventurer" },
  { from: 13, title: "Trailblazer" },
  { from: 19, title: "Champion" },
  { from: 26, title: "Hero" },
  { from: 34, title: "Legend" },
  { from: 45, title: "Grandmaster" },
];

/** Accuracy at or below this flags a strand as "weak" for the adaptive engine. */
export const WEAKNESS_THRESHOLD = 0.6;

/** 7-day daily-login reward track (resets to day 1 after a missed day). */
export const DAILY_LOGIN_REWARDS: { day: number; coins: number; gems: number }[] = [
  { day: 1, coins: 10, gems: 0 },
  { day: 2, coins: 20, gems: 0 },
  { day: 3, coins: 30, gems: 0 },
  { day: 4, coins: 40, gems: 0 },
  { day: 5, coins: 0, gems: 1 },
  { day: 6, coins: 60, gems: 0 },
  { day: 7, coins: 100, gems: 2 },
];

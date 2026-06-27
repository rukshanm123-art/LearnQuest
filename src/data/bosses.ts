import type { SubjectId } from "@/types";

/** Named bosses. HP = correct hits to defeat; hearts = wrong answers allowed. */
export interface Boss {
  id: string;
  name: string;
  emoji: string;
  subject: SubjectId;
  tagline: string;
  color: string;
  hp: number;
  hearts: number;
  rewardXp: number;
  rewardCoins: number;
}

export const BOSSES: Boss[] = [
  { id: "grammar-dragon", name: "Grammar Dragon", emoji: "🐉", subject: "english", tagline: "Tamer of tangled sentences.", color: "#f97316", hp: 5, hearts: 3, rewardXp: 60, rewardCoins: 80 },
  { id: "number-titan", name: "Number Titan", emoji: "🗿", subject: "maths", tagline: "Crusher of careless calculations.", color: "#3b82f6", hp: 5, hearts: 3, rewardXp: 60, rewardCoins: 80 },
  { id: "fraction-kraken", name: "Fraction Kraken", emoji: "🐙", subject: "maths", tagline: "Splitter of wholes into terror.", color: "#0ea5e9", hp: 6, hearts: 3, rewardXp: 80, rewardCoins: 100 },
  { id: "science-mech", name: "Science Mech", emoji: "🤖", subject: "science", tagline: "Powered by pure hypothesis.", color: "#10b981", hp: 6, hearts: 3, rewardXp: 80, rewardCoins: 100 },
  { id: "vocabulary-phantom", name: "Vocabulary Phantom", emoji: "👻", subject: "english", tagline: "Haunter of half-known words.", color: "#a855f7", hp: 7, hearts: 3, rewardXp: 100, rewardCoins: 120 },
  { id: "time-guardian", name: "Time Guardian", emoji: "⏳", subject: "social", tagline: "Keeper of Aotearoa's past.", color: "#8b5cf6", hp: 6, hearts: 3, rewardXp: 80, rewardCoins: 100 },
];

export const BOSS_MAP: Record<string, Boss> = Object.fromEntries(BOSSES.map((b) => [b.id, b]));

export const POWER_UPS = {
  hint: { cost: 20, label: "Hint", icon: "💡" },
  double: { cost: 30, label: "Double damage", icon: "⚡" },
} as const;

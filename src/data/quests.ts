import type { Quest } from "@/types";
import { COINS } from "@/lib/gamification/constants";

/** Curated quests — ordered question journeys with completion rewards. */
export const QUESTS: Quest[] = [
  {
    id: "q-en-starter", subject: "english", title: "Word Wizard: Chapter 1",
    description: "Rhymes, sentences and your first story spell.",
    ageBand: "5-7", level: 1, questionIds: ["en-1", "en-2"],
    rewardCoins: COINS.QUEST_COMPLETE, rewardXp: 30,
  },
  {
    id: "q-ma-starter", subject: "maths", title: "Numberforge: Warm-Up",
    description: "Heat up the forge with addition and shapes.",
    ageBand: "5-7", level: 1, questionIds: ["ma-1", "ma-2", "ma-4"],
    rewardCoins: COINS.QUEST_COMPLETE, rewardXp: 40,
  },
  {
    id: "q-sc-explorer", subject: "science", title: "Discovery Lab: Living World",
    description: "Meet the animals and forces of nature.",
    ageBand: "8-10", level: 3, questionIds: ["sc-1", "sc-2", "sc-3"],
    rewardCoins: COINS.QUEST_COMPLETE, rewardXp: 45,
  },
  {
    id: "q-so-atlas", subject: "social", title: "Aotearoa Atlas: Our Place",
    description: "Discover the people and places of New Zealand.",
    ageBand: "8-10", level: 2, questionIds: ["so-1", "so-2"],
    rewardCoins: COINS.QUEST_COMPLETE, rewardXp: 30,
  },
  {
    id: "q-te-code", subject: "tech", title: "Maker Bay: First Code",
    description: "Think like a computer with algorithms and loops.",
    ageBand: "8-10", level: 3, questionIds: ["te-1", "te-2", "te-3"],
    rewardCoins: COINS.QUEST_COMPLETE, rewardXp: 45,
  },
  {
    id: "q-boss-history", subject: "social", title: "⚔️ BOSS: The Time Guardian",
    description: "Defeat the Time Guardian by mastering Aotearoa's history.",
    ageBand: "11-14", level: 4, questionIds: ["so-3", "so-4", "sc-4", "ma-6"],
    isBoss: true, rewardCoins: COINS.BOSS_DEFEAT, rewardXp: 120,
  },
];

export const QUEST_MAP = Object.fromEntries(QUESTS.map((q) => [q.id, q]));

/** Pick a deterministic "daily challenge" question id from the date. */
export function dailyChallengeQuestionId(dateISO: string, ids: string[]): string {
  let hash = 0;
  for (const ch of dateISO) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return ids[hash % ids.length];
}

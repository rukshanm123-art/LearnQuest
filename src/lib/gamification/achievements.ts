import type { Achievement, PlayerState, SubjectId } from "@/types";
import { getLevelInfo } from "./engine";

/** The master achievement catalogue. */
export const ACHIEVEMENTS: Achievement[] = [
  // Getting started
  { id: "first-steps", name: "First Steps", description: "Answer your very first question.", icon: "👟", rarity: "common" },
  { id: "quick-thinker", name: "Quick Thinker", description: "Earn a speed bonus.", icon: "⚡", rarity: "common" },
  { id: "pet-parent", name: "Pet Parent", description: "Adopt your first pet.", icon: "🐾", rarity: "common" },
  { id: "stylist", name: "Stylist", description: "Own 5 avatar items.", icon: "🎨", rarity: "common" },

  // Streaks
  { id: "streak-3", name: "On Fire", description: "Reach a 3-day streak.", icon: "🔥", rarity: "rare" },
  { id: "streak-7", name: "Unstoppable", description: "Reach a 7-day streak.", icon: "🌟", rarity: "epic" },
  { id: "streak-14", name: "Two-Week Triumph", description: "Reach a 14-day streak.", icon: "📅", rarity: "epic" },
  { id: "streak-30", name: "Streak Legend", description: "Reach a 30-day streak.", icon: "👑", rarity: "legendary" },

  // Levels
  { id: "level-5", name: "Rising Star", description: "Reach level 5.", icon: "⭐", rarity: "rare" },
  { id: "level-10", name: "Trailblazer", description: "Reach level 10.", icon: "🏆", rarity: "epic" },
  { id: "level-20", name: "High Achiever", description: "Reach level 20.", icon: "💫", rarity: "epic" },
  { id: "level-30", name: "Grandmaster", description: "Reach level 30.", icon: "🌈", rarity: "legendary" },

  // Economy
  { id: "coins-100", name: "Coin Collector", description: "Save up 100 coins.", icon: "🪙", rarity: "rare" },
  { id: "coins-500", name: "Treasure Hunter", description: "Save up 500 coins.", icon: "💰", rarity: "epic" },
  { id: "fashionista", name: "Fashionista", description: "Own 12 avatar items.", icon: "💃", rarity: "epic" },

  // XP & volume
  { id: "xp-1000", name: "Bookworm", description: "Earn 1,000 total XP.", icon: "📗", rarity: "rare" },
  { id: "xp-5000", name: "Master Scholar", description: "Earn 5,000 total XP.", icon: "🎓", rarity: "legendary" },
  { id: "questions-50", name: "Curious Mind", description: "Answer 50 questions.", icon: "🧠", rarity: "rare" },
  { id: "questions-250", name: "Marathoner", description: "Answer 250 questions.", icon: "🏃", rarity: "epic" },

  // Breadth & quests
  { id: "all-rounder", name: "All-Rounder", description: "Earn XP in 4 different subjects.", icon: "🌐", rarity: "epic" },
  { id: "adventurer", name: "Adventurer", description: "Complete 3 quests.", icon: "🧭", rarity: "rare" },
  { id: "voyager", name: "Voyager", description: "Unlock 4 worlds.", icon: "🗺️", rarity: "epic" },
  { id: "boss-slayer", name: "Boss Slayer", description: "Defeat your first boss quest.", icon: "🐉", rarity: "legendary" },

  // Collecting
  { id: "pets-3", name: "Pet Pal", description: "Collect 3 pets.", icon: "🐶", rarity: "rare" },
  { id: "pets-6", name: "Zookeeper", description: "Collect 6 pets.", icon: "🦁", rarity: "epic" },

  // Subject mastery
  { id: "maths-whiz", name: "Maths Whiz", description: "90%+ accuracy in Maths.", icon: "➗", rarity: "epic" },
  { id: "word-wizard", name: "Word Wizard", description: "90%+ accuracy in English.", icon: "📖", rarity: "epic" },
  { id: "science-star", name: "Science Star", description: "90%+ accuracy in Science.", icon: "🔬", rarity: "epic" },

  // Secret
  { id: "perfectionist", name: "Perfectionist", description: "Finish a quest with 100% accuracy.", icon: "💯", rarity: "epic", secret: true },
];

export const ACHIEVEMENT_MAP = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));

/**
 * Re-evaluate which achievements the player qualifies for and return the IDs of
 * any newly unlocked ones. Pure — the store decides how to celebrate them.
 */
export function evaluateAchievements(
  player: PlayerState,
  signals: { gotSpeedBonus?: boolean; defeatedBoss?: boolean; perfectQuest?: boolean } = {},
): string[] {
  const owned = new Set(player.unlockedAchievementIds);
  const newly: string[] = [];
  const unlock = (id: string, cond: boolean) => {
    if (cond && !owned.has(id)) newly.push(id);
  };

  const level = getLevelInfo(player.totalXp).level;
  const masteryValues = Object.values(player.mastery);
  const subjectsTouched = masteryValues.filter((m) => m.xp > 0).length;
  const totalAttempts = masteryValues.reduce((n, m) => n + m.attempts, 0);
  const masteryHigh = (s: SubjectId) =>
    !!player.mastery[s] && player.mastery[s].accuracy >= 0.9 && player.mastery[s].attempts >= 8;

  unlock("first-steps", totalAttempts >= 1);
  unlock("quick-thinker", !!signals.gotSpeedBonus);
  unlock("pet-parent", player.ownedPetIds.length > 0);
  unlock("stylist", player.ownedAvatarIds.length >= 5);
  unlock("fashionista", player.ownedAvatarIds.length >= 12);

  unlock("streak-3", player.streakDays >= 3);
  unlock("streak-7", player.streakDays >= 7);
  unlock("streak-14", player.streakDays >= 14);
  unlock("streak-30", player.streakDays >= 30);

  unlock("level-5", level >= 5);
  unlock("level-10", level >= 10);
  unlock("level-20", level >= 20);
  unlock("level-30", level >= 30);

  unlock("coins-100", player.coins >= 100);
  unlock("coins-500", player.coins >= 500);

  unlock("xp-1000", player.totalXp >= 1000);
  unlock("xp-5000", player.totalXp >= 5000);
  unlock("questions-50", totalAttempts >= 50);
  unlock("questions-250", totalAttempts >= 250);

  unlock("all-rounder", subjectsTouched >= 4);
  unlock("adventurer", player.completedQuestIds.length >= 3);
  unlock("voyager", player.unlockedWorldIds.length >= 4);
  unlock("boss-slayer", !!signals.defeatedBoss);

  unlock("pets-3", player.ownedPetIds.length >= 3);
  unlock("pets-6", player.ownedPetIds.length >= 6);

  unlock("maths-whiz", masteryHigh("maths"));
  unlock("word-wizard", masteryHigh("english"));
  unlock("science-star", masteryHigh("science"));

  unlock("perfectionist", !!signals.perfectQuest);

  return newly;
}

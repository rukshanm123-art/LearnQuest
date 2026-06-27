/**
 * LearnQuest core domain types.
 * These mirror the database schema in `supabase/schema.sql` and are the
 * single source of truth for the client-side game state.
 */

// ─── Curriculum ──────────────────────────────────────────────

export type SubjectId =
  | "english"
  | "maths"
  | "science"
  | "social"
  | "tech"
  | "reo";

export type AgeBand = "5-7" | "8-10" | "11-14";

/** New Zealand Curriculum levels 1–5 cover ages ~5–14. */
export type NzCurriculumLevel = 1 | 2 | 3 | 4 | 5;

export interface Subject {
  id: SubjectId;
  name: string;
  /** Te Reo Māori name where available. */
  reoName?: string;
  color: string;
  icon: string;
  blurb: string;
  /** The fantasy "world" this subject is themed as. */
  world: string;
  comingSoon?: boolean;
}

export interface CurriculumStrand {
  id: string;
  subject: SubjectId;
  name: string;
  /** Achievement objective summary, paraphrased from the NZC. */
  description: string;
  levels: NzCurriculumLevel[];
}

/** A specific NZC achievement objective, tagged to a school year. */
export interface CurriculumObjective {
  id: string; // e.g. "MA-N-Y3-01"
  subject: SubjectId;
  strandId: string;
  year: number; // 1–8
  level: NzCurriculumLevel;
  code: string; // human-friendly code
  description: string;
  prerequisiteIds?: string[];
}

// ─── Learning content ────────────────────────────────────────

export type ActivityType =
  | "multiple-choice"
  | "drag-and-drop"
  | "sentence-building"
  | "matching"
  | "timed-challenge"
  | "reading-comprehension"
  | "math-puzzle"
  | "science-sim";

export interface Question {
  id: string;
  subject: SubjectId;
  strandId: string;
  ageBand: AgeBand;
  level: NzCurriculumLevel;
  type: ActivityType;
  /** 1 (easiest) → 5 (hardest); used by the adaptive engine. */
  difficulty: 1 | 2 | 3 | 4 | 5;
  prompt: string;
  /** For MCQ / matching. */
  options?: string[];
  /** Index (MCQ) or canonical answer string. */
  answer: number | string;
  /** Shown by the AI tutor after an attempt. */
  explanation: string;
  xp: number;
  coins: number;
  /** Optional supporting passage for reading comprehension. */
  passage?: string;
  /** Optional ordered tokens for sentence building / drag-drop. */
  tokens?: string[];
  /** NZC school year (1–8) this item targets. */
  year?: number;
  /** NZC achievement objectives this item assesses (see CurriculumObjective). */
  objectiveIds?: string[];
}

export interface Quest {
  id: string;
  subject: SubjectId;
  title: string;
  description: string;
  ageBand: AgeBand;
  level: NzCurriculumLevel;
  questionIds: string[];
  /** Boss quests gate world progression and grant bonus rewards. */
  isBoss?: boolean;
  rewardCoins: number;
  rewardXp: number;
}

// ─── Gamification ────────────────────────────────────────────

export interface LevelInfo {
  level: number;
  title: string;
  xpIntoLevel: number;
  xpForNextLevel: number;
  totalXp: number;
  progress: number; // 0..1
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  /** Rarity drives the badge frame + celebration intensity. */
  rarity: "common" | "rare" | "epic" | "legendary";
  /** Hidden achievements aren't shown until unlocked. */
  secret?: boolean;
}

export interface Pet {
  id: string;
  name: string;
  species: string;
  emoji: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  /** Coins needed to adopt, or null if reward-gated. */
  cost: number | null;
  /** Passive perk applied while equipped. */
  perk: string;
}

export interface AvatarPart {
  id: string;
  slot: "background" | "base" | "face" | "hat" | "outfit" | "accessory";
  name: string;
  /** Legacy emoji (no longer rendered; kept optional for back-compat). */
  emoji?: string;
  /** Tailwind gradient classes (legacy background field). */
  bg?: string;
  /** Which SVG shape the layered 2D avatar renders for this part. */
  kind?: string;
  /** Primary / secondary colours for the SVG layer. */
  color?: string;
  color2?: string;
  /** For `base` (character): hairstyle kind + colour baked into the character. */
  hair?: string;
  hairColor?: string;
  /** Background slot: gradient stops [top, bottom] for the SVG scene. */
  grad?: [string, string];
  cost: number;
  rarity?: "common" | "rare" | "epic" | "legendary";
}

export interface World {
  id: string;
  subject: SubjectId;
  name: string;
  description: string;
  /** XP required to unlock. */
  unlockXp: number;
  emoji: string;
}

// ─── Player ──────────────────────────────────────────────────

export interface SubjectMastery {
  subject: SubjectId;
  xp: number;
  /** Rolling accuracy 0..1 across recent attempts. */
  accuracy: number;
  attempts: number;
  /** Strands the adaptive engine flags as weak. */
  weakStrands: string[];
}

/** An AI-generated (or fallback) personalized story in the reading library. */
export interface Story {
  id: string;
  title: string;
  coverEmoji: string;
  pages: string[];
  vocab: { word: string; meaning: string }[];
  createdAt: string;
  ai: boolean;
}

export interface PlayerState {
  id: string;
  displayName: string;
  ageBand: AgeBand;
  totalXp: number;
  coins: number;
  gems: number;
  streakDays: number;
  lastActiveDate: string | null; // ISO date (yyyy-mm-dd)
  equippedPetId: string | null;
  ownedPetIds: string[];
  equippedAvatar: Record<AvatarPart["slot"], string | null>;
  ownedAvatarIds: string[];
  /** Ready Player Me avatar GLB URL, if the player has created a realistic 3D avatar. */
  rpmAvatarUrl?: string | null;
  unlockedAchievementIds: string[];
  completedQuestIds: string[];
  /** Mastery stars (0–3) per Learning Journey lesson id. */
  lessonStars?: Record<string, number>;
  /** Bosses defeated at least once (full reward only granted the first time). */
  defeatedBossIds: string[];
  /** Questions answered correctly at least once (replays earn reduced rewards). */
  clearedQuestionIds: string[];
  /** Rolling list of recently served question ids, to avoid immediate repeats. */
  recentQuestionIds: string[];
  unlockedWorldIds: string[];
  mastery: Record<SubjectId, SubjectMastery>;
  /** Per-day XP for streak + weekly report charts. */
  dailyXp: Record<string, number>;
}

export interface AttemptResult {
  questionId: string;
  subject: SubjectId;
  strandId: string;
  correct: boolean;
  /** Milliseconds taken to answer. */
  timeMs: number;
  xpAwarded: number;
  coinsAwarded: number;
}

// ─── AI tutor ────────────────────────────────────────────────

export interface TutorRequest {
  questionPrompt: string;
  studentAnswer: string;
  correctAnswer: string;
  ageBand: AgeBand;
  subject: SubjectId;
  wasCorrect: boolean;
}

export interface TutorResponse {
  message: string;
  /** True when generated by OpenAI, false when the rule-based fallback ran. */
  ai: boolean;
  hint?: string;
}

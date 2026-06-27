import type { SubjectId } from "@/types";

/**
 * The sequential "Learning Journey" — our answer to Reading Eggs' 120-lesson map,
 * but with explicit TEACH-then-PRACTISE steps, mastery stars, voice narration and
 * a boss battle as each world's capstone.
 *
 * Each lesson teaches a skill (narratable) then pulls practice questions from the
 * static bank by subject + difficulty, so content scales without hand-wiring ids.
 */

export interface Lesson {
  id: string;
  worldId: string;
  index: number; // 1-based position within its world
  title: string;
  skill: string;
  teach: { emoji: string; heading: string; lines: string[]; example?: string };
  subject: SubjectId;
  difficulty: number; // 1–5, picks practice questions of roughly this level
  count: number; // number of practice questions
  coins: number; // reward on first 3-star clear
  critterId?: string; // pet/critter awarded on first clear
}

export interface JourneyWorld {
  id: string;
  name: string;
  blurb: string;
  emoji: string;
  subject: SubjectId;
  bg: [string, string]; // scene gradient (top, bottom)
  bossId: string; // capstone boss (from src/data/bosses.ts)
}

export const JOURNEY_WORLDS: JourneyWorld[] = [
  {
    id: "word-wood",
    name: "Word Wood",
    blurb: "A magical forest where words come alive. Learn to read, one tree at a time!",
    emoji: "🌳",
    subject: "english",
    bg: ["#bbf7d0", "#15803d"],
    bossId: "grammar-dragon",
  },
  {
    id: "number-mountain",
    name: "Number Mountain",
    blurb: "Climb the peak of numbers. Each step makes you a stronger mathematician!",
    emoji: "⛰️",
    subject: "maths",
    bg: ["#bfdbfe", "#1d4ed8"],
    bossId: "number-titan",
  },
];

const L = (l: Omit<Lesson, "count" | "coins"> & { count?: number; coins?: number }): Lesson => ({
  count: 4,
  coins: 20,
  ...l,
});

export const LESSONS: Lesson[] = [
  // ── Word Wood (English) ─────────────────────────────────
  L({
    id: "ww-1", worldId: "word-wood", index: 1, title: "Rhyme Time", skill: "Rhyming words",
    subject: "english", difficulty: 1, critterId: "kiwi",
    teach: {
      emoji: "🎵",
      heading: "Words that rhyme",
      lines: [
        "Rhyming words end with the same sound.",
        "Listen: cat, hat, mat — they all end with the “at” sound!",
        "When you read, rhyming helps you guess new words.",
      ],
      example: "cat · hat · mat · bat",
    },
  }),
  L({
    id: "ww-2", worldId: "word-wood", index: 2, title: "First Sounds", skill: "Beginning sounds",
    subject: "english", difficulty: 1,
    teach: {
      emoji: "🔤",
      heading: "The first sound in a word",
      lines: [
        "Every word starts with a sound.",
        "“Sun” starts with sss. “Ball” starts with buh.",
        "Hearing the first sound helps you read and spell.",
      ],
      example: "🌞 sun = s · 🏀 ball = b · 🐶 dog = d",
    },
  }),
  L({
    id: "ww-3", worldId: "word-wood", index: 3, title: "Sight Words", skill: "Common words",
    subject: "english", difficulty: 2, coins: 25,
    teach: {
      emoji: "👀",
      heading: "Words we just know",
      lines: [
        "Some words pop up everywhere: the, and, was, you.",
        "We learn these by sight, so reading gets faster.",
        "The more you know, the smoother you read!",
      ],
      example: "the · and · you · was · said",
    },
  }),
  L({
    id: "ww-4", worldId: "word-wood", index: 4, title: "Build a Sentence", skill: "Word order",
    subject: "english", difficulty: 2, coins: 25, critterId: "fantail",
    teach: {
      emoji: "🧩",
      heading: "Putting words in order",
      lines: [
        "A sentence tells a whole idea.",
        "Words go in an order that makes sense.",
        "Start with a capital letter and end with a full stop.",
      ],
      example: "The dog ran fast.",
    },
  }),
  L({
    id: "ww-5", worldId: "word-wood", index: 5, title: "Reading for Meaning", skill: "Comprehension",
    subject: "english", difficulty: 3, coins: 30,
    teach: {
      emoji: "💡",
      heading: "Understanding what you read",
      lines: [
        "Good readers don’t just say the words — they understand them.",
        "Ask yourself: who is it about? What happened?",
        "Read carefully and the answers are hiding in the text.",
      ],
    },
  }),
  L({
    id: "ww-6", worldId: "word-wood", index: 6, title: "Word Power", skill: "Synonyms & vocabulary",
    subject: "english", difficulty: 3, coins: 30, critterId: "owl",
    teach: {
      emoji: "✨",
      heading: "Words with similar meanings",
      lines: [
        "Some words mean almost the same thing.",
        "“Big” and “enormous” are both about size.",
        "Knowing more words makes you a powerful reader and writer.",
      ],
      example: "big = large = huge = enormous",
    },
  }),

  // ── Number Mountain (Maths) ─────────────────────────────
  L({
    id: "nm-1", worldId: "number-mountain", index: 1, title: "Counting On", skill: "Addition",
    subject: "maths", difficulty: 1, critterId: "cat",
    teach: {
      emoji: "➕",
      heading: "Adding numbers",
      lines: [
        "Adding means putting groups together.",
        "Start with the bigger number, then count on.",
        "3 + 4: start at 3… 4, 5, 6, 7. The answer is 7!",
      ],
      example: "3 + 4 = 7",
    },
  }),
  L({
    id: "nm-2", worldId: "number-mountain", index: 2, title: "Take Away", skill: "Subtraction",
    subject: "maths", difficulty: 1,
    teach: {
      emoji: "➖",
      heading: "Taking away",
      lines: [
        "Subtraction means taking some away.",
        "If you have 9 and take 5, count back: 8, 7, 6, 5, 4.",
        "9 − 5 = 4.",
      ],
      example: "9 − 5 = 4",
    },
  }),
  L({
    id: "nm-3", worldId: "number-mountain", index: 3, title: "Super Shapes", skill: "Geometry",
    subject: "maths", difficulty: 2, coins: 25, critterId: "turtle",
    teach: {
      emoji: "🔷",
      heading: "Shapes and sides",
      lines: [
        "Shapes are all around us.",
        "Count the straight sides to name a shape.",
        "A hexagon has 6 sides — “hex” means six!",
      ],
      example: "triangle = 3 · square = 4 · hexagon = 6",
    },
  }),
  L({
    id: "nm-4", worldId: "number-mountain", index: 4, title: "Times Tables", skill: "Multiplication",
    subject: "maths", difficulty: 3, coins: 30,
    teach: {
      emoji: "✖️",
      heading: "Multiplying",
      lines: [
        "Multiplying is fast adding of equal groups.",
        "7 × 8 means eight groups of seven.",
        "Tip: 7 × 8 = 56 — say “five, six, seven, eight”!",
      ],
      example: "7 × 8 = 56",
    },
  }),
  L({
    id: "nm-5", worldId: "number-mountain", index: 5, title: "Fraction Action", skill: "Fractions & %",
    subject: "maths", difficulty: 4, coins: 35, critterId: "kea",
    teach: {
      emoji: "🍕",
      heading: "Parts of a whole",
      lines: [
        "A fraction is a part of something whole.",
        "Half a pizza is one of two equal pieces.",
        "Percent means “out of 100” — 15% of 200 is 30.",
      ],
      example: "½ · ¼ · 15% of 200 = 30",
    },
  }),
  L({
    id: "nm-6", worldId: "number-mountain", index: 6, title: "Data Detective", skill: "Statistics",
    subject: "maths", difficulty: 4, coins: 35,
    teach: {
      emoji: "📊",
      heading: "Making sense of numbers",
      lines: [
        "Data is information we collect.",
        "The median is the middle number when they’re in order.",
        "2, 4, 6, 8, 10 → the middle one is 6.",
      ],
      example: "median of 2,4,6,8,10 = 6",
    },
  }),
];

export const LESSON_MAP: Record<string, Lesson> = Object.fromEntries(LESSONS.map((l) => [l.id, l]));

export const lessonsOf = (worldId: string): Lesson[] =>
  LESSONS.filter((l) => l.worldId === worldId).sort((a, b) => a.index - b.index);

/** The next not-yet-mastered lesson in a world (or null if the world is done). */
export function nextLessonIn(worldId: string, stars: Record<string, number>): Lesson | null {
  return lessonsOf(worldId).find((l) => (stars[l.id] ?? 0) === 0) ?? null;
}

/** A lesson is unlocked if it's first in its world or the previous one has ≥1 star. */
export function isLessonUnlocked(lesson: Lesson, stars: Record<string, number>): boolean {
  if (lesson.index === 1) return true;
  const prev = lessonsOf(lesson.worldId).find((l) => l.index === lesson.index - 1);
  return !prev || (stars[prev.id] ?? 0) > 0;
}

/** Boss is unlocked once every lesson in the world has at least 1 star. */
export function isBossUnlocked(worldId: string, stars: Record<string, number>): boolean {
  return lessonsOf(worldId).every((l) => (stars[l.id] ?? 0) > 0);
}

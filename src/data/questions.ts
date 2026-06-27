import type { Question } from "@/types";
import MATHS_BANK from "./maths-bank.json";
import ENGLISH_BANK from "./english-bank.json";
import SCIENCE_BANK from "./science-bank.json";

/**
 * Seed question bank. In production this lives in Postgres (see
 * `supabase/schema.sql` → `questions`) and is authored via the teacher tools;
 * this file gives the demo a rich, curriculum-aligned starter set — the hand-
 * authored CURATED set plus the generated banks (Maths/English/Science).
 *
 * Answer convention: MCQ/matching → 0-based index into `options`;
 * math-puzzle / sentence-building → canonical answer string.
 */
const CURATED: Question[] = [
  // ── English ─────────────────────────────────────────────
  {
    id: "en-1", subject: "english", strandId: "en-reading", ageBand: "5-7", level: 1,
    type: "multiple-choice", difficulty: 1,
    prompt: "Which word rhymes with “cat”?",
    options: ["dog", "hat", "sun", "cup"], answer: 1,
    explanation: "“Hat” ends with the same -at sound as “cat”, so they rhyme.",
    xp: 10, coins: 3,
  },
  {
    id: "en-2", subject: "english", strandId: "en-writing", ageBand: "5-7", level: 1,
    type: "sentence-building", difficulty: 2,
    prompt: "Put the words in order to make a sentence.",
    tokens: ["dog", "The", "ran", "fast"], answer: "The dog ran fast",
    explanation: "A sentence starts with a capital letter: “The dog ran fast.”",
    xp: 14, coins: 4,
  },
  {
    id: "en-3", subject: "english", strandId: "en-reading", ageBand: "8-10", level: 3,
    type: "reading-comprehension", difficulty: 3,
    passage:
      "The kiwi is a small, flightless bird found only in New Zealand. It sleeps during the day and comes out at night to hunt for worms and insects, using its excellent sense of smell — its nostrils are right at the tip of its long beak.",
    prompt: "According to the passage, when is the kiwi most active?",
    options: ["In the morning", "At midday", "At night", "In the afternoon"], answer: 2,
    explanation: "The passage says the kiwi “comes out at night to hunt”.",
    xp: 16, coins: 4,
  },
  {
    id: "en-4", subject: "english", strandId: "en-reading", ageBand: "11-14", level: 4,
    type: "multiple-choice", difficulty: 3,
    prompt: "Which word is a synonym for “enormous”?",
    options: ["tiny", "gigantic", "quiet", "speedy"], answer: 1,
    explanation: "“Gigantic” means very large — the same as “enormous”.",
    xp: 16, coins: 4,
  },
  {
    id: "en-5", subject: "english", strandId: "en-writing", ageBand: "11-14", level: 4,
    type: "sentence-building", difficulty: 4,
    prompt: "Arrange the words into a correct sentence.",
    tokens: ["read", "She", "the", "quietly", "ancient", "book"],
    answer: "She quietly read the ancient book",
    explanation: "Adverbs like “quietly” usually sit before the verb: “She quietly read the ancient book.”",
    xp: 20, coins: 5,
  },

  // ── Mathematics ─────────────────────────────────────────
  {
    id: "ma-1", subject: "maths", strandId: "ma-number", ageBand: "5-7", level: 1,
    type: "multiple-choice", difficulty: 1,
    prompt: "What is 3 + 4?",
    options: ["6", "7", "8", "5"], answer: 1,
    explanation: "Count on from 3: 4, 5, 6, 7. So 3 + 4 = 7.",
    xp: 10, coins: 3,
  },
  {
    id: "ma-2", subject: "maths", strandId: "ma-number", ageBand: "5-7", level: 1,
    type: "math-puzzle", difficulty: 2,
    prompt: "Fill the gap:  5 + ? = 9",
    answer: "4",
    explanation: "9 − 5 = 4, so the missing number is 4.",
    xp: 12, coins: 3,
  },
  {
    id: "ma-3", subject: "maths", strandId: "ma-number", ageBand: "8-10", level: 3,
    type: "multiple-choice", difficulty: 3,
    prompt: "What is 7 × 8?",
    options: ["54", "56", "58", "49"], answer: 1,
    explanation: "7 × 8 = 56. Tip: 7 × 8 is the “5, 6, 7, 8” fact → 56 = 7 × 8.",
    xp: 16, coins: 4,
  },
  {
    id: "ma-4", subject: "maths", strandId: "ma-geometry", ageBand: "8-10", level: 2,
    type: "multiple-choice", difficulty: 2,
    prompt: "How many sides does a hexagon have?",
    options: ["5", "6", "7", "8"], answer: 1,
    explanation: "“Hex” means six — a hexagon has 6 sides.",
    xp: 14, coins: 4,
  },
  {
    id: "ma-5", subject: "maths", strandId: "ma-number", ageBand: "11-14", level: 4,
    type: "math-puzzle", difficulty: 4,
    prompt: "What is 15% of 200?",
    answer: "30",
    explanation: "10% of 200 is 20, and 5% is 10, so 15% = 20 + 10 = 30.",
    xp: 20, coins: 5,
  },
  {
    id: "ma-6", subject: "maths", strandId: "ma-stats", ageBand: "11-14", level: 4,
    type: "multiple-choice", difficulty: 4,
    prompt: "What is the median of  2, 4, 6, 8, 10?",
    options: ["5", "6", "7", "8"], answer: 1,
    explanation: "The median is the middle value of the ordered list — here that's 6.",
    xp: 20, coins: 5,
  },

  // ── Science ─────────────────────────────────────────────
  {
    id: "sc-1", subject: "science", strandId: "sc-living", ageBand: "5-7", level: 1,
    type: "multiple-choice", difficulty: 1,
    prompt: "Which of these animals is a mammal?",
    options: ["Shark", "Whale", "Frog", "Lizard"], answer: 1,
    explanation: "Whales feed their babies milk and breathe air — that makes them mammals.",
    xp: 10, coins: 3,
  },
  {
    id: "sc-2", subject: "science", strandId: "sc-physical", ageBand: "8-10", level: 3,
    type: "multiple-choice", difficulty: 2,
    prompt: "What force pulls objects down towards the Earth?",
    options: ["Magnetism", "Gravity", "Friction", "Electricity"], answer: 1,
    explanation: "Gravity is the force that pulls everything towards the Earth.",
    xp: 14, coins: 4,
  },
  {
    id: "sc-3", subject: "science", strandId: "sc-material", ageBand: "8-10", level: 3,
    type: "multiple-choice", difficulty: 3,
    prompt: "When water freezes into ice, it changes its…",
    options: ["state", "colour", "mass", "taste"], answer: 0,
    explanation: "Freezing is a change of state — liquid water becomes solid ice.",
    xp: 16, coins: 4,
  },
  {
    id: "sc-4", subject: "science", strandId: "sc-living", ageBand: "11-14", level: 4,
    type: "multiple-choice", difficulty: 4,
    prompt: "Which gas do plants take in for photosynthesis?",
    options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], answer: 2,
    explanation: "Plants absorb carbon dioxide and release oxygen during photosynthesis.",
    xp: 18, coins: 5,
  },
  {
    id: "sc-5", subject: "science", strandId: "sc-earth", ageBand: "11-14", level: 4,
    type: "science-sim", difficulty: 3,
    prompt: "🔭 In our Solar System, which planet is closest to the Sun?",
    options: ["Venus", "Mercury", "Earth", "Mars"], answer: 1,
    explanation: "Mercury is the innermost planet, closest to the Sun.",
    xp: 16, coins: 4,
  },

  // ── Social Sciences ─────────────────────────────────────
  {
    id: "so-1", subject: "social", strandId: "so-identity", ageBand: "8-10", level: 2,
    type: "multiple-choice", difficulty: 2,
    prompt: "What is the Māori name for New Zealand?",
    options: ["Aotearoa", "Hawaiki", "Rarotonga", "Taranaki"], answer: 0,
    explanation: "Aotearoa — often translated as “land of the long white cloud”.",
    xp: 14, coins: 4,
  },
  {
    id: "so-2", subject: "social", strandId: "so-place", ageBand: "8-10", level: 2,
    type: "multiple-choice", difficulty: 2,
    prompt: "What is the capital city of New Zealand?",
    options: ["Auckland", "Wellington", "Christchurch", "Hamilton"], answer: 1,
    explanation: "Wellington has been the capital of New Zealand since 1865.",
    xp: 14, coins: 4,
  },
  {
    id: "so-3", subject: "social", strandId: "so-change", ageBand: "11-14", level: 4,
    type: "multiple-choice", difficulty: 4,
    prompt: "In which year was te Tiriti o Waitangi (the Treaty of Waitangi) first signed?",
    options: ["1769", "1840", "1893", "1907"], answer: 1,
    explanation: "Te Tiriti o Waitangi was first signed on 6 February 1840.",
    xp: 18, coins: 5,
  },
  {
    id: "so-4", subject: "social", strandId: "so-change", ageBand: "11-14", level: 5,
    type: "multiple-choice", difficulty: 4,
    prompt: "New Zealand was the first country where women won the right to vote. In which year?",
    options: ["1840", "1865", "1893", "1919"], answer: 2,
    explanation: "In 1893 New Zealand became the first self-governing country to grant women the vote.",
    xp: 20, coins: 5,
  },

  // ── Technology ──────────────────────────────────────────
  {
    id: "te-1", subject: "tech", strandId: "te-ct", ageBand: "8-10", level: 2,
    type: "multiple-choice", difficulty: 2,
    prompt: "What do we call a step-by-step set of instructions a computer follows?",
    options: ["A picture", "An algorithm", "A melody", "A planet"], answer: 1,
    explanation: "An algorithm is an ordered set of steps to solve a problem.",
    xp: 14, coins: 4,
  },
  {
    id: "te-2", subject: "tech", strandId: "te-ct", ageBand: "8-10", level: 3,
    type: "multiple-choice", difficulty: 3,
    prompt: "A robot faces North and turns RIGHT once. Which way does it now face?",
    options: ["North", "East", "South", "West"], answer: 1,
    explanation: "Turning right (clockwise) from North points you East.",
    xp: 16, coins: 4,
  },
  {
    id: "te-3", subject: "tech", strandId: "te-ct", ageBand: "11-14", level: 4,
    type: "multiple-choice", difficulty: 3,
    prompt: "In coding, what does a “loop” do?",
    options: ["Stores data", "Repeats actions", "Deletes files", "Draws shapes"], answer: 1,
    explanation: "A loop repeats a block of instructions until a condition is met.",
    xp: 16, coins: 4,
  },

  // ── Te Reo Māori (future-ready content) ─────────────────
  {
    id: "re-1", subject: "reo", strandId: "re-korero", ageBand: "5-7", level: 1,
    type: "multiple-choice", difficulty: 1,
    prompt: "What does “Kia ora” mean?",
    options: ["Goodbye", "Hello / be well", "Sorry", "Please"], answer: 1,
    explanation: "“Kia ora” is a friendly greeting that also means “be well”.",
    xp: 10, coins: 3,
  },
  {
    id: "re-2", subject: "reo", strandId: "re-panui", ageBand: "8-10", level: 2,
    type: "multiple-choice", difficulty: 2,
    prompt: "What does the word “whānau” mean?",
    options: ["Family", "Food", "River", "Mountain"], answer: 0,
    explanation: "“Whānau” means family — including extended family.",
    xp: 14, coins: 4,
  },
];

/** The full gameplay bank: curated items + generated subject banks. */
export const QUESTIONS: Question[] = [
  ...CURATED,
  ...(MATHS_BANK as unknown as Question[]),
  ...(ENGLISH_BANK as unknown as Question[]),
  ...(SCIENCE_BANK as unknown as Question[]),
];

export const QUESTION_MAP = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));

import type { CurriculumStrand, Subject, World } from "@/types";

/**
 * New Zealand Curriculum mapping.
 *
 * Subjects map to the NZC learning areas; strands map to the curriculum's
 * strands / achievement-objective groupings. Curriculum levels 1–5 span
 * roughly ages 5–14, which is how `level` lines up with our age bands:
 *   Level 1–2 ≈ ages 5–7, Level 2–3 ≈ ages 8–10, Level 4–5 ≈ ages 11–14.
 */

export const SUBJECTS: Subject[] = [
  {
    id: "english",
    name: "English",
    reoName: "Reo Pākehā",
    color: "#f97316",
    icon: "📖",
    world: "Storyhaven",
    blurb: "Read, write and tell epic tales.",
  },
  {
    id: "maths",
    name: "Mathematics",
    reoName: "Pāngarau",
    color: "#3b82f6",
    icon: "🔢",
    world: "Numberforge",
    blurb: "Forge numbers, crack puzzles, beat the clock.",
  },
  {
    id: "science",
    name: "Science",
    reoName: "Pūtaiao",
    color: "#10b981",
    icon: "🔬",
    world: "Discovery Lab",
    blurb: "Run experiments and uncover how the world works.",
  },
  {
    id: "social",
    name: "Social Sciences",
    reoName: "Tikanga ā-Iwi",
    color: "#a855f7",
    icon: "🗺️",
    world: "Aotearoa Atlas",
    blurb: "Explore people, places and our shared history.",
  },
  {
    id: "tech",
    name: "Technology",
    reoName: "Hangarau",
    color: "#ec4899",
    icon: "🛠️",
    world: "Maker Bay",
    blurb: "Design, build and code clever creations.",
  },
  {
    id: "reo",
    name: "Te Reo Māori",
    reoName: "Te Reo Māori",
    color: "#ef4444",
    icon: "🌿",
    world: "Te Ao Māori",
    blurb: "Kōrero, waiata and the living language of Aotearoa.",
    comingSoon: true,
  },
];

export const SUBJECT_MAP: Record<string, Subject> = Object.fromEntries(
  SUBJECTS.map((s) => [s.id, s]),
);

export const STRANDS: CurriculumStrand[] = [
  // English
  { id: "en-reading", subject: "english", name: "Reading & Comprehension", description: "Making meaning from texts.", levels: [1, 2, 3, 4, 5] },
  { id: "en-writing", subject: "english", name: "Writing & Composition", description: "Creating meaning through writing.", levels: [1, 2, 3, 4, 5] },
  { id: "en-oral", subject: "english", name: "Oral Language", description: "Speaking, listening and presenting.", levels: [1, 2, 3, 4, 5] },

  // Mathematics
  { id: "ma-number", subject: "maths", name: "Number & Algebra", description: "Numbers, operations and patterns.", levels: [1, 2, 3, 4, 5] },
  { id: "ma-geometry", subject: "maths", name: "Geometry & Measurement", description: "Shape, space and measuring.", levels: [1, 2, 3, 4, 5] },
  { id: "ma-stats", subject: "maths", name: "Statistics", description: "Investigating and interpreting data.", levels: [1, 2, 3, 4, 5] },

  // Science
  { id: "sc-nos", subject: "science", name: "Nature of Science", description: "How scientists work and think.", levels: [1, 2, 3, 4, 5] },
  { id: "sc-living", subject: "science", name: "Living World", description: "Plants, animals and ecology.", levels: [1, 2, 3, 4, 5] },
  { id: "sc-physical", subject: "science", name: "Physical World", description: "Forces, energy, light and sound.", levels: [1, 2, 3, 4, 5] },
  { id: "sc-material", subject: "science", name: "Material World", description: "Matter, materials and chemistry.", levels: [1, 2, 3, 4, 5] },
  { id: "sc-earth", subject: "science", name: "Planet Earth & Beyond", description: "Earth systems and space.", levels: [1, 2, 3, 4, 5] },

  // Social Sciences
  { id: "so-identity", subject: "social", name: "Identity, Culture & Organisation", description: "People, groups and society.", levels: [1, 2, 3, 4, 5] },
  { id: "so-place", subject: "social", name: "Place & Environment", description: "Locations and our impact on them.", levels: [1, 2, 3, 4, 5] },
  { id: "so-change", subject: "social", name: "Continuity & Change", description: "History and how things change.", levels: [1, 2, 3, 4, 5] },

  // Technology
  { id: "te-practice", subject: "tech", name: "Technological Practice", description: "Planning and making outcomes.", levels: [1, 2, 3, 4, 5] },
  { id: "te-ct", subject: "tech", name: "Computational Thinking", description: "Algorithms, logic and coding.", levels: [1, 2, 3, 4, 5] },
  { id: "te-ddo", subject: "tech", name: "Digital Outcomes", description: "Designing and developing digital media.", levels: [1, 2, 3, 4, 5] },

  // Te Reo Māori (future-ready)
  { id: "re-korero", subject: "reo", name: "Kōrero (Speaking)", description: "Speaking te reo Māori.", levels: [1, 2, 3] },
  { id: "re-panui", subject: "reo", name: "Pānui (Reading)", description: "Reading te reo Māori.", levels: [1, 2, 3] },
];

export const STRANDS_BY_SUBJECT = STRANDS.reduce<Record<string, CurriculumStrand[]>>(
  (acc, s) => {
    (acc[s.subject] ||= []).push(s);
    return acc;
  },
  {},
);

/** Unlockable worlds, gated by total XP for a sense of progression. */
export const WORLDS: World[] = [
  { id: "w-storyhaven", subject: "english", name: "Storyhaven", description: "A floating city of books.", unlockXp: 0, emoji: "📚" },
  { id: "w-numberforge", subject: "maths", name: "Numberforge", description: "A volcanic forge of numbers.", unlockXp: 0, emoji: "🌋" },
  { id: "w-lab", subject: "science", name: "Discovery Lab", description: "A bubbling rooftop laboratory.", unlockXp: 150, emoji: "⚗️" },
  { id: "w-atlas", subject: "social", name: "Aotearoa Atlas", description: "A living map of New Zealand.", unlockXp: 300, emoji: "🏔️" },
  { id: "w-makerbay", subject: "tech", name: "Maker Bay", description: "A workshop full of robots.", unlockXp: 500, emoji: "🤖" },
  { id: "w-teao", subject: "reo", name: "Te Ao Māori", description: "A marae among the stars.", unlockXp: 800, emoji: "✨" },
];

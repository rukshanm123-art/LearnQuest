import type { AgeBand, CurriculumObjective, NzCurriculumLevel, SubjectId } from "@/types";

/**
 * New Zealand Curriculum achievement objectives, tagged to school Years 1–8.
 * This is the alignment backbone (#02) the authoring CMS tags content against
 * and reports coverage on. Authored here as a representative starter set across
 * Maths, English and Science — extend with an education lead toward full
 * Years 1–8 coverage.
 */

export const YEARS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

/** NZC level for a school year (L1≈Y1-2, L2≈Y3-4, L3≈Y5-6, L4≈Y7-8). */
export function yearToLevel(year: number): NzCurriculumLevel {
  return Math.min(5, Math.max(1, Math.ceil(year / 2))) as NzCurriculumLevel;
}

/** Age band for a school year (Y1-3≈5-7, Y4-6≈8-10, Y7-8≈11-14). */
export function yearToAgeBand(year: number): AgeBand {
  if (year <= 3) return "5-7";
  if (year <= 6) return "8-10";
  return "11-14";
}

export const OBJECTIVES: CurriculumObjective[] = [
  // ── Mathematics ─────────────────────────────────────────
  { id: "MA-N-Y1-01", subject: "maths", strandId: "ma-number", year: 1, level: 1, code: "NA1-1", description: "Count, order and add within 10." },
  { id: "MA-N-Y2-01", subject: "maths", strandId: "ma-number", year: 2, level: 1, code: "NA1-2", description: "Add and subtract within 20.", prerequisiteIds: ["MA-N-Y1-01"] },
  { id: "MA-N-Y3-01", subject: "maths", strandId: "ma-number", year: 3, level: 2, code: "NA2-1", description: "Recall 2, 5 and 10 times tables.", prerequisiteIds: ["MA-N-Y2-01"] },
  { id: "MA-N-Y4-01", subject: "maths", strandId: "ma-number", year: 4, level: 2, code: "NA2-2", description: "Multiplication and division basic facts.", prerequisiteIds: ["MA-N-Y3-01"] },
  { id: "MA-N-Y5-01", subject: "maths", strandId: "ma-number", year: 5, level: 3, code: "NA3-1", description: "Fractions of regions and sets.", prerequisiteIds: ["MA-N-Y4-01"] },
  { id: "MA-N-Y6-01", subject: "maths", strandId: "ma-number", year: 6, level: 3, code: "NA3-2", description: "Decimals and percentages.", prerequisiteIds: ["MA-N-Y5-01"] },
  { id: "MA-GM-Y3-01", subject: "maths", strandId: "ma-geometry", year: 3, level: 2, code: "GM2-3", description: "Identify 2D shapes and lines of symmetry." },
  { id: "MA-S-Y5-01", subject: "maths", strandId: "ma-stats", year: 5, level: 3, code: "S3-1", description: "Display and interpret category and whole-number data." },

  // ── English ─────────────────────────────────────────────
  { id: "EN-R-Y1-01", subject: "english", strandId: "en-reading", year: 1, level: 1, code: "EN-L1-R", description: "Decode words using phonics." },
  { id: "EN-R-Y2-01", subject: "english", strandId: "en-reading", year: 2, level: 1, code: "EN-L1-R2", description: "Read simple texts for meaning.", prerequisiteIds: ["EN-R-Y1-01"] },
  { id: "EN-R-Y4-01", subject: "english", strandId: "en-reading", year: 4, level: 2, code: "EN-L2-R", description: "Comprehend and make inferences from texts.", prerequisiteIds: ["EN-R-Y2-01"] },
  { id: "EN-R-Y6-01", subject: "english", strandId: "en-reading", year: 6, level: 3, code: "EN-L3-R", description: "Analyse and evaluate texts and language features.", prerequisiteIds: ["EN-R-Y4-01"] },
  { id: "EN-W-Y2-01", subject: "english", strandId: "en-writing", year: 2, level: 1, code: "EN-L1-W", description: "Write simple, correctly-ordered sentences." },
  { id: "EN-W-Y4-01", subject: "english", strandId: "en-writing", year: 4, level: 2, code: "EN-L2-W", description: "Structure paragraphs and use punctuation.", prerequisiteIds: ["EN-W-Y2-01"] },
  { id: "EN-O-Y3-01", subject: "english", strandId: "en-oral", year: 3, level: 2, code: "EN-L2-O", description: "Speak and listen to share and clarify ideas." },

  // ── Science ─────────────────────────────────────────────
  { id: "SC-L-Y2-01", subject: "science", strandId: "sc-living", year: 2, level: 1, code: "LW1-1", description: "Recognise living things and their habitats." },
  { id: "SC-L-Y6-01", subject: "science", strandId: "sc-living", year: 6, level: 3, code: "LW3-1", description: "Explain ecosystems and interdependence.", prerequisiteIds: ["SC-L-Y2-01"] },
  { id: "SC-P-Y4-01", subject: "science", strandId: "sc-physical", year: 4, level: 2, code: "PW2-1", description: "Investigate forces and motion." },
  { id: "SC-M-Y4-01", subject: "science", strandId: "sc-material", year: 4, level: 2, code: "MW2-1", description: "Describe states of matter and changes." },
  { id: "SC-E-Y6-01", subject: "science", strandId: "sc-earth", year: 6, level: 3, code: "PEB3-1", description: "Describe Earth, the solar system and space." },
  { id: "SC-NOS-Y5-01", subject: "science", strandId: "sc-nos", year: 5, level: 3, code: "NOS3-1", description: "Plan and carry out a fair investigation." },
];

export const OBJECTIVE_MAP: Record<string, CurriculumObjective> = Object.fromEntries(
  OBJECTIVES.map((o) => [o.id, o]),
);

export function objectivesForSubject(subject: SubjectId): CurriculumObjective[] {
  return OBJECTIVES.filter((o) => o.subject === subject).sort((a, b) => a.year - b.year);
}

export function objectivesForSubjectYear(subject: SubjectId, year: number): CurriculumObjective[] {
  return OBJECTIVES.filter((o) => o.subject === subject && o.year === year);
}

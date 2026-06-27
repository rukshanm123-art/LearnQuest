import type { AgeBand, NzCurriculumLevel, Question, SubjectId } from "@/types";
import { QUESTIONS } from "@/data/questions";
import { STRANDS_BY_SUBJECT } from "./nz-curriculum";

/**
 * Curriculum mapping engine.
 *
 * Bridges learner attributes (age band) to NZ Curriculum levels and filters
 * the content pool accordingly. This is the seam where, in production, you'd
 * query Postgres with the same predicates instead of filtering in memory.
 */

/** Curriculum levels that are developmentally appropriate for an age band. */
export function levelsForAgeBand(age: AgeBand): NzCurriculumLevel[] {
  switch (age) {
    case "5-7":
      return [1, 2];
    case "8-10":
      return [2, 3];
    case "11-14":
      return [4, 5];
  }
}

export function questionsForSubject(
  subject: SubjectId,
  age: AgeBand,
  /** Extra (e.g. author-published) items to include alongside the seed bank. */
  extra: Question[] = [],
): Question[] {
  const levels = new Set(levelsForAgeBand(age));
  return [...QUESTIONS, ...extra].filter(
    (q) => q.subject === subject && levels.has(q.level),
  );
}

/** All questions appropriate for an age band, any subject (adaptive pool). */
export function questionsForAge(age: AgeBand, extra: Question[] = []): Question[] {
  const levels = new Set(levelsForAgeBand(age));
  return [...QUESTIONS, ...extra].filter((q) => levels.has(q.level));
}

export function strandsForSubject(subject: SubjectId) {
  return STRANDS_BY_SUBJECT[subject] ?? [];
}

/** Coverage report: how many questions exist per strand for a subject/age. */
export function strandCoverage(subject: SubjectId, age: AgeBand) {
  const qs = questionsForSubject(subject, age);
  return strandsForSubject(subject).map((strand) => ({
    strand,
    count: qs.filter((q) => q.strandId === strand.id).length,
  }));
}

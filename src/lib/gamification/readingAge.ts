import type { PlayerState } from "@/types";
import { getLevelInfo } from "./engine";

/**
 * Estimated "reading age" + literacy sub-scores — the metric parents actually
 * care about (vs Reading Eggs' time-spent / lessons-done). Heuristic, derived
 * from accuracy, lessons mastered, level and stories read. Clearly an estimate.
 */
export interface ReadingMetrics {
  readingAge: number; // years, 1dp
  actualAge: number; // years, 1dp
  monthsVsAge: number; // +/- months above/below chronological age
  fluency: number; // 0–100
  comprehension: number; // 0–100
  vocabulary: number; // 0–100
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)));

export function readingMetrics(p: PlayerState): ReadingMetrics {
  const actualAge = p.ageBand === "5-7" ? 6.5 : p.ageBand === "11-14" ? 12.5 : 9;

  const eng = p.mastery?.english ?? { accuracy: 0, attempts: 0 };
  const active = Object.values(p.mastery ?? {}).filter((m) => m.attempts > 0);
  const avgAcc = active.length ? active.reduce((a, m) => a + m.accuracy, 0) / active.length : 0;
  const lessonStars = Object.values(p.lessonStars ?? {}).reduce((a, b) => a + b, 0);
  const level = getLevelInfo(p.totalXp).level;
  const storiesRead = (p as PlayerState & { stories?: unknown[] }).stories?.length ?? 0;

  // Reading-age delta from chronological age, in years.
  let delta = (avgAcc - 0.6) * 3 + Math.min(2, lessonStars * 0.12) + (level - 1) * 0.12 + Math.min(0.6, storiesRead * 0.1);
  delta = Math.max(-1.5, Math.min(3.5, delta));
  const readingAge = Math.max(4, Math.min(16, Number((actualAge + delta).toFixed(1))));
  const monthsVsAge = Math.round((readingAge - actualAge) * 12);

  const fluency = clamp(40 + eng.accuracy * 40 + Math.min(20, eng.attempts * 0.5));
  const comprehension = clamp(40 + avgAcc * 45 + storiesRead * 2);
  const vocabulary = clamp(40 + eng.accuracy * 35 + storiesRead * 3 + lessonStars * 1.5);

  return { readingAge, actualAge, monthsVsAge, fluency, comprehension, vocabulary };
}

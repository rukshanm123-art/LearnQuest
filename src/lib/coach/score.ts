/** Reading-aloud scoring: compares what was read to the target text. */

const norm = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9'\s]/g, " ").replace(/\s+/g, " ").trim();

export interface ReadingScore {
  accuracy: number; // 0–1
  correct: number;
  total: number;
  words: { w: string; ok: boolean }[];
  stars: number; // 0–3
}

export function scoreReading(target: string, spoken: string): ReadingScore {
  const targetWords = norm(target).split(" ").filter(Boolean);
  const spokenSet = new Set(norm(spoken).split(" ").filter(Boolean));
  const words = targetWords.map((w) => ({ w, ok: spokenSet.has(w) }));
  const correct = words.filter((x) => x.ok).length;
  const accuracy = targetWords.length ? correct / targetWords.length : 0;
  const stars = accuracy >= 0.9 ? 3 : accuracy >= 0.6 ? 2 : accuracy > 0 ? 1 : 0;
  return { accuracy, correct, total: targetWords.length, words, stars };
}

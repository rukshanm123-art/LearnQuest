/** Pet evolution stages — pets grow as the learner levels up. */

export type EvoKey = "egg" | "baby" | "rare" | "epic" | "legendary";

export interface EvoStage {
  key: EvoKey;
  label: string;
  emoji: string;
  index: number;
  minLevel: number;
}

export const EVO_STAGES: EvoStage[] = [
  { key: "egg", label: "Egg", emoji: "🥚", index: 0, minLevel: 1 },
  { key: "baby", label: "Baby", emoji: "🐣", index: 1, minLevel: 3 },
  { key: "rare", label: "Rare", emoji: "✨", index: 2, minLevel: 6 },
  { key: "epic", label: "Epic", emoji: "💜", index: 3, minLevel: 11 },
  { key: "legendary", label: "Legendary", emoji: "👑", index: 4, minLevel: 20 },
];

export function petStage(level: number): EvoStage {
  let stage = EVO_STAGES[0];
  for (const s of EVO_STAGES) if (level >= s.minLevel) stage = s;
  return stage;
}

export function nextStage(level: number): EvoStage | null {
  return EVO_STAGES[petStage(level).index + 1] ?? null;
}

/** 0..1 progress through the current stage toward the next (by level). */
export function stageProgress(level: number): number {
  const cur = petStage(level);
  const nxt = nextStage(level);
  if (!nxt) return 1;
  return Math.min(1, Math.max(0, (level - cur.minLevel) / (nxt.minLevel - cur.minLevel)));
}

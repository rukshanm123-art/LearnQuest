/** Visual palette + silhouette form for each boss (used by the 2D Boss2D art). */
export type BossForm = "dragon" | "golem" | "kraken" | "mech" | "phantom" | "guardian";

export interface BossLook {
  form: BossForm;
  color: string;
  accent: string;
}

export const BOSS_LOOK: Record<string, BossLook> = {
  "grammar-dragon": { form: "dragon", color: "#f97316", accent: "#fb923c" },
  "number-titan": { form: "golem", color: "#3b82f6", accent: "#93c5fd" },
  "fraction-kraken": { form: "kraken", color: "#0ea5e9", accent: "#7dd3fc" },
  "science-mech": { form: "mech", color: "#10b981", accent: "#6ee7b7" },
  "vocabulary-phantom": { form: "phantom", color: "#a855f7", accent: "#d8b4fe" },
  "time-guardian": { form: "guardian", color: "#8b5cf6", accent: "#c4b5fd" },
};

export const bossLookFor = (id: string): BossLook =>
  BOSS_LOOK[id] ?? { form: "golem", color: "#64748b", accent: "#cbd5e1" };

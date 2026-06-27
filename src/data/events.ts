/** Seasonal / weekly live events. Set ACTIVE_EVENT to null when none is running. */
export interface SeasonalEvent {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
  /** Tailwind gradient classes for the banner. */
  accent: string;
}

export const ACTIVE_EVENT: SeasonalEvent | null = {
  id: "matariki-2026",
  name: "Matariki Festival",
  emoji: "✨",
  blurb: "Celebrate te Mātahi o te Tau — the Māori New Year — with limited-time quests and bonus rewards!",
  accent: "from-indigo-600 via-gem to-brand-500",
};

/** Houses — safe, team-based belonging (no chat). Students earn points for their house. */
export interface House {
  id: string;
  name: string;
  emoji: string;
  color: string;
  motto: string;
}

export const HOUSES: House[] = [
  { id: "kiwi", name: "Kiwi House", emoji: "🥝", color: "#22c55e", motto: "Steady, grounded, determined." },
  { id: "kea", name: "Kea House", emoji: "🦜", color: "#3b82f6", motto: "Curious, clever, playful." },
  { id: "tui", name: "Tūī House", emoji: "🐦", color: "#a855f7", motto: "Bold, bright, full of song." },
  { id: "kakapo", name: "Kākāpō House", emoji: "🦤", color: "#f59e0b", motto: "Rare, resilient, one of a kind." },
];

export const HOUSE_MAP: Record<string, House> = Object.fromEntries(HOUSES.map((h) => [h.id, h]));

/** Deterministically assign a house from a stable seed (keeps houses balanced). */
export function assignHouse(seed: string): string {
  let hash = 0;
  for (const c of seed || "kiwi") hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  return HOUSES[hash % HOUSES.length].id;
}

/**
 * Demo house standings: the player's real XP contributes to their house; other
 * houses get a stable, lively baseline. In production these are SUM(player_state.total_xp)
 * grouped by house from Supabase (see docs/RPG_VISION.md).
 */
export function houseStandings(myHouseId: string, myXp: number): { house: House; points: number; mine: boolean }[] {
  const base: Record<string, number> = { kiwi: 8400, kea: 9100, tui: 7700, kakapo: 8800 };
  return HOUSES.map((h) => ({
    house: h,
    points: base[h.id] + (h.id === myHouseId ? myXp : 0),
    mine: h.id === myHouseId,
  })).sort((a, b) => b.points - a.points);
}

/** A shared weekly goal all houses contribute toward. */
export const HOUSE_CUP_GOAL = 50000;

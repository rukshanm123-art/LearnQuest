/**
 * Critterpedia — a Pokédex-style collection unlocked by learning. Kids discover
 * a new critter for finishing lessons / beating bosses, building a big set they
 * want to complete. Generated from base creatures × variants (shiny/giant/baby/
 * golden) so the collection is large and keeps growing.
 */

export type CritterRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
export type CritterVariant = "base" | "shiny" | "giant" | "baby" | "golden";

export interface Critter {
  id: string;
  name: string;
  emoji: string;
  category: string;
  rarity: CritterRarity;
  variant: CritterVariant;
}

export const CRITTER_CATEGORIES = ["Forest", "Ocean", "Sky", "Jungle", "Farm", "Bugs", "Dino", "Mythic", "Cosmic"] as const;

const TIERS: CritterRarity[] = ["common", "uncommon", "rare", "epic", "legendary"];
const bump = (r: CritterRarity, by: number): CritterRarity => TIERS[Math.min(TIERS.length - 1, Math.max(0, TIERS.indexOf(r) + by))];

// [emoji, name, category, baseRarity]
const BASE: [string, string, string, CritterRarity][] = [
  ["🦊", "Fox", "Forest", "common"], ["🦝", "Raccoon", "Forest", "common"], ["🦌", "Deer", "Forest", "common"],
  ["🐗", "Boar", "Forest", "uncommon"], ["🦫", "Beaver", "Forest", "uncommon"], ["🦔", "Hedgehog", "Forest", "common"],
  ["🐻", "Bear", "Forest", "uncommon"], ["🦉", "Owl", "Forest", "uncommon"], ["🐿️", "Squirrel", "Forest", "common"],
  ["🦇", "Bat", "Forest", "uncommon"], ["🐺", "Wolf", "Forest", "rare"], ["🦡", "Badger", "Forest", "uncommon"],

  ["🐬", "Dolphin", "Ocean", "uncommon"], ["🐳", "Whale", "Ocean", "rare"], ["🐙", "Octopus", "Ocean", "rare"],
  ["🦑", "Squid", "Ocean", "uncommon"], ["🦈", "Shark", "Ocean", "rare"], ["🐠", "Reef Fish", "Ocean", "common"],
  ["🐡", "Pufferfish", "Ocean", "common"], ["🦀", "Crab", "Ocean", "common"], ["🦞", "Lobster", "Ocean", "uncommon"],
  ["🦐", "Shrimp", "Ocean", "common"], ["🦭", "Seal", "Ocean", "uncommon"], ["🐢", "Turtle", "Ocean", "uncommon"],

  ["🦅", "Eagle", "Sky", "rare"], ["🦜", "Parrot", "Sky", "uncommon"], ["🦢", "Swan", "Sky", "uncommon"],
  ["🦩", "Flamingo", "Sky", "uncommon"], ["🦚", "Peacock", "Sky", "rare"], ["🐧", "Penguin", "Sky", "common"],
  ["🦆", "Duck", "Sky", "common"], ["🕊️", "Dove", "Sky", "common"], ["🦃", "Turkey", "Sky", "common"], ["🐦", "Robin", "Sky", "common"],

  ["🦁", "Lion", "Jungle", "rare"], ["🐯", "Tiger", "Jungle", "rare"], ["🐘", "Elephant", "Jungle", "rare"],
  ["🦒", "Giraffe", "Jungle", "uncommon"], ["🦓", "Zebra", "Jungle", "uncommon"], ["🦏", "Rhino", "Jungle", "rare"],
  ["🦛", "Hippo", "Jungle", "uncommon"], ["🐆", "Leopard", "Jungle", "rare"], ["🦍", "Gorilla", "Jungle", "rare"],
  ["🐒", "Monkey", "Jungle", "common"], ["🦧", "Orangutan", "Jungle", "uncommon"], ["🐊", "Crocodile", "Jungle", "rare"],

  ["🐄", "Cow", "Farm", "common"], ["🐖", "Pig", "Farm", "common"], ["🐑", "Sheep", "Farm", "common"],
  ["🐐", "Goat", "Farm", "common"], ["🐔", "Chicken", "Farm", "common"], ["🐴", "Horse", "Farm", "uncommon"],
  ["🐰", "Rabbit", "Farm", "common"], ["🐭", "Mouse", "Farm", "common"], ["🐱", "Cat", "Farm", "common"], ["🐶", "Dog", "Farm", "common"],

  ["🦋", "Butterfly", "Bugs", "uncommon"], ["🐝", "Bee", "Bugs", "common"], ["🐞", "Ladybug", "Bugs", "common"],
  ["🐛", "Caterpillar", "Bugs", "common"], ["🐌", "Snail", "Bugs", "common"], ["🐜", "Ant", "Bugs", "common"],
  ["🕷️", "Spider", "Bugs", "uncommon"], ["🦗", "Cricket", "Bugs", "common"], ["🪲", "Beetle", "Bugs", "common"], ["🦂", "Scorpion", "Bugs", "uncommon"],

  ["🦕", "Sauropod", "Dino", "rare"], ["🦖", "T-Rex", "Dino", "epic"], ["🐉", "Dragon", "Dino", "epic"], ["🐲", "Wyrm", "Dino", "rare"],

  ["🦄", "Unicorn", "Mythic", "epic"], ["🧚", "Fairy", "Mythic", "rare"], ["🧜", "Mermaid", "Mythic", "rare"],
  ["🧞", "Genie", "Mythic", "epic"], ["🔥", "Phoenix", "Mythic", "legendary"], ["👾", "Pixel Beast", "Mythic", "uncommon"],
  ["🤖", "Robot", "Mythic", "uncommon"], ["👽", "Alien", "Mythic", "uncommon"], ["🦸", "Hero", "Mythic", "rare"], ["🧙", "Wizard", "Mythic", "rare"],

  ["🌟", "Star Sprite", "Cosmic", "rare"], ["☄️", "Comet", "Cosmic", "epic"], ["🪐", "Planetling", "Cosmic", "epic"],
  ["🌙", "Moonkin", "Cosmic", "rare"], ["⭐", "Starlet", "Cosmic", "uncommon"], ["🌈", "Rainbow Spirit", "Cosmic", "legendary"],
  ["❄️", "Frostling", "Cosmic", "uncommon"], ["⚡", "Sparkle", "Cosmic", "uncommon"], ["🔮", "Oracle", "Cosmic", "rare"],
];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

function build(): Critter[] {
  const out: Critter[] = [];
  const animalCats = new Set(["Forest", "Ocean", "Sky", "Jungle", "Farm", "Bugs"]);
  for (const [emoji, name, category, rarity] of BASE) {
    out.push({ id: `c-${slug(name)}`, name, emoji, category, rarity, variant: "base" });
    out.push({ id: `c-shiny-${slug(name)}`, name: `Shiny ${name}`, emoji, category, rarity: bump(rarity, 2), variant: "shiny" });
    out.push({ id: `c-giant-${slug(name)}`, name: `Giant ${name}`, emoji, category, rarity: bump(rarity, 1), variant: "giant" });
    if (animalCats.has(category)) {
      out.push({ id: `c-baby-${slug(name)}`, name: `Baby ${name}`, emoji, category, rarity: "uncommon", variant: "baby" });
      out.push({ id: `c-gold-${slug(name)}`, name: `Golden ${name}`, emoji, category, rarity: "legendary", variant: "golden" });
    }
  }
  return out;
}

export const CRITTERS: Critter[] = build();
export const CRITTER_MAP: Record<string, Critter> = Object.fromEntries(CRITTERS.map((c) => [c.id, c]));
export const CRITTER_COUNT = CRITTERS.length;

export const VARIANT_BADGE: Record<CritterVariant, string> = { base: "", shiny: "✨", giant: "🔼", baby: "🍼", golden: "🏅" };

/** Pick `n` random not-yet-collected critters, rarity-weighted (commons first). */
export function rollCritters(collected: Set<string>, n: number): Critter[] {
  const pool = CRITTERS.filter((c) => !collected.has(c.id));
  if (pool.length === 0) return [];
  const weight: Record<CritterRarity, number> = { common: 50, uncommon: 26, rare: 14, epic: 7, legendary: 3 };
  const picks: Critter[] = [];
  const avail = [...pool];
  for (let i = 0; i < n && avail.length; i++) {
    const total = avail.reduce((s, c) => s + weight[c.rarity], 0);
    let r = Math.random() * total;
    let idx = 0;
    for (let j = 0; j < avail.length; j++) {
      r -= weight[avail[j].rarity];
      if (r <= 0) { idx = j; break; }
    }
    picks.push(avail.splice(idx, 1)[0]);
  }
  return picks;
}

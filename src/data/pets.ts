import type { Pet } from "@/types";

/** Collectible companions. Each grants a small passive perk while equipped. */
export const PETS: Pet[] = [
  // Common
  { id: "kiwi", name: "Kowhai the Kiwi", species: "Kiwi", emoji: "🥝", rarity: "common", cost: 0, perk: "+5% XP on English quests" },
  { id: "penguin", name: "Pip the Penguin", species: "Kororā", emoji: "🐧", rarity: "common", cost: 60, perk: "+5% XP on Science quests" },
  { id: "turtle", name: "Honu", species: "Sea Turtle", emoji: "🐢", rarity: "common", cost: 70, perk: "Slow & steady: keeps streak grace" },
  { id: "cat", name: "Miro the Cat", species: "Cat", emoji: "🐱", rarity: "common", cost: 50, perk: "+1 coin every 5 answers" },
  { id: "dog", name: "Rua the Pup", species: "Dog", emoji: "🐶", rarity: "common", cost: 50, perk: "Loyal: +2 XP per quest" },
  { id: "bee", name: "Bzz", species: "Bee", emoji: "🐝", rarity: "common", cost: 40, perk: "Busy bee: +5% XP before noon" },

  // Rare
  { id: "tuatara", name: "Rex the Tuatara", species: "Tuatara", emoji: "🦎", rarity: "rare", cost: 120, perk: "+1 coin per correct answer" },
  { id: "fantail", name: "Tipi the Fantail", species: "Pīwakawaka", emoji: "🐦", rarity: "rare", cost: 150, perk: "Protects your streak once per week" },
  { id: "kea", name: "Kea", species: "Kea", emoji: "🦜", rarity: "rare", cost: 150, perk: "+5% XP on Maths quests" },
  { id: "fox", name: "Remu the Fox", species: "Fox", emoji: "🦊", rarity: "rare", cost: 170, perk: "Clever: small hint discount" },
  { id: "dolphin", name: "Aihe", species: "Dolphin", emoji: "🐬", rarity: "rare", cost: 180, perk: "+5% XP on timed challenges" },
  { id: "owl", name: "Ruru", species: "Morepork", emoji: "🦉", rarity: "rare", cost: 160, perk: "Night owl: +5% XP after 6pm" },

  // Epic
  { id: "kraken", name: "Inky the Kraken", species: "Wheke", emoji: "🐙", rarity: "epic", cost: 400, perk: "Doubles speed bonuses" },
  { id: "panda", name: "Bao", species: "Panda", emoji: "🐼", rarity: "epic", cost: 420, perk: "+10% XP on weekends" },
  { id: "trex", name: "Toa the T-Rex", species: "Dinosaur", emoji: "🦖", rarity: "epic", cost: 500, perk: "Boss damage +20%" },

  // Legendary
  { id: "dragon", name: "Ember the Dragon", species: "Taniwha", emoji: "🐉", rarity: "legendary", cost: null, perk: "Boss reward: +10% all XP" },
  { id: "unicorn", name: "Aurora", species: "Unicorn", emoji: "🦄", rarity: "legendary", cost: 800, perk: "+15% coins on everything" },
  { id: "phoenix", name: "Rētō the Phoenix", species: "Phoenix", emoji: "🔥", rarity: "legendary", cost: 1000, perk: "Revives a lost streak once" },
];

export const PET_MAP = Object.fromEntries(PETS.map((p) => [p.id, p]));

/** Sort weight so rarer pets group together in the shop. */
export const RARITY_ORDER: Record<Pet["rarity"], number> = {
  common: 0, rare: 1, epic: 2, legendary: 3,
};

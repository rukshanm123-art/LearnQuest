/**
 * "My Room" decor catalogue. Kids spend coins on furniture/decorations and
 * place them in their own room — long-term progression they return for
 * (Roblox/Animal-Crossing style), powered by what they earn learning.
 */
export interface DecorItem {
  id: string;
  name: string;
  emoji: string;
  category: "Furniture" | "Plants" | "Fun" | "Outdoor";
  cost: number;
}

export const DECOR: DecorItem[] = [
  // Furniture
  { id: "d-sofa", name: "Sofa", emoji: "🛋️", category: "Furniture", cost: 60 },
  { id: "d-chair", name: "Chair", emoji: "🪑", category: "Furniture", cost: 30 },
  { id: "d-bed", name: "Bed", emoji: "🛏️", category: "Furniture", cost: 80 },
  { id: "d-window", name: "Window", emoji: "🪟", category: "Furniture", cost: 40 },
  { id: "d-mirror", name: "Mirror", emoji: "🪞", category: "Furniture", cost: 50 },
  { id: "d-lamp", name: "Lamp", emoji: "🪔", category: "Furniture", cost: 35 },
  { id: "d-clock", name: "Clock", emoji: "🕰️", category: "Furniture", cost: 45 },
  { id: "d-rug", name: "Rug", emoji: "🟫", category: "Furniture", cost: 30 },

  // Plants
  { id: "d-plant", name: "Potted Plant", emoji: "🪴", category: "Plants", cost: 30 },
  { id: "d-cactus", name: "Cactus", emoji: "🌵", category: "Plants", cost: 40 },
  { id: "d-sunflower", name: "Sunflower", emoji: "🌻", category: "Plants", cost: 35 },
  { id: "d-bamboo", name: "Bamboo", emoji: "🎍", category: "Plants", cost: 50 },
  { id: "d-bonsai", name: "Bonsai", emoji: "🌳", category: "Plants", cost: 70 },

  // Fun
  { id: "d-teddy", name: "Teddy", emoji: "🧸", category: "Fun", cost: 40 },
  { id: "d-tv", name: "TV", emoji: "📺", category: "Fun", cost: 100 },
  { id: "d-console", name: "Console", emoji: "🎮", category: "Fun", cost: 90 },
  { id: "d-painting", name: "Painting", emoji: "🖼️", category: "Fun", cost: 50 },
  { id: "d-trophy", name: "Trophy", emoji: "🏆", category: "Fun", cost: 60 },
  { id: "d-books", name: "Bookshelf", emoji: "📚", category: "Fun", cost: 60 },
  { id: "d-fishtank", name: "Fish Tank", emoji: "🐠", category: "Fun", cost: 80 },
  { id: "d-guitar", name: "Guitar", emoji: "🎸", category: "Fun", cost: 80 },
  { id: "d-arcade", name: "Arcade", emoji: "🕹️", category: "Fun", cost: 120 },
  { id: "d-balloon", name: "Balloons", emoji: "🎈", category: "Fun", cost: 20 },

  // Outdoor / Island
  { id: "d-tree", name: "Tree", emoji: "🌴", category: "Outdoor", cost: 50 },
  { id: "d-fountain", name: "Fountain", emoji: "⛲", category: "Outdoor", cost: 110 },
  { id: "d-castle", name: "Castle", emoji: "🏰", category: "Outdoor", cost: 200 },
  { id: "d-campfire", name: "Campfire", emoji: "🔥", category: "Outdoor", cost: 50 },
  { id: "d-parasol", name: "Parasol", emoji: "⛱️", category: "Outdoor", cost: 60 },
  { id: "d-rainbow", name: "Rainbow", emoji: "🌈", category: "Outdoor", cost: 90 },
];

export const DECOR_MAP: Record<string, DecorItem> = Object.fromEntries(DECOR.map((d) => [d.id, d]));
export const DECOR_CATEGORIES = ["Furniture", "Plants", "Fun", "Outdoor"] as const;

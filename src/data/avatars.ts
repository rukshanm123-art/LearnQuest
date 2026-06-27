import type { AvatarPart } from "@/types";

/**
 * Avatar customisation catalogue for the layered 2D "dress-up" avatar.
 * Same six slots as before so saved progress keeps working, but each part now
 * drives a real SVG layer (drawn to a shared body template, so clothes/hats/
 * accessories sit correctly on the character — not floating emoji stickers).
 *
 * - background → SVG scene gradient (`grad`)
 * - base       → character = skin tone + baked-in hairstyle (`color`, `hair`, `hairColor`)
 * - face/hat/outfit/accessory → cosmetic SVG layers keyed by `kind` (+ `color`)
 */
export const AVATAR_PARTS: AvatarPart[] = [
  // ── Backgrounds ─────────────────────────────────────────
  { id: "bg-sky", slot: "background", name: "Sky", grad: ["#cdedff", "#7cc4ff"], cost: 0, rarity: "common" },
  { id: "bg-sunset", slot: "background", name: "Sunset", grad: ["#ffd9ad", "#ff8fb1"], cost: 60 },
  { id: "bg-ocean", slot: "background", name: "Ocean", grad: ["#a5f3fc", "#2563eb"], cost: 60 },
  { id: "bg-forest", slot: "background", name: "Forest", grad: ["#bbf7d0", "#10b981"], cost: 80 },
  { id: "bg-candy", slot: "background", name: "Candy", grad: ["#fbcfe8", "#e879f9"], cost: 80 },
  { id: "bg-mint", slot: "background", name: "Mint", grad: ["#ccfbf1", "#5eead4"], cost: 70 },
  { id: "bg-night", slot: "background", name: "Midnight", grad: ["#64748b", "#0f172a"], cost: 120, rarity: "rare" },
  { id: "bg-galaxy", slot: "background", name: "Galaxy", grad: ["#818cf8", "#3b0764"], cost: 150, rarity: "rare" },
  { id: "bg-gold", slot: "background", name: "Gold", grad: ["#fde68a", "#f59e0b"], cost: 200, rarity: "epic" },
  { id: "bg-rainbow", slot: "background", name: "Rainbow", grad: ["#fca5a5", "#a5b4fc"], cost: 350, rarity: "legendary" },

  // ── Characters (skin + hair) ────────────────────────────
  { id: "base-explorer", slot: "base", name: "Explorer", color: "#f4c79a", hair: "short", hairColor: "#6b4423", cost: 0, rarity: "common" },
  { id: "base-ava", slot: "base", name: "Ava", color: "#c98a5e", hair: "curly", hairColor: "#241712", cost: 0, rarity: "common" },
  { id: "base-kai", slot: "base", name: "Kai", color: "#8d5a3c", hair: "afro", hairColor: "#171717", cost: 90 },
  { id: "base-zoe", slot: "base", name: "Zoe", color: "#f1c9a5", hair: "ponytail", hairColor: "#c9700f", cost: 90 },
  { id: "base-mia", slot: "base", name: "Mia", color: "#e8b58a", hair: "long", hairColor: "#3a2a18", cost: 100 },
  { id: "base-leo", slot: "base", name: "Leo", color: "#5c3a24", hair: "buzz", hairColor: "#0e0e0e", cost: 100 },
  { id: "base-pixie", slot: "base", name: "Pixie", color: "#f7d5b5", hair: "pixie", hairColor: "#7c3aed", cost: 150, rarity: "rare" },
  { id: "base-frost", slot: "base", name: "Frost", color: "#eaf2ff", hair: "long", hairColor: "#7dd3fc", cost: 180, rarity: "rare" },
  { id: "base-robot", slot: "base", name: "Robo", color: "#aab6c6", hair: "robot", hairColor: "#64748b", cost: 200, rarity: "epic" },
  { id: "base-alien", slot: "base", name: "Zorp", color: "#86efac", hair: "antenna", hairColor: "#16a34a", cost: 220, rarity: "epic" },

  // ── Face ────────────────────────────────────────────────
  { id: "face-glasses", slot: "face", name: "Glasses", kind: "glasses", color: "#1f2937", cost: 40 },
  { id: "face-sunnies", slot: "face", name: "Sunnies", kind: "sunnies", color: "#111827", cost: 60 },
  { id: "face-freckles", slot: "face", name: "Freckles", kind: "freckles", color: "#b4682f", cost: 30 },
  { id: "face-star", slot: "face", name: "Face Paint", kind: "facepaint", color: "#ec4899", cost: 70 },

  // ── Hats ────────────────────────────────────────────────
  { id: "hat-cap", slot: "hat", name: "Cap", kind: "cap", color: "#2563eb", cost: 40 },
  { id: "hat-beanie", slot: "hat", name: "Beanie", kind: "beanie", color: "#dc2626", cost: 50 },
  { id: "hat-sun", slot: "hat", name: "Sun Hat", kind: "sun", color: "#fcd34d", cost: 80 },
  { id: "hat-party", slot: "hat", name: "Party", kind: "party", color: "#f472b6", cost: 70 },
  { id: "hat-wizard", slot: "hat", name: "Wizard", kind: "wizard", color: "#5b21b6", cost: 120, rarity: "rare" },
  { id: "hat-crown", slot: "hat", name: "Crown", kind: "crown", color: "#fbbf24", cost: 320, rarity: "epic" },

  // ── Outfits ─────────────────────────────────────────────
  { id: "out-tshirt", slot: "outfit", name: "T-Shirt", kind: "tshirt", color: "#38bdf8", cost: 0, rarity: "common" },
  { id: "out-stripe", slot: "outfit", name: "Stripes", kind: "stripe", color: "#ef4444", color2: "#ffffff", cost: 50 },
  { id: "out-hoodie", slot: "outfit", name: "Hoodie", kind: "hoodie", color: "#16a34a", cost: 80 },
  { id: "out-dress", slot: "outfit", name: "Dress", kind: "dress", color: "#ec4899", cost: 90 },
  { id: "out-lab", slot: "outfit", name: "Lab Coat", kind: "lab", color: "#f1f5f9", cost: 120 },
  { id: "out-hivis", slot: "outfit", name: "Hi-Vis", kind: "hivis", color: "#facc15", cost: 80 },
  { id: "out-sport", slot: "outfit", name: "Sports Kit", kind: "sport", color: "#0ea5e9", cost: 90 },
  { id: "out-hero", slot: "outfit", name: "Superhero", kind: "hero", color: "#dc2626", color2: "#fde047", cost: 200, rarity: "rare" },
  { id: "out-royal", slot: "outfit", name: "Royal Robe", kind: "royal", color: "#7c3aed", color2: "#fbbf24", cost: 280, rarity: "epic" },

  // ── Accessories ─────────────────────────────────────────
  { id: "acc-book", slot: "accessory", name: "Book", kind: "book", color: "#ef4444", cost: 70 },
  { id: "acc-ball", slot: "accessory", name: "Ball", kind: "ball", color: "#f8fafc", cost: 60 },
  { id: "acc-balloon", slot: "accessory", name: "Balloon", kind: "balloon", color: "#f472b6", cost: 80 },
  { id: "acc-flower", slot: "accessory", name: "Flower", kind: "flower", color: "#fbbf24", cost: 50 },
  { id: "acc-star", slot: "accessory", name: "Star Wand", kind: "star", color: "#fbbf24", cost: 90 },
  { id: "acc-wand", slot: "accessory", name: "Magic Wand", kind: "wand", color: "#a855f7", cost: 170, rarity: "rare" },
  { id: "acc-trophy", slot: "accessory", name: "Trophy", kind: "trophy", color: "#fbbf24", cost: 240, rarity: "epic" },
];

export const AVATAR_MAP = Object.fromEntries(AVATAR_PARTS.map((a) => [a.id, a]));

/** Ordered slots for the Avatar Studio, with display labels. */
export const AVATAR_SLOTS: { slot: AvatarPart["slot"]; label: string; optional: boolean }[] = [
  { slot: "base", label: "Character", optional: false },
  { slot: "outfit", label: "Outfit", optional: false },
  { slot: "hat", label: "Hat", optional: true },
  { slot: "face", label: "Face", optional: true },
  { slot: "accessory", label: "Accessory", optional: true },
  { slot: "background", label: "Background", optional: false },
];

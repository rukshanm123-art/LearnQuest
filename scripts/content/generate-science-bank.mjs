#!/usr/bin/env node
/**
 * Generate a curated, CORRECT Science bank from a fact set. Output: src/data/science-bank.json
 * Usage: node scripts/content/generate-science-bank.mjs
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const yearToLevel = (y) => Math.min(5, Math.max(1, Math.ceil(y / 2)));
const yearToAgeBand = (y) => (y <= 3 ? "5-7" : y <= 6 ? "8-10" : "11-14");
const shuffle = (a) => [...a].sort(() => Math.random() - 0.5);

// { q, a(correct), d[wrong x3], year, strand }
const FACTS = [
  ["Which of these is a mammal?", "Whale", ["Shark", "Frog", "Lizard"], 2, "sc-living"],
  ["What do plants need to make their own food?", "Sunlight", ["Darkness", "Rocks", "Plastic"], 2, "sc-living"],
  ["Which body part pumps blood?", "Heart", ["Lungs", "Brain", "Liver"], 3, "sc-living"],
  ["Where do fish get oxygen?", "From water through gills", ["From the sky", "From food", "From sand"], 3, "sc-living"],
  ["What do bees collect from flowers?", "Nectar", ["Water", "Soil", "Leaves"], 2, "sc-living"],
  ["Which is a reptile?", "Tuatara", ["Dolphin", "Penguin", "Bat"], 3, "sc-living"],
  ["What force pulls objects toward Earth?", "Gravity", ["Magnetism", "Friction", "Electricity"], 4, "sc-physical"],
  ["What makes a shadow?", "Light being blocked", ["Wind", "Sound", "Water"], 3, "sc-physical"],
  ["Which travels fastest?", "Light", ["Sound", "A car", "A runner"], 5, "sc-physical"],
  ["What kind of energy does the Sun give us?", "Light and heat", ["Sound", "Sound only", "Cold"], 4, "sc-physical"],
  ["A magnet attracts which material?", "Iron", ["Wood", "Plastic", "Glass"], 4, "sc-physical"],
  ["When water freezes it becomes a…", "Solid", ["Gas", "Liquid", "Plasma"], 4, "sc-material"],
  ["What is H₂O commonly called?", "Water", ["Salt", "Air", "Gold"], 5, "sc-material"],
  ["Steam is water in which state?", "Gas", ["Solid", "Liquid", "Rock"], 4, "sc-material"],
  ["Which is a liquid at room temperature?", "Milk", ["Ice", "Wood", "Stone"], 2, "sc-material"],
  ["What happens to chocolate when heated?", "It melts", ["It freezes", "It glows", "It vanishes"], 3, "sc-material"],
  ["Which planet is closest to the Sun?", "Mercury", ["Venus", "Earth", "Mars"], 6, "sc-earth"],
  ["What causes day and night?", "Earth spinning on its axis", ["The Moon", "Clouds", "The wind"], 5, "sc-earth"],
  ["What is the centre of our Solar System?", "The Sun", ["The Earth", "The Moon", "Mars"], 5, "sc-earth"],
  ["What gas do we breathe in to live?", "Oxygen", ["Helium", "Carbon dioxide", "Neon"], 4, "sc-living"],
  ["What gas do plants absorb to make food?", "Carbon dioxide", ["Oxygen", "Nitrogen", "Hydrogen"], 6, "sc-living"],
  ["Which is NOT a state of matter?", "Energy", ["Solid", "Liquid", "Gas"], 5, "sc-material"],
  ["What protects the Earth from the Sun's harmful rays?", "The atmosphere", ["The Moon", "Clouds only", "The ocean"], 6, "sc-earth"],
  ["A caterpillar turns into a…", "Butterfly", ["Spider", "Bird", "Fish"], 2, "sc-living"],
  ["Which sense do we use to hear?", "Hearing (ears)", ["Sight", "Taste", "Smell"], 1, "sc-living"],
  ["What do we call animals that eat only plants?", "Herbivores", ["Carnivores", "Omnivores", "Predators"], 5, "sc-living"],
  ["Which is a source of renewable energy?", "Wind", ["Coal", "Oil", "Petrol"], 6, "sc-physical"],
  ["What tool measures temperature?", "Thermometer", ["Ruler", "Scale", "Clock"], 4, "sc-nos"],
  ["A scientist's testable idea is called a…", "Hypothesis", ["Fact", "Guess", "Rule"], 5, "sc-nos"],
  ["To make a test fair, you change…", "One thing at a time", ["Everything", "Nothing", "The result"], 6, "sc-nos"],
];

let n = 0;
const bank = FACTS.map(([q, a, d, year, strand]) => {
  const opts = shuffle([a, ...d]);
  const diff = Math.min(5, Math.max(1, Math.ceil(year / 2)));
  return {
    id: `sb-${String(++n).padStart(3, "0")}`, subject: "science", strandId: strand, year, level: yearToLevel(year),
    ageBand: yearToAgeBand(year), difficulty: diff, type: "multiple-choice", prompt: q,
    options: opts, answer: opts.indexOf(a), explanation: `Correct answer: ${a}.`, xp: 8 + diff * 2, coins: 2 + diff, objectiveIds: [],
  };
});

const out = resolve("src/data/science-bank.json");
writeFileSync(out, JSON.stringify(bank, null, 1), "utf8");
console.log(`✓ Generated ${bank.length} Science items → ${out}`);

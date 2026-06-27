#!/usr/bin/env node
/**
 * Generate a curated, CORRECT English bank (synonyms, antonyms, rhymes,
 * plurals, spelling) through the content pipeline. Output: src/data/english-bank.json
 *
 * Usage: node scripts/content/generate-english-bank.mjs
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const yearToLevel = (y) => Math.min(5, Math.max(1, Math.ceil(y / 2)));
const yearToAgeBand = (y) => (y <= 3 ? "5-7" : y <= 6 ? "8-10" : "11-14");
const shuffle = (a) => [...a].sort(() => Math.random() - 0.5);

const DISTRACT = ["table", "river", "stone", "green", "apple", "cloud", "music", "window", "garden", "pencil", "silver", "ocean", "forest", "planet", "bottle", "ladder"];

const SYN = [["happy", "cheerful"], ["big", "large"], ["small", "tiny"], ["fast", "quick"], ["sad", "unhappy"], ["smart", "clever"], ["scared", "afraid"], ["pretty", "beautiful"], ["angry", "cross"], ["begin", "start"], ["shout", "yell"], ["jump", "leap"], ["cold", "chilly"], ["brave", "bold"], ["tired", "sleepy"]];
const ANT = [["big", "small"], ["hot", "cold"], ["up", "down"], ["happy", "sad"], ["fast", "slow"], ["day", "night"], ["open", "closed"], ["full", "empty"], ["light", "dark"], ["wet", "dry"], ["loud", "quiet"], ["hard", "soft"], ["new", "old"], ["high", "low"]];
const RHYME = [["cat", "hat"], ["dog", "log"], ["sun", "fun"], ["tree", "bee"], ["star", "car"], ["cake", "lake"], ["king", "ring"], ["snow", "glow"], ["boat", "goat"], ["bug", "rug"]];
const PLURAL = [["baby", "babies"], ["child", "children"], ["mouse", "mice"], ["foot", "feet"], ["leaf", "leaves"], ["box", "boxes"], ["city", "cities"], ["tooth", "teeth"], ["man", "men"], ["wolf", "wolves"]];
const SPELL = [["because", "becuase"], ["friend", "freind"], ["beautiful", "beutiful"], ["necessary", "neccessary"], ["separate", "seperate"], ["definitely", "definately"], ["received", "recieved"], ["weird", "wierd"]];

let n = 0;
const item = (year, strandId, prompt, correct, distractors, explanation) => {
  const opts = shuffle([correct, ...distractors]);
  const level = yearToLevel(year);
  const diff = Math.min(5, Math.max(1, Math.ceil(year / 2)));
  return {
    id: `eb-${String(++n).padStart(3, "0")}`, subject: "english", strandId, year, level,
    ageBand: yearToAgeBand(year), difficulty: diff, type: "multiple-choice", prompt,
    options: opts, answer: opts.indexOf(correct), explanation, xp: 8 + diff * 2, coins: 2 + diff, objectiveIds: [],
  };
};
const picks = (pool, exclude, k) => shuffle(pool.filter((x) => !exclude.includes(x))).slice(0, k);

const bank = [];
for (const [a, b] of SYN) bank.push(item(4, "en-reading", `Which word means the same as “${a}”?`, b, picks(DISTRACT, [b], 3), `“${b}” is a synonym of “${a}”.`));
for (const [a, b] of ANT) bank.push(item(3, "en-reading", `Which word is the opposite of “${a}”?`, b, picks(DISTRACT, [b], 3), `“${b}” is the antonym of “${a}”.`));
for (const [a, b] of RHYME) bank.push(item(1, "en-reading", `Which word rhymes with “${a}”?`, b, picks(DISTRACT, [b], 3), `“${b}” rhymes with “${a}”.`));
for (const [a, b] of PLURAL) bank.push(item(3, "en-writing", `What is the plural of “${a}”?`, b, picks([...PLURAL.map((p) => p[1]), a + "s"], [b], 3), `The plural of “${a}” is “${b}”.`));
for (const [c] of SPELL) {
  const wrongs = picks(SPELL.map((s) => s[1]), [], 3);
  bank.push(item(5, "en-writing", "Choose the correctly spelled word:", c, wrongs, `“${c}” is the correct spelling.`));
}

const out = resolve("src/data/english-bank.json");
writeFileSync(out, JSON.stringify(bank, null, 1), "utf8");
console.log(`✓ Generated ${bank.length} English items → ${out}`);

#!/usr/bin/env node
/**
 * Generate a Maths Years 1–8 starter bank through the content pipeline (#03).
 * Programmatic generation guarantees every answer is correct.
 *
 * Output: src/data/maths-bank.json (array of Question objects, untagged status).
 * From there: imported by the demo seed, importable in the Content Studio, and
 * convertible to SQL via scripts/content/generate-seed.mjs.
 *
 * Usage:  node scripts/content/generate-maths-bank.mjs [perYear]
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const PER_YEAR = Number(process.argv[2] || 40);
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = (arr) => arr[rand(0, arr.length - 1)];

const yearToLevel = (y) => Math.min(5, Math.max(1, Math.ceil(y / 2)));
const yearToAgeBand = (y) => (y <= 3 ? "5-7" : y <= 6 ? "8-10" : "11-14");
const objForYear = {
  1: ["MA-N-Y1-01"], 2: ["MA-N-Y2-01"], 3: ["MA-N-Y3-01"], 4: ["MA-N-Y4-01"],
  5: ["MA-N-Y5-01"], 6: ["MA-N-Y6-01"], 7: [], 8: [],
};

function distractors(correct) {
  const set = new Set();
  for (const d of [1, -1, 2, -2, 10, -10, correct, 3, -3]) {
    const c = correct + (d === correct ? 1 : d);
    if (c !== correct && c >= 0) set.add(c);
    if (set.size >= 3) break;
  }
  let k = 3;
  while (set.size < 3) { const c = correct + ++k; if (c !== correct && c >= 0) set.add(c); }
  return [...set].slice(0, 3);
}

/** Build a question for a year. Returns a Question-shaped object. */
function makeItem(year, i) {
  const level = yearToLevel(year);
  const ageBand = yearToAgeBand(year);
  const difficulty = Math.min(5, Math.max(1, Math.ceil(year / 2)));
  const base = {
    id: `mb-y${year}-${String(i).padStart(3, "0")}`,
    subject: "maths", strandId: "ma-number", ageBand, level, year, difficulty,
    objectiveIds: objForYear[year], xp: 8 + difficulty * 2, coins: 2 + difficulty,
  };

  let prompt, correct, asMcq = i % 2 === 0;

  if (year === 1) { const a = rand(1, 9), b = rand(1, 9); prompt = `What is ${a} + ${b}?`; correct = a + b; }
  else if (year === 2) {
    if (i % 3 === 0) { const a = rand(10, 40), b = rand(5, 30); prompt = `What is ${a} + ${b}?`; correct = a + b; }
    else { const a = rand(20, 60), b = rand(1, 19); prompt = `What is ${a} − ${b}?`; correct = a - b; }
  } else if (year === 3) { const t = pick([2, 5, 10]); const a = rand(2, 12); prompt = `What is ${a} × ${t}?`; correct = a * t; }
  else if (year === 4) {
    if (i % 2 === 0) { const a = rand(2, 9), b = rand(2, 9); prompt = `What is ${a} × ${b}?`; correct = a * b; }
    else { const b = rand(2, 9), q = rand(2, 9); prompt = `What is ${b * q} ÷ ${b}?`; correct = q; }
  } else if (year === 5) {
    if (i % 2 === 0) { const f = pick([[2, "1/2"], [4, "1/4"], [5, "1/5"], [10, "1/10"]]); const whole = f[0] * rand(2, 9); prompt = `What is ${f[1]} of ${whole}?`; correct = whole / f[0]; }
    else { const a = rand(11, 25), b = rand(2, 9); prompt = `What is ${a} × ${b}?`; correct = a * b; }
  } else if (year === 6) {
    if (i % 2 === 0) { const p = pick([10, 25, 50]); const whole = pick([20, 40, 60, 80, 100, 200]); prompt = `What is ${p}% of ${whole}?`; correct = Math.round((p / 100) * whole); }
    else { const a = rand(2, 9), b = rand(2, 9); prompt = `What is ${a} × ${b} + ${rand(1, 20)}?`; const add = Number(prompt.match(/\+ (\d+)\?/)[1]); correct = a * b + add; }
  } else if (year === 7) {
    if (i % 2 === 0) { const a = rand(-9, -1), b = rand(2, 12); prompt = `What is ${a} + ${b}?`; correct = a + b; }
    else { const a = rand(2, 9), b = rand(2, 9), c = rand(2, 9); prompt = `Using order of operations, what is ${a} + ${b} × ${c}?`; correct = a + b * c; }
  } else { // year 8
    if (i % 2 === 0) { const x = rand(2, 12), a = rand(1, 9); prompt = `Solve for x:  x + ${a} = ${x + a}`; correct = x; }
    else { const a = rand(2, 9); prompt = `What is ${a}² (${a} squared)?`; correct = a * a; }
  }

  const explanation = `The answer is ${correct}.`;
  if (asMcq && Number.isInteger(correct)) {
    const opts = [correct, ...distractors(correct)].sort(() => Math.random() - 0.5);
    return { ...base, type: "multiple-choice", prompt, options: opts.map(String), answer: opts.indexOf(correct), explanation };
  }
  return { ...base, type: "math-puzzle", prompt, answer: String(correct), explanation };
}

const bank = [];
for (let y = 1; y <= 8; y++) for (let i = 1; i <= PER_YEAR; i++) bank.push(makeItem(y, i));

const out = resolve("src/data/maths-bank.json");
writeFileSync(out, JSON.stringify(bank, null, 1), "utf8");
console.log(`✓ Generated ${bank.length} Maths items (Years 1–8, ${PER_YEAR}/year) → ${out}`);

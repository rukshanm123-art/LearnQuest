import { z } from "zod";
import type { Question } from "@/types";

/** Structural validation + CSV/JSON (de)serialisation for content import/export. */

export const SUBJECT_IDS = ["english", "maths", "science", "social", "tech", "reo"] as const;
export const ACTIVITY_TYPES = [
  "multiple-choice", "drag-and-drop", "sentence-building", "matching",
  "timed-challenge", "reading-comprehension", "math-puzzle", "science-sim",
] as const;
export const AGE_BANDS = ["5-7", "8-10", "11-14"] as const;

export const questionSchema = z.object({
  id: z.string().min(1),
  subject: z.enum(SUBJECT_IDS),
  strandId: z.string().min(1),
  type: z.enum(ACTIVITY_TYPES),
  year: z.number().int().min(1).max(8).optional(),
  level: z.number().int().min(1).max(5),
  ageBand: z.enum(AGE_BANDS),
  difficulty: z.number().int().min(1).max(5),
  prompt: z.string().min(3),
  passage: z.string().optional(),
  options: z.array(z.string()).optional(),
  tokens: z.array(z.string()).optional(),
  answer: z.union([z.number(), z.string()]),
  explanation: z.string().min(3),
  xp: z.number().int().min(0),
  coins: z.number().int().min(0),
  objectiveIds: z.array(z.string()).optional(),
});

export type ParseResult = { items: Question[]; errors: string[] };

const ARRAY_DELIM = "|";
const COLUMNS = [
  "id", "subject", "strandId", "type", "year", "level", "ageBand", "difficulty",
  "prompt", "passage", "options", "tokens", "answer", "explanation", "xp", "coins", "objectiveIds",
] as const;

const isMcq = (t: string) =>
  ["multiple-choice", "reading-comprehension", "science-sim", "timed-challenge", "matching"].includes(t);

// ── JSON ─────────────────────────────────────────────────────
export function parseItemsJson(text: string): ParseResult {
  const errors: string[] = [];
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { items: [], errors: ["File is not valid JSON."] };
  }
  const arr = Array.isArray(raw) ? raw : [raw];
  const items: Question[] = [];
  arr.forEach((r, i) => {
    const res = questionSchema.safeParse(r);
    if (res.success) items.push(res.data as Question);
    else errors.push(`Row ${i + 1}: ${res.error.issues.map((e) => `${e.path.join(".")} ${e.message}`).join("; ")}`);
  });
  return { items, errors };
}

export function toJson(items: Question[]): string {
  return JSON.stringify(items, null, 2);
}

// ── CSV (arrays pipe-delimited; assumes no newlines within fields) ──
function csvEscape(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function toCsv(items: Question[]): string {
  const header = COLUMNS.join(",");
  const rows = items.map((q) =>
    COLUMNS.map((c) => {
      const v = (q as unknown as Record<string, unknown>)[c];
      if (Array.isArray(v)) return csvEscape(v.join(ARRAY_DELIM));
      return csvEscape(v == null ? "" : String(v));
    }).join(","),
  );
  return [header, ...rows].join("\n");
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQ = false;
      else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ",") { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

export function parseItemsCsv(text: string): ParseResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length < 2) return { items: [], errors: ["CSV needs a header row and at least one item."] };
  const cols = splitCsvLine(lines[0]).map((c) => c.trim());
  const errors: string[] = [];
  const items: Question[] = [];

  lines.slice(1).forEach((line, idx) => {
    const cells = splitCsvLine(line);
    const rec: Record<string, unknown> = {};
    cols.forEach((c, i) => (rec[c] = cells[i] ?? ""));
    const type = String(rec.type);
    const obj = {
      id: String(rec.id),
      subject: rec.subject,
      strandId: String(rec.strandId),
      type,
      year: rec.year ? Number(rec.year) : undefined,
      level: Number(rec.level),
      ageBand: rec.ageBand,
      difficulty: Number(rec.difficulty),
      prompt: String(rec.prompt),
      passage: rec.passage ? String(rec.passage) : undefined,
      options: rec.options ? String(rec.options).split(ARRAY_DELIM) : undefined,
      tokens: rec.tokens ? String(rec.tokens).split(ARRAY_DELIM) : undefined,
      answer: isMcq(type) ? Number(rec.answer) : String(rec.answer),
      explanation: String(rec.explanation),
      xp: Number(rec.xp || 10),
      coins: Number(rec.coins || 3),
      objectiveIds: rec.objectiveIds ? String(rec.objectiveIds).split(ARRAY_DELIM) : undefined,
    };
    const res = questionSchema.safeParse(obj);
    if (res.success) items.push(res.data as Question);
    else errors.push(`Row ${idx + 2}: ${res.error.issues.map((e) => `${e.path.join(".")} ${e.message}`).join("; ")}`);
  });
  return { items, errors };
}

/** A ready-to-edit CSV template string. */
export const CSV_TEMPLATE = [
  COLUMNS.join(","),
  `ex-1,maths,ma-number,multiple-choice,3,2,8-10,2,"What is 6 + 7?",,11|12|13|14,,1,"6 plus 7 is 13.",14,4,MA-N-Y3-01`,
].join("\n");

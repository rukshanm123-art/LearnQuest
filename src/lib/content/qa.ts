import type { Question } from "@/types";
import type { QaIssue } from "./types";
import { questionSchema } from "./schema";

/** Automated QA for authored content — runs in the CMS and the import pipeline. */

const MCQ = new Set(["multiple-choice", "reading-comprehension", "science-sim", "timed-challenge", "matching"]);
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

/** Crude readability estimate → approximate school year (1–8). */
export function approxReadingYear(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 1;
  const avgLen = words.reduce((n, w) => n + w.length, 0) / words.length;
  return Math.min(8, Math.max(1, Math.round((avgLen - 2.3) * 1.7)));
}

/** Validate a single item structurally + semantically against the rest of the bank. */
export function qaItem(item: Partial<Question>, all: Question[] = []): QaIssue[] {
  const issues: QaIssue[] = [];
  const add = (level: QaIssue["level"], message: string, field?: string) => issues.push({ level, message, field });

  const res = questionSchema.safeParse(item);
  if (!res.success) {
    for (const e of res.error.issues) add("error", e.message, e.path.join("."));
  }

  const type = item.type;
  if (type && MCQ.has(type)) {
    if (!item.options || item.options.length < 2) add("error", "Needs at least 2 options.", "options");
    else if (typeof item.answer !== "number" || item.answer < 0 || item.answer >= item.options.length)
      add("error", "Answer index is out of range.", "answer");
    else if (new Set(item.options.map(norm)).size !== item.options.length)
      add("warning", "Duplicate options.", "options");
  }
  if (type === "math-puzzle" && typeof item.answer !== "string")
    add("error", "Math-puzzle answer must be text.", "answer");
  if ((type === "sentence-building" || type === "drag-and-drop")) {
    if (!item.tokens || item.tokens.length < 2) add("error", "Needs at least 2 tokens.", "tokens");
    if (typeof item.answer !== "string" || !item.answer) add("error", "Needs a correct answer string.", "answer");
  }
  if (type === "reading-comprehension" && !item.passage)
    add("warning", "Reading comprehension usually needs a passage.", "passage");

  // Curriculum tagging completeness
  if (!item.objectiveIds || item.objectiveIds.length === 0) add("warning", "No curriculum objective tagged.", "objectiveIds");
  if (!item.year) add("warning", "No school year set.", "year");

  // Reading level vs target year
  if (item.year && item.prompt) {
    const ry = approxReadingYear(`${item.prompt} ${item.passage ?? ""}`);
    if (ry > item.year + 2) add("warning", `Reading level (~Y${ry}) looks high for Year ${item.year}.`, "prompt");
  }

  // Duplicate prompt
  if (item.prompt && all.some((o) => o.id !== item.id && norm(o.prompt) === norm(item.prompt!)))
    add("warning", "A very similar prompt already exists.", "prompt");

  return issues;
}

export interface QaReport {
  total: number;
  errors: number;
  warnings: number;
  itemsWithErrors: number;
  clean: number;
}

export function qaReport(items: Question[]): QaReport {
  let errors = 0, warnings = 0, itemsWithErrors = 0, clean = 0;
  for (const it of items) {
    const issues = qaItem(it, items);
    const e = issues.filter((i) => i.level === "error").length;
    const w = issues.filter((i) => i.level === "warning").length;
    errors += e; warnings += w;
    if (e > 0) itemsWithErrors++;
    if (e === 0 && w === 0) clean++;
  }
  return { total: items.length, errors, warnings, itemsWithErrors, clean };
}

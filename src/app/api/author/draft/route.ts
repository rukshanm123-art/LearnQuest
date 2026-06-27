import { NextResponse } from "next/server";
import type { Question } from "@/types";
import { questionSchema } from "@/lib/content/schema";
import { OBJECTIVE_MAP, yearToAgeBand, yearToLevel } from "@/lib/curriculum/objectives";
import { STRANDS_BY_SUBJECT, SUBJECT_MAP } from "@/lib/curriculum/nz-curriculum";
import { activeProvider, generateText } from "@/lib/ai/provider";

export const runtime = "nodejs";

/**
 * POST /api/author/draft
 * Generate DRAFT questions for an objective/subject/year. Uses OpenAI when
 * configured; otherwise a deterministic generator (real maths items + labelled
 * templates for other subjects). Drafts are never auto-published — they land in
 * the CMS for human review (#03).
 */
interface Body {
  subject: Question["subject"];
  year: number;
  count?: number;
  objectiveId?: string;
}

const rand = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
const genId = () => "draft-" + Math.random().toString(36).slice(2, 8);

function strandFor(subject: Question["subject"], objectiveId?: string): string {
  if (objectiveId && OBJECTIVE_MAP[objectiveId]) return OBJECTIVE_MAP[objectiveId].strandId;
  return STRANDS_BY_SUBJECT[subject]?.[0]?.id ?? `${subject}-1`;
}

function fallbackDrafts(b: Body): Question[] {
  const count = Math.min(10, Math.max(1, b.count ?? 5));
  const year = b.year;
  const level = yearToLevel(year);
  const ageBand = yearToAgeBand(year);
  const strandId = strandFor(b.subject, b.objectiveId);
  const difficulty = Math.min(5, Math.max(1, Math.ceil(year / 2))) as 1 | 2 | 3 | 4 | 5;
  const base = {
    subject: b.subject, strandId, year, level, ageBand, difficulty,
    xp: 10 + difficulty * 2, coins: 3 + difficulty,
    objectiveIds: b.objectiveId ? [b.objectiveId] : [],
  };

  const items: Question[] = [];
  for (let i = 0; i < count; i++) {
    if (b.subject === "maths") {
      let prompt: string, ans: number;
      if (year <= 2) { const a = rand(1, 9), c = rand(1, 9); prompt = `What is ${a} + ${c}?`; ans = a + c; }
      else if (year <= 4) { const a = rand(2, 9), c = rand(2, 9); prompt = `What is ${a} × ${c}?`; ans = a * c; }
      else { const whole = [10, 20, 50, 100][rand(0, 3)]; const f = [["1/2", 0.5], ["1/4", 0.25], ["1/5", 0.2], ["10%", 0.1]][rand(0, 3)] as [string, number]; prompt = `What is ${f[0]} of ${whole}?`; ans = Math.round(whole * f[1]); }
      items.push({ ...base, id: genId(), type: "math-puzzle", prompt, answer: String(ans), explanation: `The answer is ${ans}.` });
    } else {
      const subjName = SUBJECT_MAP[b.subject]?.name ?? b.subject;
      items.push({
        ...base, id: genId(), type: "multiple-choice",
        prompt: `[DRAFT] ${subjName} question for Year ${year} — replace this prompt.`,
        options: ["Replace A", "Replace B", "Replace C", "Replace D"], answer: 0,
        explanation: "Draft template — please review, write a real question and correct answer before publishing.",
      });
    }
  }
  return items;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ai: false, items: [], error: "Invalid request." }, { status: 400 });
  }

  if (activeProvider() === "none") {
    return NextResponse.json({ ai: false, items: fallbackDrafts(body) });
  }

  try {
    const obj = body.objectiveId ? OBJECTIVE_MAP[body.objectiveId] : undefined;
    const system =
      'You are an NZ primary curriculum content author. Output ONLY a JSON object {"items":[...]} ' +
      "where each item is {type:'multiple-choice'|'math-puzzle', prompt, options?(string[] for MCQ), answer(number index for MCQ | string for math-puzzle), explanation}. " +
      "Age-appropriate, factually correct, NZ context where natural.";
    const user = `Write ${Math.min(10, body.count ?? 5)} questions for ${body.subject}, Year ${body.year}${obj ? `, objective: ${obj.description}` : ""}.`;

    const content = await generateText({ system, user, json: true, maxTokens: 1200, temperature: 0.7, timeoutMs: 20000 });
    if (!content) throw new Error("no completion");
    const parsed = JSON.parse(content);
    const arr: unknown[] = Array.isArray(parsed) ? parsed : parsed.items ?? parsed.questions ?? [];

    const level = yearToLevel(body.year);
    const ageBand = yearToAgeBand(body.year);
    const strandId = strandFor(body.subject, body.objectiveId);
    const difficulty = Math.min(5, Math.max(1, Math.ceil(body.year / 2)));

    const items: Question[] = [];
    for (const raw of arr) {
      const candidate = {
        ...(raw as object),
        id: genId(), subject: body.subject, strandId, year: body.year, level, ageBand, difficulty,
        xp: 10 + difficulty * 2, coins: 3 + difficulty,
        objectiveIds: body.objectiveId ? [body.objectiveId] : [],
      };
      const v = questionSchema.safeParse(candidate);
      if (v.success) items.push(v.data as Question);
    }
    if (items.length === 0) throw new Error("no valid items");
    return NextResponse.json({ ai: true, items });
  } catch {
    return NextResponse.json({ ai: false, items: fallbackDrafts(body) });
  }
}

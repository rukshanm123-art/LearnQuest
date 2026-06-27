import { NextResponse } from "next/server";
import { activeProvider, generateText } from "@/lib/ai/provider";

export const runtime = "nodejs";

export interface GeneratedAssignment {
  title: string;
  objective: string;
  warmup: string;
  activity: string;
  quiz: { q: string; a: string }[];
  homework: string;
}

/** POST /api/ai/assignment — AI lesson/assignment generator for teachers. */
export async function POST(req: Request) {
  let b: { subject?: string; year?: number; topic?: string; minutes?: number };
  try { b = await req.json(); } catch { return NextResponse.json({ ai: false }, { status: 400 }); }

  const subject = b.subject || "Maths";
  const year = b.year || 5;
  const topic = b.topic || "general practice";
  const minutes = b.minutes || 30;

  const fallback: GeneratedAssignment = {
    title: `${subject} · Year ${year}: ${topic}`,
    objective: `Students can demonstrate understanding of ${topic}.`,
    warmup: `5-minute discussion / recall on ${topic}.`,
    activity: `${minutes - 15}-minute guided practice on ${topic} with worked examples.`,
    quiz: [
      { q: `Explain ${topic} in your own words.`, a: "Teacher to assess." },
      { q: `Solve a problem involving ${topic}.`, a: "Varies." },
    ],
    homework: `Complete a short ${topic} practice set.`,
  };

  if (activeProvider() === "none") return NextResponse.json({ ai: false, assignment: fallback });

  const system =
    "You are an experienced New Zealand primary school teacher. Create a concise, NZC-aligned lesson plan. " +
    'Output ONLY JSON: {"title","objective","warmup","activity","quiz":[{"q","a"}],"homework"}. ' +
    "Age-appropriate, practical, 3–4 quiz items.";
  const user = `Create a ${minutes}-minute ${subject} assignment for Year ${year} on "${topic}".`;

  const content = await generateText({ system, user, json: true, maxTokens: 1500, temperature: 0.7, timeoutMs: 20000 });
  if (!content) return NextResponse.json({ ai: false, assignment: fallback });
  try {
    const j = JSON.parse(content);
    if (!j.title || !Array.isArray(j.quiz)) throw new Error("bad shape");
    return NextResponse.json({ ai: true, assignment: j as GeneratedAssignment });
  } catch {
    return NextResponse.json({ ai: false, assignment: fallback });
  }
}

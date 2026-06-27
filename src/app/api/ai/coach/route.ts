import { NextResponse } from "next/server";
import { activeProvider, generateText } from "@/lib/ai/provider";

export const runtime = "nodejs";

interface CoachReq {
  mode?: "reading" | "answer";
  ageBand?: string;
  target?: string;
  transcript?: string;
  accuracy?: number;
  missed?: string[];
  question?: string;
  passage?: string;
}

/** POST /api/ai/coach — encouraging read-aloud feedback, or judge a spoken answer. */
export async function POST(req: Request) {
  let b: CoachReq;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ ai: false, feedback: "" }, { status: 400 });
  }
  const mode = b.mode ?? "reading";

  if (mode === "reading") {
    const pct = Math.round((b.accuracy ?? 0) * 100);
    const missed = (b.missed ?? []).slice(0, 4);
    const fallback =
      pct >= 90 ? "Fantastic reading! Your words were clear and confident. ⭐"
      : pct >= 60 ? `Great effort! You read most of it well.${missed.length ? ` Practise these words: ${missed.join(", ")}.` : ""}`
      : `Good try! Read it slowly once more${missed.length ? `, focusing on: ${missed.join(", ")}.` : "."}`;
    if (activeProvider() === "none") return NextResponse.json({ ai: false, feedback: fallback });
    const system =
      "You are a warm British primary-school reading coach. One or two short, encouraging sentences for a child who just read a sentence aloud. " +
      "Be specific and kind. If words were missed, gently suggest practising them. No more than 30 words.";
    const user = `The child read aloud with ${pct}% word accuracy.${missed.length ? ` Words they missed: ${missed.join(", ")}.` : ""} Target sentence: "${b.target ?? ""}". Age ${b.ageBand ?? "?"}.`;
    const feedback = await generateText({ system, user, maxTokens: 90, temperature: 0.6, timeoutMs: 9000 });
    return NextResponse.json({ ai: !!feedback, feedback: feedback || fallback });
  }

  // answer mode: judge a spoken comprehension answer
  const fallback = { correct: true, feedback: "Nice thinking! Thanks for explaining your answer." };
  if (activeProvider() === "none") return NextResponse.json({ ai: false, ...fallback });
  const system =
    "You are a kind British primary-school teacher judging a child's SPOKEN answer to a comprehension question. " +
    "Be generous — accept correct ideas even if phrased simply or with speech-to-text errors. " +
    'Return STRICT JSON: {"correct": boolean, "feedback": string}. Feedback is one short, warm sentence.';
  const user =
    `Passage: "${b.passage ?? ""}". Question: "${b.question ?? ""}". The child said: "${b.transcript ?? ""}". Age ${b.ageBand ?? "?"}.`;
  const raw = await generateText({ system, user, maxTokens: 120, temperature: 0.4, json: true, timeoutMs: 9000 });
  if (!raw) return NextResponse.json({ ai: false, ...fallback });
  try {
    const p = JSON.parse(raw);
    return NextResponse.json({ ai: true, correct: !!p.correct, feedback: String(p.feedback || fallback.feedback) });
  } catch {
    return NextResponse.json({ ai: false, ...fallback });
  }
}

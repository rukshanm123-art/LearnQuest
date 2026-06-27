import { NextResponse } from "next/server";
import { activeProvider, generateText } from "@/lib/ai/provider";

export const runtime = "nodejs";

/** POST /api/ai/report — AI weekly progress note for a parent. */
export async function POST(req: Request) {
  let b: {
    childName?: string; ageBand?: string; level?: number; streak?: number; weekXp?: number;
    subjects?: { name: string; accuracy: number; attempts: number }[]; weakAreas?: string[];
  };
  try { b = await req.json(); } catch { return NextResponse.json({ ai: false, report: "" }, { status: 400 }); }

  const name = b.childName || "Your child";
  const subjLine = (b.subjects ?? []).map((s) => `${s.name} ${Math.round(s.accuracy * 100)}% (${s.attempts} qs)`).join(", ") || "no activity yet";
  const fallback =
    `${name} earned ${b.weekXp ?? 0} XP this week and is Level ${b.level ?? 1} with a ${b.streak ?? 0}-day streak. ` +
    `Subjects: ${subjLine}. ${(b.weakAreas ?? []).length ? `Focus next on ${b.weakAreas!.join(", ")}.` : "Keep the daily streak going!"}`;

  if (activeProvider() === "none") return NextResponse.json({ ai: false, report: fallback });

  const system =
    "You are a warm, concise New Zealand primary-education coach writing a weekly progress note to a parent. " +
    "3–4 short sentences, specific and encouraging, plain language. End with ONE concrete suggested next step.";
  const user =
    `Child: ${name}, ages ${b.ageBand ?? "?"}, Level ${b.level ?? 1}, ${b.streak ?? 0}-day streak, ${b.weekXp ?? 0} XP this week. ` +
    `Subject accuracy: ${subjLine}. Weak areas: ${(b.weakAreas ?? []).join(", ") || "none flagged"}.`;

  const report = await generateText({ system, user, maxTokens: 240, temperature: 0.6, timeoutMs: 9000 });
  return NextResponse.json({ ai: !!report, report: report || fallback });
}

import { NextResponse } from "next/server";
import type { TutorRequest, TutorResponse } from "@/types";
import { buildTutorPrompt, fallbackTutor } from "@/lib/ai/tutor";
import { activeProvider, generateText } from "@/lib/ai/provider";

export const runtime = "nodejs";

interface Body extends TutorRequest {
  /** Canonical explanation from the question bank, used by the fallback. */
  explanation: string;
}

/**
 * POST /api/tutor — kid-friendly explanation for an attempt.
 * Uses the configured AI provider (Gemini → OpenAI); degrades to a
 * deterministic fallback on missing key / error / timeout.
 */
export async function POST(req: Request): Promise<NextResponse<TutorResponse>> {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json(
      { ai: false, message: "I couldn't read that question — let's try the next one!" },
      { status: 400 },
    );
  }

  const explanation = body.explanation ?? "";
  if (activeProvider() === "none") {
    return NextResponse.json(fallbackTutor(body, explanation));
  }

  const { system, user } = buildTutorPrompt(body);
  const message = await generateText({ system, user, maxTokens: 160, temperature: 0.7, timeoutMs: 9000 });

  if (!message) return NextResponse.json(fallbackTutor(body, explanation));
  return NextResponse.json({ ai: true, message } satisfies TutorResponse);
}

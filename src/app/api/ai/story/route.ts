import { NextResponse } from "next/server";
import { activeProvider, generateText } from "@/lib/ai/provider";

export const runtime = "nodejs";

interface StoryReq {
  childName?: string;
  ageBand?: "5-7" | "8-10" | "11-14";
  petName?: string;
  theme?: string;
  interest?: string;
}

const LEVEL: Record<string, { desc: string; pages: number; sentence: string }> = {
  "5-7": { desc: "very simple words a 5–7 year old can decode, mostly 1-syllable, present tense", pages: 4, sentence: "3–6 words per sentence, 1–2 sentences per page" },
  "8-10": { desc: "simple-to-moderate vocabulary for an 8–10 year old", pages: 5, sentence: "2–3 short sentences per page" },
  "11-14": { desc: "richer vocabulary and varied sentences for an 11–14 year old", pages: 6, sentence: "3–4 sentences per page" },
};

/** POST /api/ai/story — generate a personalized, reading-level-adapted story. */
export async function POST(req: Request) {
  let b: StoryReq;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ ai: false, error: "bad request" }, { status: 400 });
  }

  const name = (b.childName || "Riley").slice(0, 24);
  const pet = (b.petName || "a friendly dragon").slice(0, 24);
  const theme = (b.theme || "a magical adventure").slice(0, 60);
  const interest = (b.interest || "").slice(0, 40);
  const lvl = LEVEL[b.ageBand ?? "8-10"] ?? LEVEL["8-10"];

  const fallback = {
    title: `${name} and the ${theme}`,
    coverEmoji: "📖",
    pages: [
      `Once upon a time, ${name} set off on ${theme}.`,
      `Along the way, ${name} met ${pet}. They became the best of friends.`,
      `Together they were brave and clever, and they solved every puzzle they found.`,
      `At the end of the day, ${name} went home happy, ready for the next adventure.`,
    ],
    vocab: [
      { word: "brave", meaning: "being strong when something is scary" },
      { word: "clever", meaning: "good at thinking and solving problems" },
      { word: "adventure", meaning: "an exciting journey" },
    ],
  };

  if (activeProvider() === "none") return NextResponse.json({ ai: false, story: fallback });

  const system =
    "You are a delightful children's author for a New Zealand learn-to-read app. " +
    "Write an original, wholesome, encouraging story personalised to the child. " +
    `Reading level: use ${lvl.desc}. ${lvl.sentence}. Exactly ${lvl.pages} pages. ` +
    "Keep it safe and age-appropriate (no violence, no scary endings). " +
    "Return STRICT JSON only: " +
    '{"title": string, "coverEmoji": string (one emoji), "pages": string[], "vocab": [{"word": string, "meaning": string}]}. ' +
    "3–4 vocab words drawn from the story, with kid-friendly meanings.";
  const user =
    `Main character: ${name}. Companion: ${pet}. Theme: ${theme}.` +
    (interest ? ` The child loves ${interest} — weave it in.` : "") +
    ` Make ${name} the hero. Personalise warmly.`;

  const raw = await generateText({ system, user, maxTokens: 1400, temperature: 0.85, json: true, timeoutMs: 15000 });
  if (!raw) return NextResponse.json({ ai: false, story: fallback });

  try {
    const parsed = JSON.parse(raw);
    if (!parsed.title || !Array.isArray(parsed.pages) || !parsed.pages.length) throw new Error("shape");
    return NextResponse.json({
      ai: true,
      story: {
        title: String(parsed.title).slice(0, 80),
        coverEmoji: typeof parsed.coverEmoji === "string" ? parsed.coverEmoji.slice(0, 4) : "📖",
        pages: parsed.pages.slice(0, 8).map((p: unknown) => String(p)),
        vocab: Array.isArray(parsed.vocab)
          ? parsed.vocab.slice(0, 5).map((v: { word?: unknown; meaning?: unknown }) => ({ word: String(v.word ?? ""), meaning: String(v.meaning ?? "") })).filter((v: { word: string }) => v.word)
          : [],
      },
    });
  } catch {
    return NextResponse.json({ ai: false, story: fallback });
  }
}

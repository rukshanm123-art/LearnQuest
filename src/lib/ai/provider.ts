/**
 * Provider-agnostic text generation for server routes.
 *
 * Picks the first configured provider: Gemini → OpenAI → none. Callers always
 * handle a `null` result by degrading to a deterministic fallback, so the app
 * never breaks if a key is missing, rate-limited, or times out.
 */

export type AiProvider = "gemini" | "openai" | "none";

export function activeProvider(): AiProvider {
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "none";
}

interface GenOpts {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
  /** Ask the model for a JSON response. */
  json?: boolean;
  timeoutMs?: number;
}

export async function generateText(opts: GenOpts): Promise<string | null> {
  const provider = activeProvider();
  if (provider === "none") return null;
  const signal = AbortSignal.timeout(opts.timeoutMs ?? 12_000);
  try {
    return provider === "gemini" ? await viaGemini(opts, signal) : await viaOpenAI(opts, signal);
  } catch {
    return null;
  }
}

async function viaGemini(opts: GenOpts, signal: AbortSignal): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY!;
  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: opts.system }] },
        contents: [{ role: "user", parts: [{ text: opts.user }] }],
        generationConfig: {
          temperature: opts.temperature ?? 0.7,
          maxOutputTokens: opts.maxTokens ?? 256,
          // Gemini 2.5 "flash" is a thinking model; disable thinking so tokens
          // go to the answer (faster, cheaper, no empty responses).
          thinkingConfig: { thinkingBudget: 0 },
          ...(opts.json ? { responseMimeType: "application/json" } : {}),
        },
      }),
    },
  );
  if (!res.ok) throw new Error(`gemini ${res.status}`);
  const data = await res.json();
  const text: string =
    data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
  return text.trim() || null;
}

async function viaOpenAI(opts: GenOpts, signal: AbortSignal): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY!;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    signal,
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 256,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`openai ${res.status}`);
  const data = await res.json();
  const text: string = data?.choices?.[0]?.message?.content ?? "";
  return text.trim() || null;
}

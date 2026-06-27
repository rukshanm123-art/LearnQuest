import type { TutorRequest } from "@/types";

/**
 * AI tutor logic, shared by the `/api/tutor` route.
 *
 * Design: the tutor ALWAYS returns a helpful, age-appropriate explanation.
 * When an OpenAI key is configured the route upgrades the answer with a model
 * completion; otherwise the deterministic `fallbackTutor` keeps the experience
 * fully working offline and in CI. Keeping both behind one interface means the
 * UI never has to care which path produced the message.
 */

const AGE_VOICE: Record<TutorRequest["ageBand"], string> = {
  "5-7": "Use very simple words, short sentences, and a warm, playful tone for a 6-year-old.",
  "8-10": "Use clear, encouraging language for a 9-year-old. One short example is great.",
  "11-14": "Use friendly but slightly more advanced language for a 12-year-old, and explain the 'why'.",
};

/** System + user prompt for the OpenAI path. */
export function buildTutorPrompt(req: TutorRequest) {
  const system =
    "You are Tui, a kind and encouraging AI tutor for tamariki (children) in New Zealand. " +
    "Always be positive and never make the child feel bad about a wrong answer. " +
    "Keep replies under 60 words. Avoid jargon. " +
    AGE_VOICE[req.ageBand];

  const user = req.wasCorrect
    ? `The student answered "${req.studentAnswer}" to: "${req.questionPrompt}" — that's CORRECT. Celebrate briefly and add one memorable tip so it sticks.`
    : `The student answered "${req.studentAnswer}" to: "${req.questionPrompt}". The correct answer is "${req.correctAnswer}". Gently explain why, without just repeating the answer first.`;

  return { system, user };
}

/** Deterministic, dependency-free tutor used when OpenAI is not configured. */
export function fallbackTutor(req: TutorRequest, explanation: string) {
  if (req.wasCorrect) {
    const cheers = ["Ka pai!", "Tau kē!", "Nailed it!", "Mean!", "Superb!"];
    const cheer = cheers[req.questionPrompt.length % cheers.length];
    return {
      ai: false,
      message: `${cheer} 🎉 ${explanation}`,
    };
  }
  return {
    ai: false,
    message: `Good effort — mistakes help our brains grow! 🌱 ${explanation}`,
    hint: `The answer is “${req.correctAnswer}”. Want to try a similar one?`,
  };
}

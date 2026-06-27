"use client";

/**
 * Thin wrapper over the Web Speech API SpeechRecognition (browser STT, free).
 * Powers the AI Reading Coach + voice-answer quizzes. Chrome/Edge support it;
 * elsewhere `isListeningSupported()` is false and the UI offers a typed fallback.
 */

interface RecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
}
type RecognitionCtor = new () => RecognitionLike;

function ctor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isListeningSupported(): boolean {
  return ctor() !== null;
}

let active: RecognitionLike | null = null;

export function startListening(opts: {
  onResult: (transcript: string) => void;
  onError?: (err: string) => void;
  onEnd?: () => void;
}): boolean {
  const C = ctor();
  if (!C) {
    opts.onError?.("unsupported");
    return false;
  }
  stopListening();
  const rec = new C();
  rec.lang = "en-GB";
  rec.continuous = false;
  rec.interimResults = true;
  rec.maxAlternatives = 1;
  rec.onresult = (e) => {
    let t = "";
    for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
    opts.onResult(t);
  };
  rec.onerror = (e) => opts.onError?.(e.error ?? "error");
  rec.onend = () => {
    active = null;
    opts.onEnd?.();
  };
  active = rec;
  rec.start();
  return true;
}

export function stopListening() {
  try {
    active?.stop();
  } catch {
    /* ignore */
  }
}

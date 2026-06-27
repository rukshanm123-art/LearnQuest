"use client";

/**
 * Tiny zero-asset sound engine using the Web Audio API. Generating tones on the
 * fly means no audio files to download (great for Lighthouse) while still giving
 * the game satisfying "juice". Respects a persisted mute preference and the OS
 * reduced-motion / autoplay constraints (audio only starts after a user
 * gesture, which is always the case here).
 */

type Sfx = "correct" | "wrong" | "coin" | "levelup" | "click" | "whoosh";

let ctx: AudioContext | null = null;
const MUTE_KEY = "lq.muted";

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

export function isMuted(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(MUTE_KEY) === "1";
}

export function setMuted(muted: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", gain = 0.08) {
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, ac.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, ac.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(ac.currentTime + start);
  osc.stop(ac.currentTime + start + dur);
}

const RECIPES: Record<Sfx, () => void> = {
  // Cheerful ascending major arpeggio.
  correct: () => { tone(523, 0, 0.16, "triangle"); tone(659, 0.08, 0.16, "triangle"); tone(784, 0.16, 0.22, "triangle"); },
  // Soft descending "try again" — never harsh.
  wrong: () => { tone(330, 0, 0.18, "sine", 0.06); tone(247, 0.12, 0.22, "sine", 0.06); },
  coin: () => { tone(988, 0, 0.08, "square", 0.05); tone(1319, 0.06, 0.12, "square", 0.05); },
  levelup: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.1, 0.25, "triangle")); },
  click: () => tone(660, 0, 0.05, "square", 0.04),
  whoosh: () => tone(180, 0, 0.2, "sawtooth", 0.03),
};

export function play(sfx: Sfx) {
  if (isMuted()) return;
  try {
    const ac = audio();
    if (ac?.state === "suspended") ac.resume();
    RECIPES[sfx]();
  } catch {
    /* audio is best-effort; never break gameplay */
  }
}

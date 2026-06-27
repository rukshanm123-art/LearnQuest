"use client";

import { useEffect, useState } from "react";

/**
 * Voice narration (read-aloud) via the Web Speech API — free, on-device TTS.
 * Essential for ages 5–7 / pre-readers (the big gap vs Reading Eggs). Prompts,
 * lesson teaching and feedback can all be spoken. Can later be swapped for
 * recorded / higher-quality AI voices behind the same `speak()` interface.
 */

const LS_KEY = "lq-narration";
let enabled = true;
let preferred: SpeechSynthesisVoice | null = null;
const listeners = new Set<(on: boolean) => void>();

function supported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

// Known good British FEMALE voices across macOS / Chrome / Edge / Windows.
const BRITISH_FEMALE = /(google uk english female|sonia|libby|hazel|kate|serena|stephanie|martha|amelia|charlotte|fiona|narrator.*\(.*united kingdom)/i;
const FEMALE_HINT = /female|woman|samantha|karen|moira|tessa|victoria|zira|aria/i;
const MALE_HINT = /\b(male|man|daniel|george|arthur|oliver|ryan|james|guy|david|mark|fred)\b/i;

// Pick a warm British LADY voice (en-GB female), falling back gracefully.
function refreshVoice() {
  if (!supported()) return;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return;
  const score = (v: SpeechSynthesisVoice) => {
    let s = 0;
    const lang = v.lang.toLowerCase();
    if (lang.startsWith("en-gb")) s += 8; // British accent is the priority
    else if (lang.startsWith("en-au")) s += 3;
    else if (lang.startsWith("en-nz")) s += 3;
    else if (lang.startsWith("en")) s += 1;
    if (BRITISH_FEMALE.test(v.name)) s += 6;
    if (FEMALE_HINT.test(v.name)) s += 3;
    if (/natural|neural|premium|enhanced/i.test(v.name)) s += 1; // higher quality voices
    if (MALE_HINT.test(v.name)) s -= 6; // never a man
    return s;
  };
  preferred = [...voices].sort((a, b) => score(b) - score(a))[0] ?? null;
}

if (supported()) {
  try {
    enabled = localStorage.getItem(LS_KEY) !== "off";
  } catch {
    /* ignore */
  }
  refreshVoice();
  window.speechSynthesis.onvoiceschanged = refreshVoice;
}

export function isNarrationOn(): boolean {
  return enabled;
}

export function setNarration(on: boolean) {
  enabled = on;
  try {
    localStorage.setItem(LS_KEY, on ? "on" : "off");
  } catch {
    /* ignore */
  }
  if (!on) stopSpeaking();
  listeners.forEach((l) => l(on));
}

export function stopSpeaking() {
  if (supported()) window.speechSynthesis.cancel();
}

/** Speak text aloud (no-op if narration is off or unsupported). */
export function speak(text: string, opts: { rate?: number; pitch?: number; onEnd?: () => void } = {}) {
  if (!enabled || !supported() || !text) return;
  stopSpeaking();
  if (!preferred) refreshVoice();
  const u = new SpeechSynthesisUtterance(text);
  if (preferred) u.voice = preferred;
  u.rate = opts.rate ?? 0.96;
  u.pitch = opts.pitch ?? 1.08;
  u.volume = 1;
  if (opts.onEnd) u.onend = opts.onEnd;
  window.speechSynthesis.speak(u);
}

/** React hook: current on/off state + a toggle + a guarded speak. */
export function useNarration() {
  const [on, setOn] = useState(enabled);
  useEffect(() => {
    const l = (v: boolean) => setOn(v);
    listeners.add(l);
    setOn(enabled);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return {
    on,
    toggle: () => setNarration(!enabled),
    speak,
    stop: stopSpeaking,
    supported: supported(),
  };
}

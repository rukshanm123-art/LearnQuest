"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mic, Square, Volume2, Star, RefreshCw, Keyboard, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useGameStore, useHydrated } from "@/lib/store/useGameStore";
import { useRequireRole, AuthLoading } from "@/lib/auth/guard";
import { isListeningSupported, startListening, stopListening } from "@/lib/audio/listen";
import { scoreReading, type ReadingScore } from "@/lib/coach/score";
import { speak } from "@/lib/audio/narrate";
import { play } from "@/lib/sound/sfx";
import { burst } from "@/components/game/celebrate";
import { cn } from "@/lib/utils/cn";

const READS: Record<string, string[]> = {
  "5-7": ["The cat sat on the mat.", "I can see a big red bus.", "We like to play in the park.", "My dog can run very fast.", "A green frog hops on a log."],
  "8-10": ["The brave explorer climbed the tall mountain.", "Dolphins are clever animals that live in the ocean.", "The little robot beeped and rolled across the floor.", "Rainbows appear when sunlight shines through the rain."],
  "11-14": ["The ancient castle stood silently against the stormy sky.", "Scientists discovered a new species deep in the rainforest.", "Despite the challenge, she was determined to finish the race."],
};

const COMPREHENSION: Record<string, { passage: string; question: string }[]> = {
  "5-7": [{ passage: "Sam has a red ball. He kicks it to his dog, Spot. Spot runs after the ball and brings it back.", question: "What does Spot run after?" }],
  "8-10": [{ passage: "The kiwi is a small bird from New Zealand. It cannot fly. It sleeps during the day and looks for food at night using its great sense of smell.", question: "When does the kiwi look for food, and how does it find it?" }],
  "11-14": [{ passage: "Maria practised the piano every day for a year. At first it felt impossible, but slowly she improved. By the night of the recital, she played beautifully.", question: "How did Maria become good at the piano?" }],
};

export default function CoachPage() {
  const { ready } = useRequireRole(["student"]);
  return <AppShell>{ready ? <CoachInner /> : <AuthLoading />}</AppShell>;
}

function CoachInner() {
  const hydrated = useHydrated();
  const ageBand = useGameStore((s) => s.ageBand);
  const grant = useGameStore((s) => s.grantReward);
  const [mode, setMode] = useState<"read" | "answer">("read");
  const rewarded = useRef<Set<string>>(new Set());

  if (!hydrated) return <div className="grid min-h-[40vh] place-items-center font-bold text-ink/40">Warming up the coach…</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold">🎤 Reading Coach</h1>
        <p className="font-bold text-ink/50">Read aloud and I&apos;ll score your reading — or answer a question with your voice!</p>
      </div>

      <div className="flex justify-center gap-2">
        {(["read", "answer"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={cn("rounded-2xl px-5 py-2.5 font-display font-bold transition-colors",
              mode === m ? "bg-brand-500 text-white shadow-pop-sm" : "bg-white text-ink/60 hover:bg-black/5")}>
            {m === "read" ? "📖 Read aloud" : "💬 Answer aloud"}
          </button>
        ))}
      </div>

      {mode === "read"
        ? <ReadAloud ageBand={ageBand} grant={grant} rewarded={rewarded.current} />
        : <AnswerAloud ageBand={ageBand} />}
    </div>
  );
}

function MicControls({ onTranscript, onDone }: { onTranscript: (t: string) => void; onDone: (t: string) => void }) {
  const supported = isListeningSupported();
  const [listening, setListening] = useState(false);
  const [typed, setTyped] = useState("");
  const [showType, setShowType] = useState(!supported);
  const latest = useRef("");

  const toggle = () => {
    if (listening) { stopListening(); return; }
    latest.current = "";
    const ok = startListening({
      onResult: (t) => { latest.current = t; onTranscript(t); },
      onEnd: () => { setListening(false); if (latest.current) onDone(latest.current); },
      onError: () => { setListening(false); setShowType(true); },
    });
    if (ok) { setListening(true); play("click"); }
  };

  return (
    <div className="mt-5">
      {supported && (
        <button onClick={toggle}
          className={cn("mx-auto flex items-center gap-2 rounded-full px-6 py-3 font-display font-extrabold text-white shadow-pop transition-all",
            listening ? "bg-streak animate-pulse" : "bg-brand-500 hover:-translate-y-0.5")}>
          {listening ? <><Square className="h-5 w-5" /> Stop &amp; check</> : <><Mic className="h-5 w-5" /> Tap &amp; read aloud</>}
        </button>
      )}
      <div className="mt-3 text-center">
        <button onClick={() => setShowType((v) => !v)} className="inline-flex items-center gap-1 text-xs font-bold text-ink/40 hover:text-ink">
          <Keyboard className="h-3.5 w-3.5" /> {supported ? "or type it instead" : "Type what you read"}
        </button>
      </div>
      {showType && (
        <div className="mt-2 flex gap-2">
          <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Type the words you read…"
            className="w-full rounded-2xl border-2 border-black/10 px-4 py-2.5 font-semibold outline-none focus:border-brand-400" />
          <Button variant="xp" onClick={() => { if (typed.trim()) { onTranscript(typed); onDone(typed); } }}>Check</Button>
        </div>
      )}
    </div>
  );
}

function ReadAloud({ ageBand, grant, rewarded }: { ageBand: string; grant: (r: { coins?: number; xp?: number }) => void; rewarded: Set<string> }) {
  const list = READS[ageBand] ?? READS["8-10"];
  const [idx, setIdx] = useState(0);
  const target = list[idx % list.length];
  const [transcript, setTranscript] = useState("");
  const [score, setScore] = useState<ReadingScore | null>(null);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { speak(`Read this out loud. ${target}`); }, [target]);

  const evaluate = async (spoken: string) => {
    const sc = scoreReading(target, spoken);
    setScore(sc);
    if (sc.stars >= 1) burst();
    if (sc.stars >= 2 && !rewarded.has(target)) { rewarded.add(target); grant({ coins: 6, xp: 5 }); play("coin"); }
    setBusy(true);
    try {
      const r = await fetch("/api/ai/coach", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "reading", target, accuracy: sc.accuracy, missed: sc.words.filter((w) => !w.ok).map((w) => w.w), ageBand }),
      });
      const d = await r.json();
      setFeedback(d.feedback || "");
      speak(d.feedback || "");
    } catch { /* ignore */ } finally { setBusy(false); }
  };

  const reset = (next = false) => {
    if (next) setIdx((i) => i + 1);
    setTranscript(""); setScore(null); setFeedback("");
  };

  return (
    <Card className="text-center">
      <p className="text-xs font-bold uppercase tracking-wide text-ink/40">Read this out loud</p>
      <p className="mt-2 font-display text-2xl font-extrabold leading-snug sm:text-3xl">{target}</p>
      <button onClick={() => speak(target)} className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-brand-600"><Volume2 className="h-4 w-4" /> Hear it</button>

      {!score ? (
        <MicControls onTranscript={setTranscript} onDone={evaluate} />
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5">
          <div className="flex justify-center gap-2">
            {[1, 2, 3].map((n) => <Star key={n} className={cn("h-9 w-9", n <= score.stars ? "fill-coin text-coin" : "fill-black/5 text-black/15")} />)}
          </div>
          <p className="mt-2 font-bold text-ink/60">{Math.round(score.accuracy * 100)}% of words clear</p>
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {score.words.map((w, i) => (
              <span key={i} className={cn("rounded-lg px-2 py-1 text-sm font-bold", w.ok ? "bg-xp/15 text-xp" : "bg-streak/15 text-streak line-through")}>{w.w}</span>
            ))}
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-2xl bg-gem/10 p-3 text-left">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gem text-lg">👩‍🏫</div>
            <p className="text-sm font-semibold text-ink/80">{busy ? "Listening back…" : feedback || "Great reading!"}</p>
          </div>
          {transcript && <p className="mt-2 text-xs font-semibold text-ink/40">I heard: “{transcript}”</p>}
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="outline" onClick={() => reset(false)}><RefreshCw className="h-4 w-4" /> Try again</Button>
            <Button variant="brand" onClick={() => reset(true)}>Next sentence <ArrowRight className="h-4 w-4" /></Button>
          </div>
        </motion.div>
      )}
    </Card>
  );
}

function AnswerAloud({ ageBand }: { ageBand: string }) {
  const list = COMPREHENSION[ageBand] ?? COMPREHENSION["8-10"];
  const [idx, setIdx] = useState(0);
  const item = list[idx % list.length];
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<{ correct: boolean; feedback: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const judge = async (spoken: string) => {
    setBusy(true);
    try {
      const r = await fetch("/api/ai/coach", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "answer", passage: item.passage, question: item.question, transcript: spoken, ageBand }),
      });
      const d = await r.json();
      setResult({ correct: !!d.correct, feedback: d.feedback || "Thanks for answering!" });
      if (d.correct) burst();
      speak(d.feedback || "");
    } catch { setResult({ correct: true, feedback: "Nice thinking!" }); } finally { setBusy(false); }
  };

  return (
    <Card>
      <p className="rounded-2xl bg-brand-50 p-4 text-sm font-semibold leading-relaxed text-ink/80">{item.passage}</p>
      <h2 className="mt-3 font-display text-xl font-extrabold">{item.question}</h2>
      <button onClick={() => speak(item.question)} className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-brand-600"><Volume2 className="h-4 w-4" /> Hear the question</button>

      {!result ? (
        <MicControls onTranscript={setTranscript} onDone={judge} />
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
          <div className={cn("flex items-start gap-2 rounded-2xl p-3", result.correct ? "bg-xp/10" : "bg-coin/10")}>
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gem text-lg">👩‍🏫</div>
            <p className="text-sm font-semibold text-ink/80">{busy ? "Thinking…" : result.feedback}</p>
          </div>
          {transcript && <p className="mt-2 text-xs font-semibold text-ink/40">You said: “{transcript}”</p>}
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setResult(null); setTranscript(""); }}><RefreshCw className="h-4 w-4" /> Try again</Button>
            <Button variant="brand" onClick={() => { setIdx((i) => i + 1); setResult(null); setTranscript(""); }}>Next <ArrowRight className="h-4 w-4" /></Button>
          </div>
        </motion.div>
      )}
    </Card>
  );
}

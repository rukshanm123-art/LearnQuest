"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X, Lightbulb, ArrowRight, RotateCcw, Sparkles, Star, Map } from "lucide-react";

import type { Question, TutorResponse } from "@/types";
import { Button, buttonVariants } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Card } from "@/components/ui/Card";
import { useGameStore, useHydrated, type AnswerOutcome, type LessonOutcome } from "@/lib/store/useGameStore";
import { QUESTION_MAP } from "@/data/questions";
import { QUEST_MAP, dailyChallengeQuestionId } from "@/data/quests";
import { LESSON_MAP, lessonsOf, type Lesson } from "@/data/lessons";
import { speak, stopSpeaking } from "@/lib/audio/narrate";
import { questionsForSubject, questionsForAge } from "@/lib/curriculum/mapping";
import { SUBJECT_MAP } from "@/lib/curriculum/nz-curriculum";
import { useContentStore } from "@/lib/content/store";
import { play } from "@/lib/sound/sfx";
import { burst, bigWin, coinRain } from "@/components/game/celebrate";
import { cn } from "@/lib/utils/cn";
import type { SubjectId } from "@/types";

const MCQ_TYPES = new Set(["multiple-choice", "reading-comprehension", "science-sim", "timed-challenge", "matching"]);

const norm = (s: string) => s.toLowerCase().trim().replace(/\s+/g, " ").replace(/[.!?]+$/, "");

function correctText(q: Question) {
  if (q.options && typeof q.answer === "number") return q.options[q.answer];
  return String(q.answer);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Pick `n` varied questions from a pool: prefer ones not served recently,
 * shuffle for variety, then order easy→hard for a gentle difficulty ramp.
 */
function pickQuestions(pool: Question[], n: number, recent: string[]): Question[] {
  const recentSet = new Set(recent);
  const fresh = pool.filter((q) => !recentSet.has(q.id));
  // Top up from recently-seen ones only if we don't have enough fresh questions.
  const base = fresh.length >= n ? fresh : [...fresh, ...pool.filter((q) => recentSet.has(q.id))];
  return shuffle(base).slice(0, n).sort((a, b) => a.difficulty - b.difficulty);
}

export function QuizGame() {
  const params = useSearchParams();
  const router = useRouter();
  const hydrated = useHydrated();

  const ageBand = useGameStore((s) => s.ageBand);
  const answer = useGameStore((s) => s.answer);
  const completeQuest = useGameStore((s) => s.completeQuest);
  const completeDailyChallenge = useGameStore((s) => s.completeDailyChallenge);
  const completeLesson = useGameStore((s) => s.completeLesson);
  const discoverCritters = useGameStore((s) => s.discoverCritters);

  // Merge author-published items into the gameplay pool (alongside the seed bank).
  const contentItems = useContentStore((s) => s.items);
  const extras = useMemo(
    () => Object.values(contentItems).filter((i) => i.status === "published" && !QUESTION_MAP[i.id]) as Question[],
    [contentItems],
  );
  const lookup = useMemo(() => {
    const m: Record<string, Question> = { ...QUESTION_MAP };
    for (const e of extras) m[e.id] = e;
    return m;
  }, [extras]);

  const questId = params.get("quest");
  const daily = params.get("daily");
  const subject = params.get("subject") as SubjectId | null;
  const lessonId = params.get("lesson");
  const lesson = lessonId ? LESSON_MAP[lessonId] : null;

  const [queue, setQueue] = useState<Question[]>([]);
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<"loading" | "playing" | "feedback" | "done">("loading");

  // Answer inputs
  const [selected, setSelected] = useState<number | null>(null);
  const [mathValue, setMathValue] = useState("");
  const [builtIdx, setBuiltIdx] = useState<number[]>([]);

  const [outcome, setOutcome] = useState<AnswerOutcome | null>(null);
  const [tutor, setTutor] = useState<{ loading: boolean; res: TutorResponse | null }>({ loading: false, res: null });
  const [results, setResults] = useState({ correct: 0, xp: 0, coins: 0 });
  const [sessionAchievements, setSessionAchievements] = useState<string[]>([]);
  const [lessonOutcome, setLessonOutcome] = useState<LessonOutcome | null>(null);
  const [foundCritters, setFoundCritters] = useState<{ emoji: string; name: string }[]>([]);

  const startedAt = useRef<number>(Date.now());

  // Builds a fresh question queue for the current mode (avoids recent repeats).
  const buildQueue = useCallback((): Question[] => {
    if (lesson) {
      const recent = useGameStore.getState().recentQuestionIds;
      let pool = Object.values(lookup).filter((x) => x.subject === lesson.subject && Math.abs(x.difficulty - lesson.difficulty) <= 1);
      if (pool.length < lesson.count) pool = Object.values(lookup).filter((x) => x.subject === lesson.subject);
      return pickQuestions(pool, lesson.count, recent);
    }
    if (questId && QUEST_MAP[questId]) {
      return QUEST_MAP[questId].questionIds.map((id) => lookup[id]).filter(Boolean);
    }
    if (daily) {
      const pool = questionsForAge(ageBand, extras);
      const id = dailyChallengeQuestionId(new Date().toISOString().slice(0, 10), pool.map((x) => x.id));
      return [lookup[id]].filter(Boolean);
    }
    const recent = useGameStore.getState().recentQuestionIds;
    if (subject) {
      let pool = questionsForSubject(subject, ageBand, extras);
      if (pool.length === 0) pool = Object.values(lookup).filter((x) => x.subject === subject);
      return pickQuestions(pool, 6, recent);
    }
    return pickQuestions(questionsForAge(ageBand, extras), 6, recent);
  }, [lesson, questId, daily, subject, ageBand, extras, lookup]);

  // Build the question queue once hydrated.
  useEffect(() => {
    if (!hydrated) return;
    const q = buildQueue();
    setQueue(q);
    setPhase(q.length ? "playing" : "done");
    startedAt.current = Date.now();
  }, [hydrated, buildQueue]);

  const current = queue[i];

  const canSubmit = useMemo(() => {
    if (!current) return false;
    if (MCQ_TYPES.has(current.type)) return selected !== null;
    if (current.type === "math-puzzle") return mathValue.trim() !== "";
    return current.tokens ? builtIdx.length === current.tokens.length : false;
  }, [current, selected, mathValue, builtIdx]);

  // Read each question aloud (the big narration gap vs Reading Eggs).
  useEffect(() => {
    if (phase === "playing" && current) {
      speak(current.passage ? `${current.passage}. ${current.prompt}` : current.prompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, phase]);

  useEffect(() => () => stopSpeaking(), []);

  function resetInputs() {
    setSelected(null);
    setMathValue("");
    setBuiltIdx([]);
    setOutcome(null);
    setTutor({ loading: false, res: null });
  }

  function evaluate(): { correct: boolean; answerText: string } {
    if (MCQ_TYPES.has(current.type)) {
      return { correct: selected === current.answer, answerText: current.options?.[selected ?? -1] ?? "" };
    }
    if (current.type === "math-puzzle") {
      return { correct: norm(mathValue) === norm(String(current.answer)), answerText: mathValue };
    }
    const text = builtIdx.map((idx) => current.tokens![idx]).join(" ");
    return { correct: norm(text) === norm(String(current.answer)), answerText: text };
  }

  async function submit() {
    if (!canSubmit) return;
    const { correct, answerText } = evaluate();
    const timeMs = Date.now() - startedAt.current;
    const out = answer({ question: current, correct, answerText, timeMs });
    setOutcome(out);
    setResults((r) => ({
      correct: r.correct + (correct ? 1 : 0),
      xp: r.xp + out.reward.xp,
      coins: r.coins + out.reward.coins,
    }));
    setPhase("feedback");

    // Juice
    if (correct) { play("correct"); burst(); } else { play("wrong"); }
    if (out.leveledUp) { play("levelup"); bigWin(); }
    if (out.newlyUnlocked.length) {
      bigWin();
      setSessionAchievements((s) => [...new Set([...s, ...out.newlyUnlocked.map((a) => a.id)])]);
    }

    // AI tutor
    setTutor({ loading: true, res: null });
    try {
      const r = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionPrompt: current.prompt,
          studentAnswer: answerText,
          correctAnswer: correctText(current),
          ageBand,
          subject: current.subject,
          wasCorrect: correct,
          explanation: current.explanation,
        }),
      });
      setTutor({ loading: false, res: await r.json() });
    } catch {
      setTutor({ loading: false, res: { ai: false, message: current.explanation } });
    }
  }

  function next() {
    if (i < queue.length - 1) {
      setI((n) => n + 1);
      resetInputs();
      setPhase("playing");
      startedAt.current = Date.now();
      return;
    }
    // Finish
    stopSpeaking();
    const perfect = results.correct === queue.length;
    if (lesson) {
      const pct = queue.length ? results.correct / queue.length : 0;
      const stars = pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : 1; // always ≥1 so kids keep progressing
      const lOut = completeLesson(lesson.id, stars);
      setLessonOutcome(lOut);
      const crit = discoverCritters(1); // earn a Critterpedia critter for finishing
      setFoundCritters(crit.map((c) => ({ emoji: c.emoji, name: c.name })));
      if (lOut.firstClear || lOut.improved) { coinRain(); play("levelup"); } else play("correct");
    } else if (questId) {
      const qOut = completeQuest(questId, { perfect });
      if (qOut) {
        coinRain();
        if (qOut.isBoss || qOut.leveledUp) bigWin();
        play("levelup");
        if (qOut.newlyUnlocked.length)
          setSessionAchievements((s) => [...new Set([...s, ...qOut.newlyUnlocked.map((a) => a.id)])]);
      }
    } else if (daily) {
      if (completeDailyChallenge()) { coinRain(); play("coin"); }
    }
    setPhase("done");
  }

  // ── Render states ────────────────────────────────────────
  if (!hydrated || phase === "loading") {
    return <div className="grid min-h-[60vh] place-items-center text-lg font-bold text-ink/40">Loading your quest…</div>;
  }

  if (queue.length === 0) {
    const subj = subject ? SUBJECT_MAP[subject] : null;
    return (
      <Card className="mx-auto max-w-md text-center">
        <div className="text-6xl">{subj?.icon ?? "🚧"}</div>
        <h1 className="mt-3 font-display text-2xl font-extrabold">
          {subj?.comingSoon ? `${subj.name} is coming soon!` : "No questions here yet"}
        </h1>
        <p className="mt-2 font-semibold text-ink/60">
          We&apos;re busy crafting more adventures for this world. Try another subject in the meantime!
        </p>
        <Link href="/learn" className={buttonVariants({ className: "mt-5" })}>Pick another world</Link>
      </Card>
    );
  }

  if (phase === "done") {
    const nextId = lesson ? (lessonsOf(lesson.worldId).find((l) => l.index === lesson.index + 1)?.id ?? null) : null;
    return (
      <ResultsScreen
        results={results}
        total={queue.length}
        questId={questId}
        lesson={lesson}
        lessonOutcome={lessonOutcome}
        foundCritters={foundCritters}
        sessionAchievements={sessionAchievements}
        onNextLesson={nextId ? () => router.push(`/lesson/${nextId}`) : undefined}
        onJourney={() => router.push("/adventure")}
        onReplay={() => {
          setQueue(buildQueue()); // fresh questions, not the same set again
          setI(0); resetInputs(); setResults({ correct: 0, xp: 0, coins: 0 });
          setSessionAchievements([]); setLessonOutcome(null); setFoundCritters([]); setPhase("playing"); startedAt.current = Date.now();
        }}
        onHome={() => router.push("/dashboard")}
      />
    );
  }

  const subj = SUBJECT_MAP[current.subject];
  const revealed = phase === "feedback";
  const quest = questId ? QUEST_MAP[questId] : null;
  const bossHp = Math.max(0, queue.length - results.correct);

  return (
    <div className="mx-auto max-w-2xl">
      {quest?.isBoss && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-2xl border-2 border-streak/30 bg-gradient-to-r from-streak/10 to-transparent p-3">
          <div className="flex items-center justify-between text-sm font-bold">
            <span className="flex items-center gap-1.5">
              <motion.span className="text-2xl" animate={revealed && outcome?.correct ? { rotate: [0, -12, 12, 0], scale: [1, 1.2, 1] } : undefined}>🐉</motion.span>
              Boss battle
            </span>
            <span className="text-streak">❤️ {bossHp}/{queue.length} HP</span>
          </div>
          <div className="mt-1.5 h-3.5 w-full overflow-hidden rounded-full bg-black/10">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-red-600 to-streak"
              initial={false}
              animate={{ width: `${(bossHp / queue.length) * 100}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }} />
          </div>
        </motion.div>
      )}
      {/* Progress */}
      <div className="mb-4 flex items-center gap-3">
        <Link href="/learn" className="text-sm font-bold text-ink/40 hover:text-ink">✕</Link>
        <ProgressBar
          value={(i + (revealed ? 1 : 0)) / queue.length}
          barClassName="bg-xp"
          ariaLabel={`Question ${i + 1} of ${queue.length}`}
        />
        <span className="shrink-0 text-sm font-bold text-ink/50 tabular-nums">{i + 1}/{queue.length}</span>
      </div>

      <Card className="overflow-hidden">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold" style={{ color: subj.color }}>
          <span>{subj.icon}</span> {subj.name}
          <span className="ml-auto rounded-full bg-black/5 px-2 py-0.5 text-xs text-ink/50">
            {"★".repeat(current.difficulty)}
          </span>
        </div>

        {current.passage && (
          <p className="mb-4 rounded-2xl bg-brand-50 p-4 text-sm font-semibold leading-relaxed text-ink/80">
            {current.passage}
          </p>
        )}

        <h1 className="font-display text-2xl font-extrabold leading-snug">{current.prompt}</h1>

        <div className="mt-5">
          {MCQ_TYPES.has(current.type) && current.options && (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {current.options.map((opt, idx) => {
                const isSel = selected === idx;
                const isCorrect = idx === current.answer;
                const state = !revealed
                  ? isSel ? "selected" : "idle"
                  : isCorrect ? "correct" : isSel ? "wrong" : "idle";
                return (
                  <button
                    key={idx}
                    disabled={revealed}
                    onClick={() => { setSelected(idx); play("click"); }}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border-2 p-4 text-left font-bold transition-all",
                      state === "idle" && "border-black/10 bg-white hover:border-brand-300",
                      state === "selected" && "border-brand-500 bg-brand-50",
                      state === "correct" && "border-xp bg-xp/10 text-xp",
                      state === "wrong" && "border-streak bg-streak/10 text-streak",
                    )}
                  >
                    <span className={cn(
                      "grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm",
                      state === "correct" ? "bg-xp text-white" : state === "wrong" ? "bg-streak text-white" : "bg-black/5",
                    )}>
                      {state === "correct" ? <Check className="h-4 w-4" /> : state === "wrong" ? <X className="h-4 w-4" /> : String.fromCharCode(65 + idx)}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {current.type === "math-puzzle" && (
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              value={mathValue}
              disabled={revealed}
              onChange={(e) => setMathValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Type your answer…"
              className={cn(
                "w-full rounded-2xl border-2 p-4 text-center font-display text-2xl font-extrabold outline-none",
                revealed ? (outcome?.correct ? "border-xp bg-xp/10" : "border-streak bg-streak/10") : "border-black/10 focus:border-brand-400",
              )}
            />
          )}

          {(current.type === "sentence-building" || current.type === "drag-and-drop") && current.tokens && (
            <div>
              <div className="mb-3 flex min-h-[3.5rem] flex-wrap items-center gap-2 rounded-2xl border-2 border-dashed border-black/15 bg-brand-50/40 p-3">
                {builtIdx.length === 0 && <span className="text-sm font-semibold text-ink/30">Tap the words in order…</span>}
                {builtIdx.map((idx, pos) => (
                  <button
                    key={`${idx}-${pos}`}
                    disabled={revealed}
                    onClick={() => setBuiltIdx((b) => b.filter((_, p) => p !== pos))}
                    className="rounded-xl bg-brand-500 px-3 py-1.5 font-bold text-white shadow-pop-sm active:translate-y-0.5"
                  >
                    {current.tokens![idx]}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {current.tokens.map((tok, idx) =>
                  builtIdx.includes(idx) ? null : (
                    <button
                      key={idx}
                      disabled={revealed}
                      onClick={() => { setBuiltIdx((b) => [...b, idx]); play("click"); }}
                      className="rounded-xl border-2 border-black/10 bg-white px-3 py-1.5 font-bold hover:border-brand-300"
                    >
                      {tok}
                    </button>
                  ),
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Feedback / tutor */}
      <AnimatePresence mode="wait">
        {revealed && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-4"
          >
            <div className={cn(
              "flex items-center gap-2 rounded-2xl p-3 font-display font-bold",
              outcome?.correct ? "bg-xp/15 text-xp" : "bg-streak/15 text-streak",
            )}>
              {outcome?.correct ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
              {outcome?.correct ? `Correct!  +${outcome.reward.xp} XP` : "Not quite — let's learn why"}
              {outcome?.reward.bonuses.map((b) => (
                <span key={b} className="ml-1 rounded-full bg-white/60 px-2 py-0.5 text-xs">{b}</span>
              ))}
            </div>

            <div className="mt-3 flex gap-3 rounded-2xl bg-gem/10 p-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gem text-xl">🦜</div>
              <div className="text-sm font-semibold text-ink/80">
                <p className="font-display font-bold text-gem">
                  Tui says {tutor.res?.ai && <span className="text-[10px] font-bold uppercase text-gem/60">· AI</span>}
                </p>
                {tutor.loading ? (
                  <p className="mt-1 animate-pulse text-ink/40">Thinking…</p>
                ) : (
                  <>
                    <p className="mt-1">{tutor.res?.message}</p>
                    {tutor.res?.hint && (
                      <p className="mt-1 flex items-center gap-1 text-ink/60">
                        <Lightbulb className="h-3.5 w-3.5" /> {tutor.res.hint}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action button */}
      <div className="mt-5">
        {!revealed ? (
          <Button size="xl" variant={canSubmit ? "xp" : "outline"} disabled={!canSubmit} onClick={submit} className="w-full">
            Check answer
          </Button>
        ) : (
          <Button size="xl" variant="brand" onClick={next} className="w-full">
            {i < queue.length - 1 ? <>Next <ArrowRight className="h-5 w-5" /></> : <>Finish <Sparkles className="h-5 w-5" /></>}
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Results ─────────────────────────────────────────────────

function ResultsScreen({
  results, total, questId, lesson, lessonOutcome, foundCritters = [], sessionAchievements, onReplay, onHome, onNextLesson, onJourney,
}: {
  results: { correct: number; xp: number; coins: number };
  total: number;
  questId: string | null;
  lesson?: Lesson | null;
  lessonOutcome?: LessonOutcome | null;
  foundCritters?: { emoji: string; name: string }[];
  sessionAchievements: string[];
  onReplay: () => void;
  onHome: () => void;
  onNextLesson?: () => void;
  onJourney?: () => void;
}) {
  const pct = Math.round((results.correct / total) * 100);
  const quest = questId ? QUEST_MAP[questId] : null;
  const perfect = results.correct === total;
  const stars = lessonOutcome?.stars ?? 0;

  return (
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mx-auto max-w-md text-center">
      <Card className="overflow-hidden">
        <motion.div
          className="text-7xl" animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 0.7 }}
        >
          {perfect ? "🏆" : pct >= 60 ? "🎉" : "💪"}
        </motion.div>
        <h1 className="mt-2 font-display text-3xl font-extrabold">
          {lesson ? `${lesson.title} complete!` : perfect ? "Perfect run!" : pct >= 60 ? "Quest complete!" : "Good effort!"}
        </h1>

        {/* Lesson mastery stars */}
        {lesson && (
          <div className="mt-3 flex items-center justify-center gap-2">
            {[1, 2, 3].map((n) => (
              <motion.span key={n} initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.2 + n * 0.15, type: "spring" }}>
                <Star className={cn("h-9 w-9", n <= stars ? "fill-coin text-coin drop-shadow" : "fill-black/5 text-black/15")} />
              </motion.span>
            ))}
          </div>
        )}

        {quest?.isBoss && perfect && (
          <p className="mt-1 font-bold text-gem">⚔️ Boss defeated — Ember the Dragon joined your team! 🐉</p>
        )}

        <div className="mt-5 grid grid-cols-3 gap-2">
          <Stat label="Accuracy" value={`${pct}%`} className="bg-brand-50 text-brand-700" />
          <Stat label="XP earned" value={`+${results.xp}`} className="bg-xp/10 text-xp" />
          <Stat label="Coins" value={`+${results.coins}`} className="bg-coin/15 text-yellow-700" />
        </div>

        {quest && (
          <p className="mt-4 rounded-2xl bg-gem/10 p-3 text-sm font-bold text-gem">
            Quest bonus: +{quest.rewardXp} XP · +{quest.rewardCoins} 🪙
          </p>
        )}

        {lessonOutcome && (lessonOutcome.coins > 0 || lessonOutcome.critterId) && (
          <p className="mt-4 rounded-2xl bg-gem/10 p-3 text-sm font-bold text-gem">
            {lessonOutcome.coins > 0 && <>Lesson bonus: +{lessonOutcome.coins} 🪙 </>}
            {lessonOutcome.critterId && <>· New critter unlocked! 🥚</>}
          </p>
        )}

        {foundCritters.length > 0 && (
          <div className="mt-4 rounded-2xl bg-gem/10 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-gem">New critter discovered!</p>
            <p className="mt-1 font-bold">{foundCritters.map((c) => `${c.emoji} ${c.name}`).join(", ")} joined your Critterpedia!</p>
          </div>
        )}

        {sessionAchievements.length > 0 && (
          <div className="mt-4 rounded-2xl bg-coin/10 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-yellow-700">Achievements unlocked</p>
            <p className="mt-1 font-bold">🏅 {sessionAchievements.length} new badge{sessionAchievements.length > 1 ? "s" : ""}!</p>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2">
          {lesson ? (
            <>
              {onNextLesson
                ? <Button size="lg" variant="brand" onClick={onNextLesson}>Next lesson <ArrowRight className="h-4 w-4" /></Button>
                : <Button size="lg" variant="brand" onClick={onJourney}>World complete! Back to map <Map className="h-4 w-4" /></Button>}
              <Button size="lg" variant="outline" onClick={onJourney}><Map className="h-4 w-4" /> Learning map</Button>
              <Button size="lg" variant="ghost" onClick={onReplay}><RotateCcw className="h-4 w-4" /> Practise again</Button>
            </>
          ) : (
            <>
              <Button size="lg" variant="brand" onClick={onHome}>Back to dashboard</Button>
              <Button size="lg" variant="outline" onClick={onReplay}><RotateCcw className="h-4 w-4" /> Play again</Button>
            </>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("rounded-2xl p-3", className)}>
      <div className="font-display text-xl font-extrabold">{value}</div>
      <div className="text-[11px] font-bold uppercase tracking-wide opacity-70">{label}</div>
    </div>
  );
}

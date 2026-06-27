"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Volume2, ArrowLeft, ArrowRight, Trash2, BookOpen, Wand2, X } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardLabel } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useGameStore, useHydrated } from "@/lib/store/useGameStore";
import { useRequireRole, AuthLoading } from "@/lib/auth/guard";
import { PET_MAP } from "@/data/pets";
import { speak, stopSpeaking, useNarration } from "@/lib/audio/narrate";
import { play } from "@/lib/sound/sfx";
import { bigWin } from "@/components/game/celebrate";
import type { Story } from "@/types";
import { cn } from "@/lib/utils/cn";

const THEMES = [
  { label: "Space mission", emoji: "🚀" },
  { label: "Dinosaur world", emoji: "🦕" },
  { label: "Ocean quest", emoji: "🌊" },
  { label: "Magic forest", emoji: "🌳" },
  { label: "Superhero day", emoji: "🦸" },
  { label: "Football final", emoji: "⚽" },
  { label: "Friendly monsters", emoji: "👾" },
  { label: "A trip to Aotearoa", emoji: "🥝" },
];

export default function LibraryPage() {
  const { ready } = useRequireRole(["student"]);
  return <AppShell>{ready ? <LibraryInner /> : <AuthLoading />}</AppShell>;
}

function LibraryInner() {
  const hydrated = useHydrated();
  const displayName = useGameStore((s) => s.displayName);
  const ageBand = useGameStore((s) => s.ageBand);
  const equippedPetId = useGameStore((s) => s.equippedPetId);
  const stories = useGameStore((s) => s.stories);
  const addStory = useGameStore((s) => s.addStory);
  const removeStory = useGameStore((s) => s.removeStory);

  const [theme, setTheme] = useState(THEMES[0].label);
  const [interest, setInterest] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reading, setReading] = useState<Story | null>(null);

  const petName = (equippedPetId && PET_MAP[equippedPetId]?.name) || "a friendly dragon";

  const create = async () => {
    setBusy(true);
    setError("");
    play("whoosh");
    try {
      const r = await fetch("/api/ai/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childName: displayName, ageBand, petName, theme, interest }),
      });
      const data = await r.json();
      if (!data.story) throw new Error("no story");
      const saved = addStory({ ...data.story, ai: !!data.ai });
      bigWin();
      setReading(saved);
    } catch {
      setError("Couldn't write a story just now — please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (!hydrated) {
    return <div className="grid min-h-[40vh] place-items-center font-bold text-ink/40">Opening the library…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">📚 AI Story Studio</h1>
        <p className="mx-auto mt-1 max-w-lg font-bold text-ink/50">
          Star in your own story! We&apos;ll write one just for <span className="text-brand-600">{displayName}</span>, at the perfect reading level — and read it aloud.
        </p>
      </div>

      {/* Create */}
      <Card className="mx-auto max-w-2xl bg-gradient-to-br from-gem/10 to-brand-50">
        <CardLabel>✨ Create a new story</CardLabel>
        <p className="mt-2 text-sm font-bold text-ink/60">Pick an adventure:</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {THEMES.map((t) => (
            <button
              key={t.label}
              onClick={() => setTheme(t.label)}
              className={cn("rounded-2xl px-3 py-2 text-sm font-bold transition-all",
                theme === t.label ? "bg-brand-500 text-white shadow-pop-sm" : "bg-white text-ink/70 hover:bg-black/5")}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        <label className="mt-4 block">
          <span className="text-sm font-bold text-ink/60">Add something you love (optional)</span>
          <input
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
            placeholder="e.g. my dog Max, robots, the All Blacks…"
            maxLength={40}
            className="mt-1 w-full rounded-2xl border-2 border-black/10 px-4 py-2.5 font-semibold outline-none focus:border-brand-400"
          />
        </label>

        <div className="mt-3 flex items-center gap-2 text-xs font-bold text-ink/50">
          <span className="rounded-full bg-white px-2.5 py-1">⭐ Star: {displayName}</span>
          <span className="rounded-full bg-white px-2.5 py-1">🐾 Sidekick: {petName}</span>
          <span className="rounded-full bg-white px-2.5 py-1">📏 Level: {ageBand}</span>
        </div>

        {error && <p className="mt-3 rounded-2xl bg-streak/10 px-4 py-2 text-sm font-bold text-streak">{error}</p>}

        <Button size="lg" variant="brand" className="mt-4 w-full" onClick={create} disabled={busy}>
          {busy ? <><Sparkles className="h-5 w-5 animate-pulse" /> Writing your story…</> : <><Wand2 className="h-5 w-5" /> Create my story</>}
        </Button>
      </Card>

      {/* Library shelf */}
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-3 font-display text-xl font-extrabold">My library <span className="text-ink/40">({stories.length})</span></h2>
        {stories.length === 0 ? (
          <Card className="border-2 border-dashed border-black/10 bg-transparent text-center">
            <div className="text-5xl">📖</div>
            <p className="mt-2 font-semibold text-ink/50">No stories yet — create your first one above!</p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stories.map((s) => (
              <motion.div key={s.id} whileHover={{ y: -4 }}>
                <Card className="flex h-full flex-col">
                  <button onClick={() => { play("click"); setReading(s); }} className="flex flex-1 flex-col text-left">
                    <div className="grid h-24 place-items-center rounded-2xl bg-gradient-to-br from-brand-100 to-gem/20 text-6xl">{s.coverEmoji}</div>
                    <h3 className="mt-2 font-display text-base font-extrabold leading-tight">{s.title}</h3>
                    <p className="mt-1 text-xs font-bold text-ink/40">{s.pages.length} pages {s.ai ? "· ✨ AI" : ""}</p>
                  </button>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="brand" className="flex-1" onClick={() => { play("click"); setReading(s); }}>
                      <BookOpen className="h-4 w-4" /> Read
                    </Button>
                    <button onClick={() => removeStory(s.id)} aria-label="Delete" className="grid h-9 w-9 place-items-center rounded-xl bg-black/5 text-ink/40 hover:bg-streak/10 hover:text-streak">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {reading && <StoryReader story={reading} onClose={() => { stopSpeaking(); setReading(null); }} />}
      </AnimatePresence>
    </div>
  );
}

function StoryReader({ story, onClose }: { story: Story; onClose: () => void }) {
  const [page, setPage] = useState(0);
  const { on } = useNarration();
  const last = story.pages.length - 1;
  const onVocab = page > last;
  const text = onVocab ? "" : story.pages[page];

  // Read each page aloud as it appears.
  useEffect(() => {
    if (text) speak(text);
    return () => stopSpeaking();
  }, [page, text]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] grid place-items-center bg-ink/80 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }}
        className="relative flex h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-4xl bg-white shadow-card"
      >
        <button onClick={onClose} className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/10 text-ink/60 hover:bg-black/20">
          <X className="h-5 w-5" />
        </button>

        {/* page content */}
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center sm:px-12">
          {onVocab ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full">
              <div className="text-6xl">🎉</div>
              <h2 className="mt-2 font-display text-2xl font-extrabold">The End!</h2>
              <p className="font-bold text-ink/50">Great reading, superstar!</p>
              {story.vocab.length > 0 && (
                <div className="mx-auto mt-5 max-w-md space-y-2 text-left">
                  <p className="text-center text-xs font-bold uppercase tracking-wide text-ink/40">New words you learned</p>
                  {story.vocab.map((v) => (
                    <button key={v.word} onClick={() => speak(`${v.word}. ${v.meaning}`)} className="flex w-full items-center gap-2 rounded-2xl bg-brand-50 p-3 text-left hover:bg-brand-100">
                      <Volume2 className="h-4 w-4 shrink-0 text-brand-500" />
                      <span><span className="font-display font-extrabold text-brand-700">{v.word}</span> <span className="font-semibold text-ink/70">— {v.meaning}</span></span>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <>
              <div className="mb-2 text-5xl">{page === 0 ? story.coverEmoji : "📖"}</div>
              {page === 0 && <h1 className="mb-4 font-display text-2xl font-extrabold sm:text-3xl">{story.title}</h1>}
              <motion.p key={page} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="font-display text-xl font-bold leading-relaxed text-ink sm:text-2xl">
                {text}
              </motion.p>
              <button onClick={() => speak(text)} className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-4 py-2 text-sm font-bold text-brand-600">
                <Volume2 className="h-4 w-4" /> {on ? "Read it again" : "Read aloud"}
              </button>
            </>
          )}
        </div>

        {/* controls */}
        <div className="flex items-center justify-between border-t border-black/5 p-4">
          <Button variant="outline" size="md" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div className="flex items-center gap-1.5">
            {story.pages.map((_, idx) => (
              <span key={idx} className={cn("h-2 w-2 rounded-full", idx === page ? "bg-brand-500" : idx < page ? "bg-brand-300" : "bg-black/10")} />
            ))}
          </div>
          {onVocab ? (
            <Button variant="brand" size="md" onClick={onClose}>Finish ✨</Button>
          ) : (
            <Button variant="brand" size="md" onClick={() => setPage((p) => p + 1)}>
              {page === last ? "Finish" : "Next"} <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

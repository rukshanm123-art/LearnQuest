"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Star, Lock, Play, Swords, Volume2, Check } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Avatar } from "@/components/game/Avatar";
import { useGameStore, useHydrated } from "@/lib/store/useGameStore";
import { useRequireRole, AuthLoading } from "@/lib/auth/guard";
import { JOURNEY_WORLDS, lessonsOf, isLessonUnlocked, isBossUnlocked, nextLessonIn, type JourneyWorld } from "@/data/lessons";
import { BOSSES } from "@/data/bosses";
import { useNarration } from "@/lib/audio/narrate";
import { cn } from "@/lib/utils/cn";

const BOSS_MAP = Object.fromEntries(BOSSES.map((b) => [b.id, b]));

export default function AdventurePage() {
  const { ready } = useRequireRole(["student"]);
  return <AppShell>{ready ? <JourneyInner /> : <AuthLoading />}</AppShell>;
}

function JourneyInner() {
  const hydrated = useHydrated();
  const lessonStars = useGameStore((s) => s.lessonStars);
  const stars = useMemo(() => lessonStars ?? {}, [lessonStars]);

  if (!hydrated) {
    return <div className="grid min-h-[40vh] place-items-center font-bold text-ink/40">Loading your journey…</div>;
  }

  const totalLessons = JOURNEY_WORLDS.reduce((n, w) => n + lessonsOf(w.id).length, 0);
  const earnedStars = Object.values(stars).reduce((a, b) => a + b, 0);
  const maxStars = totalLessons * 3;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">🗺️ Your Learning Journey</h1>
        <p className="mx-auto mt-1 max-w-md font-bold text-ink/50">
          Learn a skill, practise it, earn stars. Master a whole world to face its boss!
        </p>
        <div className="mx-auto mt-3 inline-flex items-center gap-2 rounded-full bg-coin/15 px-4 py-1.5 font-display font-extrabold text-yellow-700">
          <Star className="h-5 w-5 fill-coin text-coin" /> {earnedStars} / {maxStars} stars
        </div>
      </div>

      {JOURNEY_WORLDS.map((world) => (
        <WorldMap key={world.id} world={world} stars={stars} />
      ))}

      <p className="text-center text-xs font-semibold text-ink/40">
        More worlds — Science Cove, Aotearoa Atlas &amp; Te Ao Māori — are coming soon!
      </p>
    </div>
  );
}

function WorldMap({ world, stars }: { world: JourneyWorld; stars: Record<string, number> }) {
  const router = useRouter();
  const { speak } = useNarration();
  const equipped = useGameStore((s) => s.equippedAvatar);

  const lessons = lessonsOf(world.id);
  const current = nextLessonIn(world.id, stars);
  const bossUnlocked = isBossUnlocked(world.id, stars);
  const boss = BOSS_MAP[world.bossId];
  const done = lessons.filter((l) => (stars[l.id] ?? 0) > 0).length;

  return (
    <section
      className="relative overflow-hidden rounded-[2rem] p-5 pb-8 shadow-card sm:p-7"
      style={{ backgroundImage: `linear-gradient(170deg, ${world.bg[0]}, ${world.bg[1]})` }}
    >
      <Scenery subject={world.subject} />

      {/* World header */}
      <div className="relative z-10 mb-6 flex items-center gap-3 text-white">
        <span className="text-5xl drop-shadow-lg">{world.emoji}</span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-2xl font-extrabold drop-shadow">{world.name}</h2>
          <p className="text-sm font-semibold text-white/90 drop-shadow">{world.blurb}</p>
        </div>
        <button
          onClick={() => speak(`${world.name}. ${world.blurb}`)}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/20 text-white backdrop-blur hover:bg-white/30"
          aria-label="Read aloud"
        >
          <Volume2 className="h-5 w-5" />
        </button>
      </div>
      <div className="relative z-10 mb-5 inline-flex items-center gap-2 rounded-full bg-black/25 px-3 py-1 text-sm font-bold text-white backdrop-blur">
        {done}/{lessons.length} lessons started
      </div>

      {/* Winding path of lessons */}
      <div className="relative mx-auto max-w-xl">
        <div className="absolute bottom-12 left-1/2 top-4 w-1.5 -translate-x-1/2 rounded-full bg-white/40" />
        <div className="relative space-y-7">
          {lessons.map((lesson, i) => {
            const s = stars[lesson.id] ?? 0;
            const unlocked = isLessonUnlocked(lesson, stars);
            const isCurrent = current?.id === lesson.id;
            const left = i % 2 === 0;

            const node = (
              <div className="relative">
                {/* avatar token sits on the current lesson */}
                {isCurrent && (
                  <motion.div
                    className="absolute -top-12 left-1/2 z-20 -translate-x-1/2"
                    animate={{ y: [0, -5, 0] }} transition={{ duration: 1.6, repeat: Infinity }}
                  >
                    <Avatar parts={equipped} size="sm" />
                    <div className="mx-auto mt-0.5 h-2 w-2 rotate-45 bg-white" />
                  </motion.div>
                )}
                <motion.button
                  type="button"
                  disabled={!unlocked}
                  onClick={() => unlocked && router.push(`/lesson/${lesson.id}`)}
                  whileHover={unlocked ? { scale: 1.1 } : undefined}
                  whileTap={unlocked ? { scale: 0.94 } : undefined}
                  animate={isCurrent ? { scale: [1, 1.07, 1] } : undefined}
                  transition={isCurrent ? { duration: 1.6, repeat: Infinity } : undefined}
                  className={cn(
                    "z-10 grid h-20 w-20 shrink-0 place-items-center rounded-full text-2xl font-display font-extrabold ring-4 shadow-card",
                    s === 3 ? "bg-coin text-white ring-yellow-200"
                      : s > 0 ? "bg-white text-brand-600 ring-white"
                      : unlocked ? "bg-white/95 text-ink ring-white"
                      : "bg-slate-400/80 text-white/70 ring-white/40",
                  )}
                  aria-label={`Lesson ${lesson.index}: ${lesson.title}`}
                >
                  {!unlocked ? <Lock className="h-7 w-7" /> : s === 3 ? <Check className="h-8 w-8" /> : lesson.index}
                </motion.button>
                {/* stars under node */}
                {unlocked && (
                  <div className="absolute -bottom-4 left-1/2 flex -translate-x-1/2 gap-0.5">
                    {[1, 2, 3].map((n) => (
                      <Star key={n} className={cn("h-3.5 w-3.5", n <= s ? "fill-coin text-coin" : "fill-black/10 text-black/10")} />
                    ))}
                  </div>
                )}
              </div>
            );

            const info = (
              <div className="rounded-2xl bg-white/95 p-3 shadow-card backdrop-blur">
                <p className="font-display text-sm font-extrabold leading-tight text-ink">{lesson.title}</p>
                <p className="text-xs font-bold text-ink/50">{lesson.skill}</p>
                {isCurrent && (
                  <Link href={`/lesson/${lesson.id}`} className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-brand-500 px-2.5 py-1 text-xs font-bold text-white">
                    <Play className="h-3 w-3" /> {s > 0 ? "Continue" : "Start"}
                  </Link>
                )}
              </div>
            );

            return (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-30px" }}
                transition={{ delay: i * 0.04, type: "spring", stiffness: 90 }}
                className="grid grid-cols-[1fr_auto_1fr] items-center gap-3"
              >
                <div className="flex justify-end">{left ? info : null}</div>
                {node}
                <div className="flex justify-start">{!left ? info : null}</div>
              </motion.div>
            );
          })}

          {/* Boss capstone */}
          {boss && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
              className="flex flex-col items-center pt-2"
            >
              <motion.button
                type="button"
                disabled={!bossUnlocked}
                onClick={() => bossUnlocked && router.push("/bosses")}
                whileHover={bossUnlocked ? { scale: 1.06 } : undefined}
                animate={bossUnlocked ? { y: [0, -6, 0] } : undefined}
                transition={{ duration: 2, repeat: Infinity }}
                className={cn(
                  "relative grid h-28 w-28 place-items-center rounded-full text-6xl ring-4 ring-white shadow-[0_10px_30px_-6px_rgba(0,0,0,0.5)]",
                  !bossUnlocked && "grayscale",
                )}
                style={{ background: `radial-gradient(circle at 35% 30%, ${boss.color}, ${boss.color}aa)` }}
              >
                {bossUnlocked ? boss.emoji : <Lock className="h-9 w-9 text-white" />}
              </motion.button>
              <p className="mt-3 rounded-full bg-black/30 px-4 py-1.5 font-display text-sm font-extrabold text-white backdrop-blur">
                {bossUnlocked ? `⚔️ Boss: ${boss.name}` : "🔒 Master every lesson to unlock the boss"}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}

/** Lightweight floating scenery per world theme. */
function Scenery({ subject }: { subject: string }) {
  const items = subject === "english"
    ? ["🌳", "🍃", "🌿", "🦋", "🍄"]
    : ["⛰️", "❄️", "🪨", "☁️", "🦅"];
  const conf = [
    { e: items[0], top: "12%", left: "6%", size: "text-5xl", dur: 7 },
    { e: items[1], top: "30%", left: "88%", size: "text-3xl", dur: 9 },
    { e: items[2], top: "62%", left: "4%", size: "text-4xl", dur: 8 },
    { e: items[3], top: "8%", left: "78%", size: "text-3xl", dur: 6 },
    { e: items[4], top: "78%", left: "90%", size: "text-3xl", dur: 10 },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-50" aria-hidden>
      {conf.map((c, i) => (
        <motion.span
          key={i}
          className={cn("absolute", c.size)}
          style={{ top: c.top, left: c.left }}
          animate={{ y: [0, -10, 0], rotate: [-4, 4, -4] }}
          transition={{ duration: c.dur, repeat: Infinity, ease: "easeInOut" }}
        >
          {c.e}
        </motion.span>
      ))}
    </div>
  );
}

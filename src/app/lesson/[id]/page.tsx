"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Volume2, VolumeX, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useRequireRole, AuthLoading } from "@/lib/auth/guard";
import { LESSON_MAP, JOURNEY_WORLDS } from "@/data/lessons";
import { useNarration } from "@/lib/audio/narrate";
import { cn } from "@/lib/utils/cn";

export default function LessonPage() {
  const { ready } = useRequireRole(["student"]);
  return <AppShell>{ready ? <LessonInner /> : <AuthLoading />}</AppShell>;
}

function LessonInner() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const lesson = LESSON_MAP[id];
  const world = lesson ? JOURNEY_WORLDS.find((w) => w.id === lesson.worldId) : null;
  const { on, toggle, speak, stop, supported } = useNarration();

  const teachText = lesson
    ? `${lesson.teach.heading}. ${lesson.teach.lines.join(" ")} ${lesson.teach.example ? `For example: ${lesson.teach.example}` : ""}`
    : "";

  // Read the lesson aloud on arrival (the teaching step Reading Eggs has, narrated).
  useEffect(() => {
    if (teachText) speak(teachText);
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!lesson || !world) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <div className="text-5xl">🗺️</div>
        <h1 className="mt-3 font-display text-2xl font-extrabold">Lesson not found</h1>
        <Link href="/adventure" className="mt-4 inline-block"><Button>Back to the map</Button></Link>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* breadcrumb */}
      <div className="flex items-center justify-between">
        <Link href="/adventure" className="inline-flex items-center gap-1 text-sm font-bold text-ink/50 hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> {world.name}
        </Link>
        <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-bold text-ink/50">
          Lesson {lesson.index} · {lesson.skill}
        </span>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="overflow-hidden text-center">
          {/* teaching banner */}
          <div className="-m-6 mb-0 bg-gradient-to-br p-8 text-white" style={{ backgroundImage: `linear-gradient(135deg, ${world.bg[0]}, ${world.bg[1]})` }}>
            <motion.div className="text-7xl drop-shadow-lg" animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }}>
              {lesson.teach.emoji}
            </motion.div>
            <p className="mt-2 text-xs font-extrabold uppercase tracking-widest text-white/80">Let&apos;s learn</p>
            <h1 className="font-display text-2xl font-extrabold drop-shadow sm:text-3xl">{lesson.teach.heading}</h1>
          </div>

          <div className="px-1 pt-6">
            {/* narration toggle */}
            {supported && (
              <button
                onClick={() => { if (on) stop(); else speak(teachText); toggle(); }}
                className={cn("mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors",
                  on ? "bg-brand-500 text-white" : "bg-black/5 text-ink/60")}
              >
                {on ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                Read aloud: {on ? "On" : "Off"}
              </button>
            )}

            <div className="space-y-3 text-left">
              {lesson.teach.lines.map((line, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + idx * 0.15 }}
                  className="flex items-start gap-3 rounded-2xl bg-brand-50/60 p-3"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-500 text-sm font-extrabold text-white">{idx + 1}</span>
                  <p className="font-semibold text-ink/80">{line}</p>
                </motion.div>
              ))}
            </div>

            {lesson.teach.example && (
              <div className="mt-4 rounded-2xl border-2 border-dashed border-brand-300 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-ink/40">Example</p>
                <p className="mt-1 font-display text-xl font-extrabold text-brand-700">{lesson.teach.example}</p>
              </div>
            )}

            <button onClick={() => speak(teachText)} className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:underline">
              <Volume2 className="h-4 w-4" /> Listen again
            </button>
          </div>
        </Card>
      </motion.div>

      <Button size="xl" variant="xp" className="w-full" onClick={() => { stop(); router.push(`/play/quiz?lesson=${lesson.id}`); }}>
        Start practice <ArrowRight className="h-5 w-5" />
      </Button>
      <p className="flex items-center justify-center gap-1 text-center text-xs font-semibold text-ink/40">
        <Sparkles className="h-3.5 w-3.5" /> Earn up to 3 stars — get them all to master this lesson!
      </p>
    </div>
  );
}

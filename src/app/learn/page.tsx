"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { buttonVariants } from "@/components/ui/Button";
import { useGameStore, useHydrated } from "@/lib/store/useGameStore";
import { SUBJECTS, WORLDS, STRANDS_BY_SUBJECT } from "@/lib/curriculum/nz-curriculum";
import { levelsForAgeBand } from "@/lib/curriculum/mapping";

export default function LearnPage() {
  return (
    <AppShell>
      <LearnInner />
    </AppShell>
  );
}

function LearnInner() {
  const hydrated = useHydrated();
  const totalXp = useGameStore((s) => s.totalXp);
  const ageBand = useGameStore((s) => s.ageBand);

  const worldFor = (subjectId: string) => WORLDS.find((w) => w.subject === subjectId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold">🌍 Choose your world</h1>
        <p className="font-bold text-ink/50">
          Six adventure worlds, each mapped to the New Zealand Curriculum
          {hydrated && <> · showing Level {levelsForAgeBand(ageBand).join("–")} content for ages {ageBand}</>}.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {SUBJECTS.map((s, idx) => {
          const world = worldFor(s.id);
          const locked = hydrated && world ? totalXp < world.unlockXp : false;
          const strands = STRANDS_BY_SUBJECT[s.id] ?? [];
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="relative overflow-hidden p-0">
                {/* Banner */}
                <div
                  className="flex items-center gap-4 p-6 text-white"
                  style={{ background: `linear-gradient(135deg, ${s.color}, ${s.color}cc)` }}
                >
                  <span className="text-5xl drop-shadow">{world?.emoji ?? s.icon}</span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-white/70">{s.name}</p>
                    <h2 className="font-display text-2xl font-extrabold">{world?.name ?? s.world}</h2>
                    <p className="text-sm font-semibold text-white/85">{s.blurb}</p>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex flex-wrap gap-1.5">
                    {strands.slice(0, 4).map((st) => (
                      <span key={st.id} className="rounded-full bg-black/5 px-2.5 py-1 text-xs font-bold text-ink/60">
                        {st.name}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm font-bold text-ink/40">
                      {strands.length} curriculum strands
                    </span>
                    {s.comingSoon ? (
                      <span className="rounded-full bg-black/5 px-3 py-1.5 text-sm font-bold text-ink/40">Coming soon</span>
                    ) : locked ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-black/5 px-3 py-1.5 text-sm font-bold text-ink/50">
                        <Lock className="h-4 w-4" /> Unlock at {world?.unlockXp} XP
                      </span>
                    ) : (
                      <Link href={`/play/quiz?subject=${s.id}`} className={buttonVariants({ size: "md" })}>
                        Enter world <ArrowRight className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

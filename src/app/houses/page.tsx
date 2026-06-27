"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, Sparkles, Users } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardLabel } from "@/components/ui/Card";
import { Button, buttonVariants } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useGameStore, useHydrated } from "@/lib/store/useGameStore";
import { useRequireRole, AuthLoading } from "@/lib/auth/guard";
import { HOUSES, HOUSE_MAP, assignHouse, houseStandings, HOUSE_CUP_GOAL } from "@/data/houses";
import { cn } from "@/lib/utils/cn";

export default function HousesPage() {
  const { ready } = useRequireRole(["student"]);
  return <AppShell>{ready ? <HousesInner /> : <AuthLoading />}</AppShell>;
}

function HousesInner() {
  const hydrated = useHydrated();
  const houseId = useGameStore((s) => s.houseId);
  const join = useGameStore((s) => s.joinHouse);
  const totalXp = useGameStore((s) => s.totalXp);
  const name = useGameStore((s) => s.displayName);

  if (!hydrated) return <div className="grid min-h-[40vh] place-items-center font-bold text-ink/40">Loading houses…</div>;

  // ── Sorting screen ──────────────────────────────────────
  if (!houseId) {
    const suggested = assignHouse(name);
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="font-display text-3xl font-extrabold">🎩 Choose your House</h1>
          <p className="font-bold text-ink/50">Every quest you complete earns points for your House. Pick your whānau!</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {HOUSES.map((h, i) => (
            <motion.button
              key={h.id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              whileHover={{ y: -4 }}
              onClick={() => join(h.id)}
              className="relative flex items-center gap-4 rounded-4xl p-5 text-left text-white shadow-card"
              style={{ background: `linear-gradient(135deg, ${h.color}, ${h.color}cc)` }}
            >
              <span className="text-5xl drop-shadow">{h.emoji}</span>
              <span className="flex-1">
                <span className="block font-display text-xl font-extrabold">{h.name}</span>
                <span className="block text-sm font-semibold text-white/85">{h.motto}</span>
              </span>
              {h.id === suggested && (
                <span className="absolute right-3 top-3 rounded-full bg-white/25 px-2 py-0.5 text-xs font-bold">✨ Suggested</span>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  // ── House dashboard ─────────────────────────────────────
  const house = HOUSE_MAP[houseId];
  const standings = houseStandings(houseId, totalXp);
  const combined = standings.reduce((n, s) => n + s.points, 0);
  const topPoints = standings[0].points;

  return (
    <div className="space-y-6">
      {/* Your house banner */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="card flex items-center gap-4 overflow-hidden p-6 text-white"
        style={{ background: `linear-gradient(135deg, ${house.color}, ${house.color}bb)` }}>
        <span className="text-6xl drop-shadow">{house.emoji}</span>
        <div className="flex-1">
          <CardLabel className="text-white/70">Your House</CardLabel>
          <h1 className="font-display text-2xl font-extrabold">{house.name}</h1>
          <p className="text-sm font-semibold text-white/85">{house.motto}</p>
        </div>
        <div className="hidden text-right sm:block">
          <div className="font-display text-3xl font-extrabold">{totalXp}</div>
          <div className="text-xs font-bold text-white/70">your points</div>
        </div>
      </motion.div>

      {/* Standings */}
      <Card>
        <div className="flex items-center gap-2"><Trophy className="h-5 w-5 text-coin" /><h2 className="font-display text-lg font-extrabold">House standings</h2></div>
        <div className="mt-3 space-y-2.5">
          {standings.map((s, i) => (
            <div key={s.house.id} className={cn("rounded-2xl p-3", s.mine ? "bg-brand-50 ring-2 ring-brand-200" : "bg-black/[0.02]")}>
              <div className="mb-1 flex items-center gap-2 text-sm font-bold">
                <span className="w-5 text-center text-ink/40">{["🥇", "🥈", "🥉"][i] ?? i + 1}</span>
                <span>{s.house.emoji} {s.house.name}{s.mine && <span className="ml-1 text-xs text-brand-600">· you</span>}</span>
                <span className="ml-auto tabular-nums">{s.points.toLocaleString()}</span>
              </div>
              <ProgressBar value={s.points / topPoints} className="h-2" barClassName="" />
            </div>
          ))}
        </div>
      </Card>

      {/* House Cup cooperative goal */}
      <Card className="bg-gradient-to-br from-coin/15 to-brand-50">
        <div className="flex items-center justify-between">
          <CardLabel>🏆 House Cup · weekly goal</CardLabel>
          <span className="text-xs font-bold text-ink/40">{combined.toLocaleString()} / {HOUSE_CUP_GOAL.toLocaleString()}</span>
        </div>
        <ProgressBar value={combined / HOUSE_CUP_GOAL} className="mt-2 h-3" barClassName="bg-gradient-to-r from-coin to-orange-500" />
        <p className="mt-2 text-sm font-semibold text-ink/60">
          When all Houses together hit the goal, everyone earns a bonus reward. Keep learning to push it over the line!
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/adventure" className={buttonVariants({ size: "md" })}><Sparkles className="h-4 w-4" /> Earn points</Link>
          <Link href="/play/quiz?subject=maths" className={buttonVariants({ variant: "outline", size: "md" })}>Quick quest</Link>
        </div>
      </Card>

      <p className="flex items-center justify-center gap-1.5 text-center text-xs font-semibold text-ink/40">
        <Users className="h-3.5 w-3.5" /> Houses are safe &amp; chat-free — you contribute by learning, together.
      </p>
    </div>
  );
}

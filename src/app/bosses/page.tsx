"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Lightbulb, Zap, Swords, X, Check } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useGameStore, useHydrated, type BossOutcome } from "@/lib/store/useGameStore";
import { useContentStore } from "@/lib/content/store";
import { useRequireRole, AuthLoading } from "@/lib/auth/guard";
import { Boss2D } from "@/components/game/Boss2D";
import { BOSSES, POWER_UPS, type Boss } from "@/data/bosses";
import { QUESTIONS } from "@/data/questions";
import type { Question } from "@/types";
import { play } from "@/lib/sound/sfx";
import { burst, bigWin } from "@/components/game/celebrate";
import { cn } from "@/lib/utils/cn";

const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);

export default function BossesPage() {
  const { ready } = useRequireRole(["student"]);
  return <AppShell>{ready ? <Arena /> : <AuthLoading />}</AppShell>;
}

function Arena() {
  const hydrated = useHydrated();
  const defeated = useGameStore((s) => s.defeatedBossIds);
  const [active, setActive] = useState<Boss | null>(null);
  if (!hydrated) return <div className="grid min-h-[40vh] place-items-center font-bold text-ink/40">Entering the arena…</div>;
  if (active) return <BossBattle boss={active} onExit={() => setActive(null)} />;

  const beaten = defeated.length;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold">⚔️ Boss Arena</h1>
        <p className="font-bold text-ink/50">Answer right to strike. Answer wrong and the boss strikes back!</p>
        <p className="mt-1 text-sm font-bold text-gem">{beaten}/{BOSSES.length} bosses defeated</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BOSSES.map((b, i) => {
          const isDefeated = defeated.includes(b.id);
          return (
          <motion.div key={b.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -4 }}>
            <Card className={cn("relative flex h-full flex-col items-center text-center", isDefeated && "ring-2 ring-xp")}>
              {isDefeated && (
                <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-xp px-2 py-0.5 text-xs font-extrabold text-white shadow-pop-sm">
                  <Check className="h-3 w-3" /> Defeated
                </span>
              )}
              <div className={cn("grid h-24 w-24 place-items-center rounded-3xl shadow-card", isDefeated && "opacity-70 grayscale-[35%]")}
                style={{ background: `radial-gradient(circle at 50% 35%, ${b.color}33, ${b.color}14)` }}>
                <Boss2D bossId={b.id} className="h-20 w-20" />
              </div>
              <h3 className="mt-3 font-display text-lg font-extrabold">{b.name}</h3>
              <p className="flex-1 text-sm font-semibold text-ink/50">{b.tagline}</p>
              <div className="mt-2 flex items-center gap-3 text-xs font-bold text-ink/50">
                <span>❤️ {b.hp} HP</span>
                <span>{isDefeated ? "✓ Reward claimed" : `🏅 +${b.rewardXp} XP · ${b.rewardCoins}🪙`}</span>
              </div>
              <Button className="mt-3 w-full" variant={isDefeated ? "outline" : "brand"} onClick={() => { play("whoosh"); setActive(b); }}>
                <Swords className="h-4 w-4" /> {isDefeated ? "Rematch" : "Battle"}
              </Button>
            </Card>
          </motion.div>
          );
        })}
      </div>

    </div>
  );
}

function BossBattle({ boss, onExit }: { boss: Boss; onExit: () => void }) {
  const items = useContentStore((s) => s.items);
  const coins = useGameStore((s) => s.coins);
  const spendCoins = useGameStore((s) => s.spendCoins);
  const defeatBoss = useGameStore((s) => s.defeatBoss);
  const discoverCritters = useGameStore((s) => s.discoverCritters);
  const [bossOutcome, setBossOutcome] = useState<BossOutcome | null>(null);
  const [critters, setCritters] = useState<{ emoji: string; name: string }[]>([]);

  const order = useMemo(() => {
    const published = Object.values(items).filter((i) => i.status === "published") as Question[];
    const mcq = [...QUESTIONS, ...published].filter((q) => Array.isArray(q.options) && typeof q.answer === "number");
    const subj = mcq.filter((q) => q.subject === boss.subject);
    return shuffle(subj.length >= 4 ? subj : mcq);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boss.id]);

  const [hp, setHp] = useState(boss.hp);
  const [hearts, setHearts] = useState(boss.hearts);
  const [qi, setQi] = useState(0);
  const [phase, setPhase] = useState<"fight" | "win" | "lose">("fight");
  const [eliminated, setEliminated] = useState<number[]>([]);
  const [dbl, setDbl] = useState(false);
  const [hitKey, setHitKey] = useState(0);

  const q = order.length ? order[qi % order.length] : null;

  if (!q) {
    return <Card className="text-center"><p className="font-bold text-ink/50">No questions available for this boss yet.</p>
      <Button className="mt-3" variant="outline" onClick={onExit}>Back to arena</Button></Card>;
  }

  const answer = (idx: number) => {
    if (phase !== "fight") return;
    const correct = idx === q.answer;
    if (correct) {
      const dmg = dbl ? 2 : 1;
      const nhp = Math.max(0, hp - dmg);
      setHp(nhp); play("correct"); burst(); setHitKey((k) => k + 1);
      if (nhp <= 0) {
        // Reward is granted once (first defeat); rematches award nothing.
        const out = defeatBoss(boss.id, { xp: boss.rewardXp, coins: boss.rewardCoins });
        setBossOutcome(out);
        if (out.firstTime) setCritters(discoverCritters(2).map((c) => ({ emoji: c.emoji, name: c.name })));
        setPhase("win");
        play("levelup"); bigWin();
        return;
      }
    } else {
      const nh = hearts - 1;
      setHearts(nh); play("wrong");
      if (nh <= 0) { setPhase("lose"); return; }
    }
    setDbl(false); setEliminated([]); setQi((i) => i + 1);
  };

  const useHint = () => {
    if (eliminated.length || !q.options) return;
    if (!spendCoins(POWER_UPS.hint.cost)) return;
    const wrong = q.options.map((_, i) => i).filter((i) => i !== q.answer);
    setEliminated(shuffle(wrong).slice(0, Math.min(2, wrong.length)));
    play("click");
  };
  const useDouble = () => { if (dbl) return; if (spendCoins(POWER_UPS.double.cost)) { setDbl(true); play("click"); } };

  if (phase !== "fight") {
    const won = phase === "win";
    return (
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mx-auto max-w-md">
        <Card className="text-center">
          <div className="text-7xl">{won ? "🏆" : "💀"}</div>
          <h1 className="mt-2 font-display text-3xl font-extrabold">{won ? `${boss.name} defeated!` : `${boss.name} survived`}</h1>
          {won ? (
            bossOutcome?.firstTime ? (
              <p className="mt-1 font-bold text-xp">+{bossOutcome.xp} XP · +{bossOutcome.coins} 🪙</p>
            ) : (
              <p className="mt-1 font-semibold text-ink/50">Rematch won! 🎉 You already claimed this boss&apos;s reward — replays are just for fun.</p>
            )
          ) : (
            <p className="mt-1 font-semibold text-ink/50">You ran out of hearts — regroup and try again!</p>
          )}
          {won && critters.length > 0 && (
            <p className="mt-2 rounded-2xl bg-gem/10 p-2 text-sm font-bold text-gem">
              🔭 New critters: {critters.map((c) => `${c.emoji} ${c.name}`).join(", ")}!
            </p>
          )}
          <div className="mt-6 flex flex-col gap-2">
            <Button size="lg" onClick={onExit}>Back to arena</Button>
            {!won && <Button size="lg" variant="outline" onClick={() => { setHp(boss.hp); setHearts(boss.hearts); setQi((i) => i + 1); setEliminated([]); setDbl(false); setPhase("fight"); }}>
              <Swords className="h-4 w-4" /> Battle again
            </Button>}
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={onExit} className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-ink/40 hover:text-ink"><X className="h-4 w-4" /> Flee</button>

      {/* Boss — 2D cartoon */}
      <div className="relative overflow-hidden rounded-4xl" style={{ background: `radial-gradient(120% 120% at 50% 35%, ${boss.color}40, #0b1020)` }}>
        <Boss2D bossId={boss.id} hitKey={hitKey} animated className="mx-auto h-64 w-64 py-2 sm:h-72 sm:w-72" />
        {/* name + HP overlay */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-center text-white">
          <p className="font-display text-xl font-extrabold drop-shadow">{boss.name}</p>
          <div className="mx-auto mt-2 h-3.5 max-w-xs overflow-hidden rounded-full bg-black/40 ring-1 ring-white/20">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-red-500 to-streak" initial={false} animate={{ width: `${(hp / boss.hp) * 100}%` }} transition={{ type: "spring", stiffness: 140, damping: 16 }} />
          </div>
          <p className="mt-1 text-xs font-bold text-white/90">{hp}/{boss.hp} HP</p>
        </div>
      </div>

      {/* Player hearts + power-ups */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {Array.from({ length: boss.hearts }).map((_, i) => (
            <Heart key={i} className={cn("h-6 w-6", i < hearts ? "fill-streak text-streak" : "text-black/15")} />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={useHint} disabled={!!eliminated.length || coins < POWER_UPS.hint.cost}
            className="flex items-center gap-1 rounded-xl bg-coin/20 px-2.5 py-1.5 text-xs font-bold text-yellow-700 disabled:opacity-40">
            <Lightbulb className="h-4 w-4" /> {POWER_UPS.hint.cost}🪙
          </button>
          <button onClick={useDouble} disabled={dbl || coins < POWER_UPS.double.cost}
            className={cn("flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold disabled:opacity-40", dbl ? "bg-gem text-white" : "bg-gem/20 text-gem")}>
            <Zap className="h-4 w-4" /> {dbl ? "2×!" : `${POWER_UPS.double.cost}🪙`}
          </button>
        </div>
      </div>

      {/* Question */}
      <Card className="mt-3">
        {q.passage && <p className="mb-3 rounded-2xl bg-brand-50 p-3 text-sm font-semibold text-ink/80">{q.passage}</p>}
        <h2 className="font-display text-xl font-extrabold leading-snug">{q.prompt}</h2>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          <AnimatePresence>
            {q.options!.map((opt, idx) => {
              const gone = eliminated.includes(idx);
              return (
                <button key={idx} disabled={gone} onClick={() => answer(idx)}
                  className={cn("flex items-center gap-3 rounded-2xl border-2 p-4 text-left font-bold transition-all",
                    gone ? "border-black/5 bg-black/5 text-ink/20 line-through" : "border-black/10 bg-white hover:border-brand-300 active:translate-y-0.5")}>
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-black/5 text-sm">{String.fromCharCode(65 + idx)}</span>
                  {opt}
                </button>
              );
            })}
          </AnimatePresence>
        </div>
      </Card>
      <p className="mt-2 text-center text-xs font-semibold text-ink/40">Tip: spend coins on power-ups — but a wrong answer costs a heart!</p>
    </div>
  );
}

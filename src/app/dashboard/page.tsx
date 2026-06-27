"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Flame, Star, Coins, Trophy, Sparkles, Check, ChevronRight, Gift } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardLabel } from "@/components/ui/Card";
import { Button, buttonVariants } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Avatar } from "@/components/game/Avatar";
import { useGameStore, useHydrated } from "@/lib/store/useGameStore";
import { getLevelInfo, todayISO } from "@/lib/gamification/engine";
import { DAILY_LOGIN_REWARDS } from "@/lib/gamification/constants";
import { SUBJECTS, SUBJECT_MAP } from "@/lib/curriculum/nz-curriculum";
import { QUESTS } from "@/data/quests";
import { PET_MAP } from "@/data/pets";
import { ACHIEVEMENTS } from "@/lib/gamification/achievements";
import { ACTIVE_EVENT } from "@/data/events";
import { HOUSE_MAP } from "@/data/houses";
import { coinRain, bigWin } from "@/components/game/celebrate";
import { play } from "@/lib/sound/sfx";
import { useRequireRole, AuthLoading, useCurrentAccount } from "@/lib/auth/guard";
import type { AgeBand } from "@/types";
import { cn } from "@/lib/utils/cn";

const AGE_BANDS: AgeBand[] = ["5-7", "8-10", "11-14"];

export default function DashboardPage() {
  const { ready } = useRequireRole(["student"]);
  return <AppShell>{ready ? <DashboardInner /> : <AuthLoading />}</AppShell>;
}

function DashboardInner() {
  const hydrated = useHydrated();
  const store = useGameStore();
  const account = useCurrentAccount();

  if (!hydrated) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-4xl bg-black/5" />
        ))}
      </div>
    );
  }

  const lvl = getLevelInfo(store.totalXp);
  const pet = store.equippedPetId ? PET_MAP[store.equippedPetId] : null;
  const dailyDone = store.lastDailyChallengeDate === todayISO();

  // Adaptive recommendation: weakest attempted subject, else a friendly default.
  const attempted = SUBJECTS.filter((s) => (store.mastery[s.id]?.attempts ?? 0) > 0);
  const weakest = [...attempted].sort(
    (a, b) => store.mastery[a.id].accuracy - store.mastery[b.id].accuracy,
  )[0];
  const recommend = weakest?.id ?? "maths";

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
        <div className="relative">
          <Avatar parts={store.equippedAvatar} size="lg" photoUrl={account?.avatarUrl} />
          {pet && (
            <div className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full bg-white text-xl shadow-pop-sm" title={pet.name}>
              {pet.emoji}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-extrabold">Kia ora, {store.displayName}! 👋</h1>
          <p className="font-bold text-ink/50">
            Level {lvl.level} · {lvl.title} · Ages {store.ageBand}
          </p>
          {store.houseId && HOUSE_MAP[store.houseId] ? (
            <Link href="/houses" className="mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
              style={{ background: HOUSE_MAP[store.houseId].color }}>
              {HOUSE_MAP[store.houseId].emoji} {HOUSE_MAP[store.houseId].name}
            </Link>
          ) : (
            <Link href="/houses" className="mt-1 inline-block text-xs font-bold text-brand-600">🎩 Choose your House →</Link>
          )}
        </div>
        <div className="ml-auto hidden sm:block">
          <ProfileSettings />
        </div>
      </motion.div>

      <DailyRewardCard />

      {ACTIVE_EVENT && (
        <Link href="/adventure" className="block">
          <motion.div whileHover={{ y: -3 }}
            className={cn("card relative overflow-hidden bg-gradient-to-br p-5 text-white", ACTIVE_EVENT.accent)}>
            <div className="flex items-center gap-4">
              <motion.div className="text-4xl" animate={{ scale: [1, 1.15, 1], rotate: [0, 8, 0] }} transition={{ duration: 3, repeat: Infinity }}>{ACTIVE_EVENT.emoji}</motion.div>
              <div className="min-w-0 flex-1">
                <CardLabel className="text-white/70">Seasonal event · live now</CardLabel>
                <h2 className="font-display text-xl font-extrabold">{ACTIVE_EVENT.name}</h2>
                <p className="text-sm font-semibold text-white/85">{ACTIVE_EVENT.blurb}</p>
              </div>
              <span className="hidden shrink-0 rounded-full bg-white/20 px-3 py-1.5 text-sm font-bold sm:inline">Explore →</span>
            </div>
          </motion.div>
        </Link>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Star className="h-5 w-5" />} color="bg-brand-500" label="Level">
          <div className="font-display text-3xl font-extrabold">{lvl.level}</div>
          <ProgressBar value={lvl.progress} barClassName="bg-brand-500" className="mt-2 h-3" ariaLabel="XP to next level" />
          <p className="mt-1 text-xs font-bold text-ink/40">{lvl.xpIntoLevel}/{lvl.xpForNextLevel} XP to Lv {lvl.level + 1}</p>
        </StatCard>

        <StatCard icon={<Flame className="h-5 w-5" />} color="bg-streak" label="Day streak">
          <div className="font-display text-3xl font-extrabold">{store.streakDays} 🔥</div>
          <p className="mt-2 text-xs font-bold text-ink/40">
            {store.streakDays >= 3 ? "1.5× XP bonus active!" : "Reach 3 days for an XP boost"}
          </p>
        </StatCard>

        <StatCard icon={<Coins className="h-5 w-5" />} color="bg-coin" label="Coins">
          <div className="font-display text-3xl font-extrabold">{store.coins}</div>
          <Link href="/collection" className="mt-2 inline-flex items-center text-xs font-bold text-brand-600">
            Spend in shop <ChevronRight className="h-3 w-3" />
          </Link>
        </StatCard>

        <StatCard icon={<Trophy className="h-5 w-5" />} color="bg-gem" label="Badges">
          <div className="font-display text-3xl font-extrabold">
            {store.unlockedAchievementIds.length}<span className="text-lg text-ink/30">/{ACHIEVEMENTS.length}</span>
          </div>
          <Link href="/collection" className="mt-2 inline-flex items-center text-xs font-bold text-brand-600">
            View collection <ChevronRight className="h-3 w-3" />
          </Link>
        </StatCard>
      </div>

      {/* Daily challenge + recommendation */}
      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div whileHover={{ y: -3 }} className="lg:col-span-2">
          <div className={cn(
            "card relative flex items-center gap-4 overflow-hidden p-6",
            dailyDone ? "opacity-80" : "bg-gradient-to-br from-gem to-brand-500 text-white",
          )}>
            <div className="text-5xl">{dailyDone ? "✅" : "🎯"}</div>
            <div className="flex-1">
              <CardLabel className={dailyDone ? "" : "text-white/70"}>Daily challenge</CardLabel>
              <h2 className="font-display text-xl font-extrabold">
                {dailyDone ? "Done for today — ka pai!" : "Earn 50 coins + a gem"}
              </h2>
              <p className={cn("text-sm font-semibold", dailyDone ? "text-ink/50" : "text-white/85")}>
                {dailyDone ? "Come back tomorrow for a new one." : "One quick question. Keeps your streak alive!"}
              </p>
            </div>
            {!dailyDone && (
              <Link href="/play/quiz?daily=1" className={buttonVariants({ variant: "coin", size: "lg" })}>
                Play
              </Link>
            )}
          </div>
        </motion.div>

        <Link href={`/play/quiz?subject=${recommend}`} className="card group flex flex-col justify-between p-6 transition-transform hover:-translate-y-1">
          <div>
            <CardLabel>Recommended for you</CardLabel>
            <h2 className="mt-1 flex items-center gap-2 font-display text-xl font-extrabold">
              <span className="text-2xl">{SUBJECT_MAP[recommend].icon}</span> {SUBJECT_MAP[recommend].name}
            </h2>
            <p className="text-sm font-semibold text-ink/50">
              {weakest ? "Our AI spotted a chance to level this up." : "A great place to start your journey."}
            </p>
          </div>
          <span className="mt-3 inline-flex items-center gap-1 font-bold text-brand-600">
            Practise now <Sparkles className="h-4 w-4" />
          </span>
        </Link>
      </div>

      {/* Quest map */}
      <section>
        <h2 className="mb-3 font-display text-2xl font-extrabold">🗺️ Your quest map</h2>
        <div className="space-y-3">
          {QUESTS.map((q, idx) => {
            const subj = SUBJECT_MAP[q.subject];
            const done = store.completedQuestIds.includes(q.id);
            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                transition={{ delay: idx * 0.04 }}
              >
                <Link
                  href={`/play/quiz?quest=${q.id}`}
                  className={cn(
                    "card flex items-center gap-4 p-4 transition-transform hover:-translate-y-0.5",
                    q.isBoss && "border-2 border-streak/40 bg-gradient-to-r from-streak/5 to-transparent",
                  )}
                >
                  <div
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl text-white"
                    style={{ background: subj.color }}
                  >
                    {q.isBoss ? "⚔️" : subj.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display font-bold">{q.title}</p>
                    <p className="truncate text-sm font-semibold text-ink/50">{q.description}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    {done ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-xp/15 px-3 py-1 text-sm font-bold text-xp">
                        <Check className="h-4 w-4" /> Done
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-ink/40">+{q.rewardXp} XP · +{q.rewardCoins}🪙</span>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Subject mastery */}
      <section>
        <h2 className="mb-3 font-display text-2xl font-extrabold">📊 Subject mastery</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {SUBJECTS.map((s) => {
            const m = store.mastery[s.id];
            const acc = Math.round((m?.accuracy ?? 0) * 100);
            return (
              <Card key={s.id} className="p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{s.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-bold">{s.name}</p>
                    <p className="text-xs font-bold text-ink/40">
                      {m?.attempts ? `${m.attempts} answered · ${acc}% accuracy` : "Not started yet"}
                    </p>
                  </div>
                  {s.comingSoon ? (
                    <span className="rounded-full bg-black/5 px-2 py-1 text-xs font-bold text-ink/40">Soon</span>
                  ) : (
                    <Link href={`/play/quiz?subject=${s.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                      Practise
                    </Link>
                  )}
                </div>
                <ProgressBar
                  value={(m?.accuracy ?? 0)}
                  className="mt-3 h-2.5"
                  barClassName=""
                  ariaLabel={`${s.name} mastery`}
                />
                {(m?.weakStrands?.length ?? 0) > 0 && (
                  <p className="mt-2 text-xs font-semibold text-streak">
                    Focus area: {m.weakStrands.length} strand{m.weakStrands.length > 1 ? "s" : ""} to revisit
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      </section>

      <div className="sm:hidden">
        <ProfileSettings />
      </div>
    </div>
  );
}

function DailyRewardCard() {
  const claim = useGameStore((s) => s.claimLoginReward);
  const lastDate = useGameStore((s) => s.lastLoginRewardDate);
  const dayNow = useGameStore((s) => s.loginRewardDay);
  const [result, setResult] = useState<{ day: number; coins: number; gems: number } | null>(null);
  const claimedToday = lastDate === todayISO();

  if (claimedToday && !result) return null;

  const onClaim = () => {
    const r = claim();
    if (r) { setResult(r); play("coin"); coinRain(); if (r.gems > 0) bigWin(); }
  };
  const highlightDay = result ? result.day : (dayNow % 7) + 1;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="card bg-gradient-to-br from-coin/15 to-brand-50 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-coin text-2xl shadow-pop-sm">🎁</div>
          <div className="min-w-0 flex-1">
            <CardLabel>Daily login reward</CardLabel>
            <h2 className="font-display text-lg font-extrabold">
              {result ? `+${result.coins} coins${result.gems ? ` · +${result.gems} 💎` : ""} — Day ${result.day}! 🎉` : "Your daily reward is ready!"}
            </h2>
          </div>
          {!result && (
            <Button variant="coin" size="lg" onClick={onClaim}><Gift className="h-5 w-5" /> Claim</Button>
          )}
        </div>
        <div className="mt-3 flex gap-1.5">
          {DAILY_LOGIN_REWARDS.map((r) => (
            <div key={r.day} className={cn("flex flex-1 flex-col items-center rounded-xl py-1.5 text-center transition-all",
              r.day === highlightDay ? "bg-coin/30 ring-2 ring-coin" : r.day < highlightDay ? "bg-white" : "bg-white/50 opacity-60")}>
              <span className="text-[10px] font-bold text-ink/50">Day {r.day}</span>
              <span className="text-sm font-extrabold">{r.gems ? `${r.gems}💎` : `${r.coins}🪙`}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({
  icon, color, label, children,
}: { icon: React.ReactNode; color: string; label: string; children: React.ReactNode }) {
  return (
    <motion.div whileHover={{ y: -3 }}>
      <Card>
        <div className="mb-1 flex items-center gap-2">
          <span className={cn("grid h-8 w-8 place-items-center rounded-xl text-white", color)}>{icon}</span>
          <CardLabel>{label}</CardLabel>
        </div>
        {children}
      </Card>
    </motion.div>
  );
}

function ProfileSettings() {
  const name = useGameStore((s) => s.displayName);
  const ageBand = useGameStore((s) => s.ageBand);
  const setDisplayName = useGameStore((s) => s.setDisplayName);
  const setAgeBand = useGameStore((s) => s.setAgeBand);
  const resetProgress = useGameStore((s) => s.resetProgress);

  return (
    <Card className="p-4">
      <CardLabel>Profile</CardLabel>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          value={name}
          onChange={(e) => setDisplayName(e.target.value)}
          aria-label="Display name"
          className="w-28 rounded-xl border-2 border-black/10 px-3 py-1.5 text-sm font-bold outline-none focus:border-brand-400"
        />
        <div className="flex overflow-hidden rounded-xl border-2 border-black/10">
          {AGE_BANDS.map((b) => (
            <button
              key={b}
              onClick={() => setAgeBand(b)}
              className={cn(
                "px-2.5 py-1.5 text-xs font-bold",
                ageBand === b ? "bg-brand-500 text-white" : "text-ink/50 hover:bg-black/5",
              )}
            >
              {b}
            </button>
          ))}
        </div>
        <Button
          variant="ghost" size="sm"
          onClick={() => { if (confirm("Reset all progress? This can't be undone.")) resetProgress(); }}
          className="text-ink/40"
        >
          Reset
        </Button>
      </div>
    </Card>
  );
}

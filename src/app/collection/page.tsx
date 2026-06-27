"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Coins, Check, Lock } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardLabel } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Avatar } from "@/components/game/Avatar";
import { useGameStore, useHydrated } from "@/lib/store/useGameStore";
import { getLevelInfo } from "@/lib/gamification/engine";
import { EVO_STAGES, petStage, nextStage, stageProgress } from "@/lib/gamification/petEvolution";
import { PETS, RARITY_ORDER } from "@/data/pets";
import { AVATAR_PARTS, AVATAR_SLOTS } from "@/data/avatars";
import { ACHIEVEMENTS } from "@/lib/gamification/achievements";
import { CRITTERS, CRITTER_CATEGORIES, CRITTER_COUNT, VARIANT_BADGE } from "@/data/critters";
import { play } from "@/lib/sound/sfx";
import { coinRain } from "@/components/game/celebrate";
import type { AvatarPart } from "@/types";
import { cn } from "@/lib/utils/cn";

const TABS = ["Avatar", "Pets", "Critterpedia", "Trophy Hall"] as const;
type Tab = (typeof TABS)[number];

const RARITY_RING: Record<string, string> = {
  common: "ring-slate-200", rare: "ring-brand-300", epic: "ring-gem/50", legendary: "ring-coin",
};

/** Radial gradients give each pet a glossy 3D "orb" look (2.5D depth). */
const RARITY_ORB: Record<string, string> = {
  common: "radial-gradient(circle at 32% 28%, #ffffff, #e2e8f0 60%, #cbd5e1)",
  rare: "radial-gradient(circle at 32% 28%, #dbeafe, #93c5fd 60%, #3b82f6)",
  epic: "radial-gradient(circle at 32% 28%, #f5d0fe, #d8b4fe 55%, #a855f7)",
  legendary: "radial-gradient(circle at 32% 28%, #fef3c7, #fcd34d 55%, #f59e0b)",
};

export default function CollectionPage() {
  return (
    <AppShell>
      <CollectionInner />
    </AppShell>
  );
}

function CollectionInner() {
  const hydrated = useHydrated();
  const [tab, setTab] = useState<Tab>("Avatar");
  const coins = useGameStore((s) => s.coins);

  if (!hydrated) {
    return <div className="grid min-h-[40vh] place-items-center font-bold text-ink/40">Loading collection…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-extrabold">🎒 Your collection</h1>
        <span className="flex items-center gap-1.5 rounded-full bg-coin px-4 py-2 font-display font-extrabold text-ink shadow-pop-sm">
          <Coins className="h-5 w-5" /> {coins} coins
        </span>
      </div>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("rounded-2xl px-5 py-2.5 font-display font-bold transition-colors",
              tab === t ? "bg-brand-500 text-white shadow-pop-sm" : "bg-white text-ink/60 hover:bg-black/5")}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Avatar" && <AvatarStudio />}
      {tab === "Pets" && <PetsTab />}
      {tab === "Critterpedia" && <CritterpediaTab />}
      {tab === "Trophy Hall" && <TrophyHall />}
    </div>
  );
}

// ─── Avatar Studio ───────────────────────────────────────────

function AvatarStudio() {
  const coins = useGameStore((s) => s.coins);
  const equipped = useGameStore((s) => s.equippedAvatar);
  const equippedPetId = useGameStore((s) => s.equippedPetId);
  const owned = useGameStore((s) => s.ownedAvatarIds);
  const buy = useGameStore((s) => s.buyAvatarPart);
  const equip = useGameStore((s) => s.equipAvatarPart);
  const [slot, setSlot] = useState<AvatarPart["slot"]>("base");
  const [pendingBuy, setPendingBuy] = useState<AvatarPart | null>(null);

  const meta = AVATAR_SLOTS.find((x) => x.slot === slot)!;
  const parts = AVATAR_PARTS.filter((p) => p.slot === slot);
  const current = equipped[slot] ?? null;

  const choose = (part: AvatarPart) => {
    if (owned.includes(part.id)) {
      equip(slot, meta.optional && current === part.id ? null : part.id);
      play("click");
    } else if (coins >= part.cost) {
      setPendingBuy(part); // confirm before spending coins
      play("click");
    }
  };

  const confirmBuy = () => {
    if (pendingBuy && buy(pendingBuy.id)) { play("coin"); coinRain(); equip(pendingBuy.slot, pendingBuy.id); }
    setPendingBuy(null);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <Card className="self-start text-center">
        <CardLabel>Your avatar</CardLabel>
        <div className="my-4">
          <motion.div
            animate={{ y: [0, -12, 0], rotate: [-1.5, 1.5, -1.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Avatar parts={equipped} ring={false} className="mx-auto h-72 w-56" />
          </motion.div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-coin px-3 py-1 font-display text-sm font-extrabold text-ink">
          <Coins className="h-4 w-4" /> {coins}
        </span>
        <p className="mt-3 text-xs font-bold text-ink/40">
          {equippedPetId ? "Pick a category, then tap to dress up your character!" : "Pick a category to dress up. Equip a pet in the Pets tab too!"}
        </p>
      </Card>

      <div>
        <div className="flex flex-wrap gap-2" role="tablist">
          {AVATAR_SLOTS.map((x) => (
            <button key={x.slot} onClick={() => setSlot(x.slot)}
              className={cn("rounded-xl px-3.5 py-2 text-sm font-bold transition-colors",
                slot === x.slot ? "bg-brand-500 text-white shadow-pop-sm" : "bg-white text-ink/60 hover:bg-black/5")}>
              {x.label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {meta.optional && (
            <button onClick={() => { equip(slot, null); play("click"); }}
              className={cn("flex flex-col items-center justify-center rounded-2xl border-2 p-3",
                !current ? "border-brand-500 bg-brand-50" : "border-black/10 hover:border-brand-300")}>
              <span className="grid h-10 w-10 place-items-center rounded-full bg-black/5 text-lg text-ink/30">∅</span>
              <span className="mt-1 text-xs font-bold">None</span>
            </button>
          )}
          {parts.map((part) => {
            const isOwned = owned.includes(part.id);
            const isEq = current === part.id;
            const afford = coins >= part.cost;
            return (
              <button key={part.id} onClick={() => choose(part)} disabled={!isOwned && !afford}
                className={cn("relative flex flex-col items-center rounded-2xl border-2 p-3 transition-all",
                  isEq ? "border-brand-500 bg-brand-50" : "border-black/10 hover:border-brand-300",
                  !isOwned && !afford && "opacity-50")}>
                {isEq && <Check className="absolute right-1.5 top-1.5 z-10 h-4 w-4 text-brand-600" />}
                <Avatar
                  parts={{ base: equipped.base, [slot]: part.id }}
                  ring={false}
                  className="h-20 w-full rounded-xl shadow-none"
                />
                <span className="mt-1 text-center text-xs font-bold leading-tight">{part.name}</span>
                <span className="mt-0.5 text-[11px] font-bold">
                  {isEq ? (
                    <span className="text-brand-600">Equipped</span>
                  ) : isOwned ? (
                    <span className="text-ink/40">Owned</span>
                  ) : (
                    <span className={cn("inline-flex items-center gap-0.5", afford ? "text-yellow-700" : "text-ink/40")}>
                      {!afford && <Lock className="h-3 w-3" />}{part.cost} 🪙
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirm before buying */}
      {pendingBuy && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/50 p-4" role="dialog" aria-modal>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <Card className="w-full max-w-xs text-center">
              <div className="my-1">
                <Avatar parts={{ base: equipped.base, [pendingBuy.slot]: pendingBuy.id }} ring={false} className="mx-auto h-40 w-32" />
              </div>
              <h3 className="font-display text-lg font-extrabold">Buy {pendingBuy.name}?</h3>
              <p className="mt-1 text-sm font-bold text-ink/50">
                It costs <span className="text-yellow-700">{pendingBuy.cost} 🪙</span> · you have {coins}
              </p>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setPendingBuy(null); play("click"); }}>Cancel</Button>
                <Button variant="coin" className="flex-1" onClick={confirmBuy}>Buy &amp; wear</Button>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ─── Pets ────────────────────────────────────────────────────

function PetsTab() {
  const coins = useGameStore((s) => s.coins);
  const owned = useGameStore((s) => s.ownedPetIds);
  const equipped = useGameStore((s) => s.equippedPetId);
  const adoptPet = useGameStore((s) => s.adoptPet);
  const equipPet = useGameStore((s) => s.equipPet);

  const totalXp = useGameStore((s) => s.totalXp);
  const level = getLevelInfo(totalXp).level;
  const stage = petStage(level);
  const nxt = nextStage(level);

  const adopt = (id: string) => { if (adoptPet(id)) { play("coin"); coinRain(); } };
  const pets = [...PETS].sort((a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity]);

  return (
    <div className="space-y-5">
      {/* Evolution track */}
      <Card className="bg-gradient-to-br from-gem/10 to-brand-50">
        <div className="flex items-center justify-between">
          <CardLabel>Pet evolution</CardLabel>
          <span className="text-xs font-bold text-ink/40">Level {level}</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          {EVO_STAGES.map((s, i) => (
            <div key={s.key} className="flex flex-1 items-center gap-1.5">
              <div className={cn("flex flex-1 flex-col items-center rounded-2xl py-2 transition-all",
                s.index === stage.index ? "bg-white shadow-pop-sm ring-2 ring-gem" : s.index < stage.index ? "opacity-90" : "opacity-40")}>
                <span className="text-2xl">{s.emoji}</span>
                <span className="text-[10px] font-bold uppercase tracking-wide">{s.label}</span>
              </div>
              {i < EVO_STAGES.length - 1 && <span className="text-ink/30">›</span>}
            </div>
          ))}
        </div>
        <ProgressBar value={stageProgress(level)} className="mt-3 h-2.5" barClassName="bg-gem" />
        <p className="mt-1.5 text-xs font-semibold text-ink/50">
          {nxt ? `Keep learning! Reach Level ${nxt.minLevel} to evolve your pets to ${nxt.label} ${nxt.emoji}` : "Your pets are fully evolved — Legendary! 👑"}
        </p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {pets.map((pet) => {
        const isOwned = owned.includes(pet.id);
        const isEquipped = equipped === pet.id;
        const affordable = pet.cost !== null && coins >= pet.cost;
        return (
          <motion.div key={pet.id} whileHover={{ y: -3 }}>
            <Card className="flex h-full flex-col items-center text-center">
              <motion.div
                className={cn("relative grid h-24 w-24 place-items-center rounded-full text-5xl ring-4 shadow-[0_12px_24px_-8px_rgba(15,23,42,0.5)]", RARITY_RING[pet.rarity])}
                style={{ background: RARITY_ORB[pet.rarity] ?? RARITY_ORB.common }}
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: (RARITY_ORDER[pet.rarity] ?? 0) * 0.3 }}
              >
                {/* glossy highlight */}
                <span className="pointer-events-none absolute left-3 top-2.5 h-6 w-8 -rotate-12 rounded-full bg-white/55 blur-[3px]" />
                <span className="drop-shadow-[0_3px_4px_rgba(0,0,0,0.25)]">{pet.emoji}</span>
                {isEquipped && <span className="absolute -bottom-1 rounded-full bg-xp px-2 py-0.5 text-[10px] font-extrabold text-white shadow-pop-sm ring-2 ring-white">★ Active</span>}
              </motion.div>
              <h3 className="mt-3 font-display text-lg font-bold">{pet.name}</h3>
              <p className="text-xs font-bold uppercase tracking-wide text-ink/40">{pet.rarity} · {pet.species}</p>
              <p className="mt-2 flex-1 text-sm font-semibold text-ink/60">{pet.perk}</p>
              <div className="mt-4 w-full">
                {isOwned ? (
                  <Button variant={isEquipped ? "xp" : "outline"} size="md" className="w-full"
                    onClick={() => { equipPet(isEquipped ? null : pet.id); play("click"); }}>
                    {isEquipped ? <><Check className="h-4 w-4" /> Equipped</> : "Equip"}
                  </Button>
                ) : pet.cost === null ? (
                  <Button variant="outline" size="md" className="w-full" disabled>
                    <Lock className="h-4 w-4" /> Boss reward
                  </Button>
                ) : (
                  <Button variant={affordable ? "coin" : "outline"} size="md" className="w-full"
                    disabled={!affordable} onClick={() => adopt(pet.id)}>
                    Adopt · {pet.cost} 🪙
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        );
      })}
      </div>
    </div>
  );
}

// ─── Critterpedia ────────────────────────────────────────────

const CRIT_RING: Record<string, string> = {
  common: "ring-slate-200", uncommon: "ring-emerald-300", rare: "ring-brand-300", epic: "ring-gem/60", legendary: "ring-coin",
};

function CritterpediaTab() {
  const collectedIds = useGameStore((s) => s.collectedCritterIds);
  const collected = new Set(collectedIds);
  const [cat, setCat] = useState<(typeof CRITTER_CATEGORIES)[number]>(CRITTER_CATEGORIES[0]);

  const inCat = CRITTERS.filter((c) => c.category === cat);
  const gotInCat = inCat.filter((c) => collected.has(c.id)).length;
  const total = collected.size;

  return (
    <div className="space-y-5">
      <div className="rounded-4xl bg-gradient-to-br from-gem to-brand-600 p-5 text-center text-white">
        <h2 className="font-display text-2xl font-extrabold">🔭 Critterpedia</h2>
        <p className="font-semibold text-white/85">Discover a new critter every time you finish a lesson or beat a boss!</p>
        <div className="mx-auto mt-3 max-w-sm">
          <div className="mb-1 flex justify-between text-sm font-extrabold">
            <span>{total} collected</span><span>{CRITTER_COUNT} to find</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-black/25">
            <div className="h-full rounded-full bg-coin" style={{ width: `${(total / CRITTER_COUNT) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {CRITTER_CATEGORIES.map((c) => (
          <button key={c} onClick={() => setCat(c)}
            className={cn("rounded-xl px-3 py-1.5 text-sm font-bold transition-colors",
              cat === c ? "bg-brand-500 text-white shadow-pop-sm" : "bg-white text-ink/60 hover:bg-black/5")}>
            {c}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-extrabold">{cat}</h3>
        <span className="text-sm font-bold text-ink/40">{gotInCat}/{inCat.length}</span>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {inCat.map((c) => {
          const got = collected.has(c.id);
          return (
            <div key={c.id} className={cn("flex flex-col items-center rounded-2xl border-2 p-2 text-center", got ? "border-black/10 bg-white" : "border-dashed border-black/10 bg-black/[0.02]")}>
              <div className={cn("relative grid h-14 w-14 place-items-center rounded-full text-3xl ring-4", got ? CRIT_RING[c.rarity] : "ring-black/5")}>
                {got ? (
                  <>
                    <span>{c.emoji}</span>
                    {VARIANT_BADGE[c.variant] && <span className="absolute -right-1 -top-1 text-xs">{VARIANT_BADGE[c.variant]}</span>}
                  </>
                ) : (
                  <span className="text-ink/20">❓</span>
                )}
              </div>
              <span className={cn("mt-1 text-[11px] font-bold leading-tight", got ? "text-ink/70" : "text-ink/30")}>
                {got ? c.name : "???"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Trophy Hall ─────────────────────────────────────────────

const TROPHY_GRAD: Record<string, string> = {
  common: "from-slate-200 to-slate-300",
  rare: "from-brand-200 to-brand-400",
  epic: "from-gem/50 to-gem",
  legendary: "from-coin to-orange-500",
};

const WINGS: { key: string; title: string; accent: string }[] = [
  { key: "legendary", title: "Legendary Wing", accent: "from-coin to-orange-500" },
  { key: "epic", title: "Epic Vault", accent: "from-gem to-fuchsia-500" },
  { key: "rare", title: "Rare Gallery", accent: "from-brand-400 to-brand-600" },
  { key: "common", title: "Hall of Beginnings", accent: "from-slate-400 to-slate-500" },
];

function Trophy({ a, unlocked }: { a: (typeof ACHIEVEMENTS)[number]; unlocked: boolean }) {
  const hidden = a.secret && !unlocked;
  return (
    <motion.div whileHover={unlocked ? { scale: 1.1, y: -4 } : undefined} className="flex w-[4.5rem] flex-col items-center" title={hidden ? "Secret trophy" : a.description}>
      <motion.div
        animate={unlocked ? { y: [0, -4, 0] } : undefined}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        className={cn("grid h-16 w-16 place-items-center rounded-full text-3xl",
          unlocked ? cn("bg-gradient-to-br shadow-glow", TROPHY_GRAD[a.rarity]) : "bg-black/5")}
      >
        <span className={cn(!unlocked && "opacity-25 grayscale")}>{hidden ? "❓" : a.icon}</span>
      </motion.div>
      {/* pedestal */}
      <div className="mt-1 h-2.5 w-9 bg-gradient-to-b from-ink/25 to-ink/10" style={{ clipPath: "polygon(15% 0, 85% 0, 100% 100%, 0 100%)" }} />
      <div className="h-1.5 w-12 rounded-sm bg-ink/15" />
      <span className="mt-1 text-center text-[11px] font-bold leading-tight text-ink/70">{hidden ? "???" : a.name}</span>
    </motion.div>
  );
}

function TrophyHall() {
  const unlocked = useGameStore((s) => s.unlockedAchievementIds);
  const owned = new Set(unlocked);

  return (
    <div className="space-y-5">
      <div className="rounded-4xl bg-gradient-to-br from-ink to-brand-900 p-5 text-center text-white">
        <h2 className="font-display text-2xl font-extrabold">🏛️ Your Trophy Hall</h2>
        <p className="font-semibold text-white/70">{unlocked.length} of {ACHIEVEMENTS.length} trophies earned — show it off!</p>
      </div>

      {WINGS.map((w) => {
        const items = ACHIEVEMENTS.filter((a) => a.rarity === w.key);
        if (items.length === 0) return null;
        const got = items.filter((a) => owned.has(a.id)).length;
        return (
          <Card key={w.key} className="overflow-hidden p-0">
            <div className={cn("flex items-center justify-between bg-gradient-to-r px-4 py-2 text-white", w.accent)}>
              <span className="font-display font-extrabold">{w.title}</span>
              <span className="text-sm font-bold">{got}/{items.length}</span>
            </div>
            <div className="bg-gradient-to-b from-transparent to-black/[0.03] p-4">
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-5">
                {items.map((a) => <Trophy key={a.id} a={a} unlocked={owned.has(a.id)} />)}
              </div>
              {/* shelf */}
              <div className="mt-1 h-2 rounded-full bg-gradient-to-b from-amber-800/40 to-amber-950/30 shadow-[0_4px_8px_-2px_rgba(0,0,0,0.25)]" />
            </div>
          </Card>
        );
      })}

      <Card className="border-2 border-dashed border-black/10 bg-transparent text-center">
        <CardLabel>✨ Seasonal Wing</CardLabel>
        <p className="mt-1 text-sm font-semibold text-ink/40">Limited-time trophies from events (like Matariki) will be displayed here.</p>
      </Card>
    </div>
  );
}

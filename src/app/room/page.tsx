"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Coins, Check, Lock, Trash2, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { useGameStore, useHydrated } from "@/lib/store/useGameStore";
import { useRequireRole, AuthLoading } from "@/lib/auth/guard";
import { DECOR, DECOR_MAP, DECOR_CATEGORIES } from "@/data/decor";
import { play } from "@/lib/sound/sfx";
import { cn } from "@/lib/utils/cn";

const COLS = 6;
const ROWS = 4;
const CELLS = Array.from({ length: COLS * ROWS }, (_, i) => `c${i}`);

export default function RoomPage() {
  const { ready } = useRequireRole(["student"]);
  return <AppShell>{ready ? <RoomInner /> : <AuthLoading />}</AppShell>;
}

function RoomInner() {
  const hydrated = useHydrated();
  const coins = useGameStore((s) => s.coins);
  const owned = useGameStore((s) => s.ownedDecorIds);
  const roomItems = useGameStore((s) => s.roomItems);
  const buyDecor = useGameStore((s) => s.buyDecor);
  const placeDecor = useGameStore((s) => s.placeDecor);
  const removeDecor = useGameStore((s) => s.removeDecor);

  const [cat, setCat] = useState<(typeof DECOR_CATEGORIES)[number]>(DECOR_CATEGORIES[0]);
  const [selected, setSelected] = useState<string | null>(null);

  if (!hydrated) {
    return <div className="grid min-h-[40vh] place-items-center font-bold text-ink/40">Unlocking your room…</div>;
  }

  const placedCount = Object.keys(roomItems).length;

  const tapCell = (cell: string) => {
    if (roomItems[cell]) { removeDecor(cell); play("click"); return; }
    if (selected) { placeDecor(cell, selected); play("click"); }
  };

  const pickItem = (id: string) => {
    if (owned.includes(id)) { setSelected(id === selected ? null : id); play("click"); return; }
    const item = DECOR_MAP[id];
    if (coins >= item.cost && buyDecor(id)) { setSelected(id); play("coin"); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold">🏠 My Room</h1>
          <p className="font-bold text-ink/50">Spend coins on decor, then tap a spot to place it. Tap a placed item to remove it.</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-coin px-4 py-2 font-display font-extrabold text-ink shadow-pop-sm">
          <Coins className="h-5 w-5" /> {coins}
        </span>
      </div>

      {/* Room scene */}
      <Card className="overflow-hidden p-0">
        <div className="relative aspect-[3/2] w-full bg-gradient-to-b from-[#cfe0ff] via-[#e8eefc] to-[#f6e9d8]">
          {/* wall / floor divider */}
          <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-[#bcd2ff] to-[#dfe9ff]" />
          <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-b from-[#f0e2cd] to-[#e3cda7]" />
          {/* placement grid */}
          <div
            className="absolute inset-0 grid"
            style={{ gridTemplateColumns: `repeat(${COLS},1fr)`, gridTemplateRows: `repeat(${ROWS},1fr)` }}
          >
            {CELLS.map((cell) => {
              const item = roomItems[cell] ? DECOR_MAP[roomItems[cell]] : null;
              return (
                <button
                  key={cell}
                  onClick={() => tapCell(cell)}
                  className={cn(
                    "group grid place-items-center border border-white/0 transition-colors",
                    !item && selected && "hover:border-brand-400/60 hover:bg-white/20",
                    item && "hover:bg-streak/10",
                  )}
                >
                  {item ? (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-3xl drop-shadow sm:text-4xl">
                      {item.emoji}
                    </motion.span>
                  ) : (
                    selected && <span className="text-lg text-brand-500/30 opacity-0 group-hover:opacity-100">＋</span>
                  )}
                </button>
              );
            })}
          </div>
          {placedCount === 0 && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <p className="rounded-full bg-black/40 px-4 py-2 text-sm font-bold text-white backdrop-blur">
                Pick an item below, then tap a spot ✨
              </p>
            </div>
          )}
        </div>
      </Card>

      {selected && (
        <div className="flex items-center justify-center gap-2 text-sm font-bold text-brand-700">
          <Sparkles className="h-4 w-4" /> Placing {DECOR_MAP[selected].emoji} {DECOR_MAP[selected].name} — tap a spot.
          <button onClick={() => setSelected(null)} className="rounded-full bg-black/5 px-2 py-0.5 text-ink/50">Done</button>
        </div>
      )}

      {/* Shop / palette */}
      <div>
        <div className="flex flex-wrap gap-2">
          {DECOR_CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCat(c)}
              className={cn("rounded-xl px-3.5 py-2 text-sm font-bold transition-colors",
                cat === c ? "bg-brand-500 text-white shadow-pop-sm" : "bg-white text-ink/60 hover:bg-black/5")}>
              {c}
            </button>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {DECOR.filter((d) => d.category === cat).map((d) => {
            const isOwned = owned.includes(d.id);
            const isSel = selected === d.id;
            const afford = coins >= d.cost;
            return (
              <button key={d.id} onClick={() => pickItem(d.id)} disabled={!isOwned && !afford}
                className={cn("relative flex flex-col items-center rounded-2xl border-2 p-3 transition-all",
                  isSel ? "border-brand-500 bg-brand-50" : "border-black/10 hover:border-brand-300",
                  !isOwned && !afford && "opacity-50")}>
                {isSel && <Check className="absolute right-1.5 top-1.5 h-4 w-4 text-brand-600" />}
                <span className="text-3xl">{d.emoji}</span>
                <span className="mt-1 text-center text-xs font-bold leading-tight">{d.name}</span>
                <span className="mt-0.5 text-[11px] font-bold">
                  {isOwned ? <span className="text-ink/40">Owned</span> : (
                    <span className={cn("inline-flex items-center gap-0.5", afford ? "text-yellow-700" : "text-ink/40")}>
                      {!afford && <Lock className="h-3 w-3" />}{d.cost} 🪙
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
        {placedCount > 0 && (
          <button
            onClick={() => { CELLS.forEach((c) => removeDecor(c)); play("click"); }}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-black/5 px-3 py-2 text-sm font-bold text-ink/50 hover:bg-streak/10 hover:text-streak"
          >
            <Trash2 className="h-4 w-4" /> Clear room
          </button>
        )}
      </div>
    </div>
  );
}

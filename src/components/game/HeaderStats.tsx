"use client";

import { motion } from "framer-motion";
import { Flame, Gem } from "lucide-react";
import { useGameStore, useHydrated } from "@/lib/store/useGameStore";
import { getLevelInfo } from "@/lib/gamification/engine";
import { cn } from "@/lib/utils/cn";

function Chip({
  children,
  className,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1.5 font-display font-bold tabular-nums shadow-pop-sm",
        className,
      )}
      aria-label={label}
    >
      {children}
    </div>
  );
}

export function HeaderStats({ compact = false }: { compact?: boolean }) {
  const hydrated = useHydrated();
  const totalXp = useGameStore((s) => s.totalXp);
  const coins = useGameStore((s) => s.coins);
  const gems = useGameStore((s) => s.gems);
  const streak = useGameStore((s) => s.streakDays);

  if (!hydrated) {
    return <div className="h-9 w-44 animate-pulse rounded-full bg-black/5" aria-hidden />;
  }

  const lvl = getLevelInfo(totalXp);

  return (
    <div className="flex items-center gap-2">
      {/* Level + XP */}
      <div className="hidden items-center gap-2 sm:flex">
        <Chip className="bg-brand-500 text-white" label={`Level ${lvl.level}, ${lvl.title}`}>
          <span className="grid h-5 w-5 place-items-center rounded-full bg-white/25 text-xs">
            {lvl.level}
          </span>
          <span className="hidden md:inline">{lvl.title}</span>
        </Chip>
        <div className="hidden w-24 lg:block">
          <div className="h-3 w-full overflow-hidden rounded-full bg-black/10">
            <motion.div
              className="h-full rounded-full bg-xp"
              initial={false}
              animate={{ width: `${Math.round(lvl.progress * 100)}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          </div>
          <p className="mt-0.5 text-[10px] font-bold text-ink/50">
            {lvl.xpIntoLevel}/{lvl.xpForNextLevel} XP
          </p>
        </div>
      </div>

      <Chip className="bg-coin text-ink" label={`${coins} coins`}>
        🪙 {coins}
      </Chip>

      {(gems > 0 || !compact) && (
        <Chip className="bg-gem text-white" label={`${gems} gems`}>
          <Gem className="h-4 w-4" /> {gems}
        </Chip>
      )}

      <Chip className="bg-streak text-white" label={`${streak} day streak`}>
        <Flame className={cn("h-4 w-4", streak > 0 && "animate-wiggle")} /> {streak}
      </Chip>
    </div>
  );
}

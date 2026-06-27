"use client";

import { motion } from "framer-motion";
import type { Achievement } from "@/types";
import { cn } from "@/lib/utils/cn";

const RARITY: Record<Achievement["rarity"], string> = {
  common: "from-slate-200 to-slate-300 text-slate-700",
  rare: "from-brand-200 to-brand-400 text-brand-900",
  epic: "from-gem/40 to-gem text-white",
  legendary: "from-coin to-orange-500 text-white",
};

export function AchievementBadge({
  achievement,
  unlocked,
  size = "md",
}: {
  achievement: Achievement;
  unlocked: boolean;
  size?: "sm" | "md";
}) {
  const hidden = achievement.secret && !unlocked;
  return (
    <motion.div
      whileHover={unlocked ? { scale: 1.06, rotate: -2 } : undefined}
      className={cn(
        "flex flex-col items-center gap-2 rounded-3xl border border-black/5 p-3 text-center",
        unlocked ? "bg-white shadow-card" : "bg-black/5",
      )}
      title={hidden ? "Secret achievement" : achievement.description}
    >
      <div
        className={cn(
          "grid place-items-center rounded-full bg-gradient-to-br shadow-inner",
          size === "md" ? "h-16 w-16 text-3xl" : "h-12 w-12 text-2xl",
          unlocked ? RARITY[achievement.rarity] : "from-slate-200 to-slate-300 grayscale",
        )}
      >
        <span className={cn(!unlocked && "opacity-40")}>{hidden ? "❓" : achievement.icon}</span>
      </div>
      <div>
        <p className="text-sm font-bold leading-tight text-ink">
          {hidden ? "Secret" : achievement.name}
        </p>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/40">
          {achievement.rarity}
        </p>
      </div>
    </motion.div>
  );
}

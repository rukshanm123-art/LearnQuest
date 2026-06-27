"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

export function ProgressBar({
  value,
  className,
  barClassName,
  ariaLabel,
}: {
  /** 0..1 */
  value: number;
  className?: string;
  barClassName?: string;
  ariaLabel?: string;
}) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div
      className={cn("relative h-4 w-full overflow-hidden rounded-full bg-black/10", className)}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
    >
      <motion.div
        className={cn("h-full rounded-full bg-brand-500", barClassName)}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
      >
        <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      </motion.div>
    </div>
  );
}

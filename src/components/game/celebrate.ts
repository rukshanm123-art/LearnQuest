"use client";

import confetti from "canvas-confetti";

/**
 * Celebration helpers. All are no-ops when reduced motion is requested so we
 * stay accessible without the caller having to check.
 */
function reducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

const BRAND = ["#33a1ff", "#22c55e", "#fbbf24", "#a855f7", "#fb7185"];

/** Quick celebratory pop for a correct answer. */
export function burst() {
  if (reducedMotion()) return;
  confetti({ particleCount: 60, spread: 65, origin: { y: 0.7 }, colors: BRAND, scalar: 0.9 });
}

/** Full-screen celebration for level-ups, achievements and boss defeats. */
export function bigWin() {
  if (reducedMotion()) return;
  const end = Date.now() + 900;
  (function frame() {
    confetti({ particleCount: 6, angle: 60, spread: 70, origin: { x: 0 }, colors: BRAND });
    confetti({ particleCount: 6, angle: 120, spread: 70, origin: { x: 1 }, colors: BRAND });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

/** Shower of coins, e.g. on daily challenge claim. */
export function coinRain() {
  if (reducedMotion()) return;
  confetti({
    particleCount: 80,
    spread: 100,
    origin: { y: 0 },
    gravity: 1.4,
    colors: ["#fbbf24", "#f59e0b", "#fde68a"],
    shapes: ["circle"],
    scalar: 1.1,
  });
}

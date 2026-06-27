"use client";

import { useEffect } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { bossLookFor, type BossLook } from "@/data/bossLooks";

/** Bold-outlined 2D cartoon bosses (matches the avatar art style). */
const OL = "#20142e";
const SW = 5;
function darken(hex: string, f = 0.82) {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${Math.round(((n >> 16) & 255) * f)},${Math.round(((n >> 8) & 255) * f)},${Math.round((n & 255) * f)})`;
}

export function Boss2D({
  bossId,
  className,
  hitKey = 0,
  defeated = false,
  animated = false,
}: {
  bossId: string;
  className?: string;
  hitKey?: number;
  defeated?: boolean;
  animated?: boolean;
}) {
  const look = bossLookFor(bossId);
  const controls = useAnimationControls();

  useEffect(() => {
    if (animated && hitKey > 0) {
      controls.start({ x: [0, -12, 12, -7, 0], scale: [1, 1.12, 1], transition: { duration: 0.32 } });
    }
  }, [hitKey, animated, controls]);

  return (
    <div className={className}>
      <motion.svg
        viewBox="0 0 200 200"
        className="h-full w-full overflow-visible"
        animate={defeated ? { rotate: 80, y: 50, opacity: 0.25 } : animated ? { y: [0, -7, 0] } : undefined}
        transition={defeated ? { duration: 0.7 } : { duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.g animate={controls}>{form(look)}</motion.g>
      </motion.svg>
    </div>
  );
}

function bossFace(opts: { eyeY?: number; fangs?: boolean; pupil?: string } = {}) {
  const eyeY = opts.eyeY ?? 96;
  return (
    <g>
      <path d="M68,80 L92,90" stroke={OL} strokeWidth={6} strokeLinecap="round" />
      <path d="M132,80 L108,90" stroke={OL} strokeWidth={6} strokeLinecap="round" />
      <ellipse cx="82" cy={eyeY} rx="11" ry="13" fill="#fff" stroke={OL} strokeWidth={3} />
      <ellipse cx="118" cy={eyeY} rx="11" ry="13" fill="#fff" stroke={OL} strokeWidth={3} />
      <circle cx="84" cy={eyeY + 2} r="5.5" fill={opts.pupil ?? OL} />
      <circle cx="116" cy={eyeY + 2} r="5.5" fill={opts.pupil ?? OL} />
      <circle cx="86" cy={eyeY - 1} r="2" fill="#fff" />
      <circle cx="118" cy={eyeY - 1} r="2" fill="#fff" />
      <path d="M76,120 Q100,136 124,120 Q100,128 76,120 Z" fill="#3a0f1a" stroke={OL} strokeWidth={3} strokeLinejoin="round" />
      {opts.fangs && (
        <g fill="#fff" stroke={OL} strokeWidth={1.5}>
          <path d="M86,122 l4,9 4,-9 Z" />
          <path d="M106,122 l4,9 4,-9 Z" />
        </g>
      )}
    </g>
  );
}

function form(look: BossLook) {
  const c = look.color;
  const a = look.accent;
  switch (look.form) {
    case "dragon":
      return (
        <g strokeLinejoin="round">
          <path d="M52,92 Q10,66 18,122 Q44,108 62,118 Z" fill={a} stroke={OL} strokeWidth={SW} />
          <path d="M148,92 Q190,66 182,122 Q156,108 138,118 Z" fill={a} stroke={OL} strokeWidth={SW} />
          <path d="M66,58 L58,26 L84,50 Z" fill={a} stroke={OL} strokeWidth={SW} />
          <path d="M134,58 L142,26 L116,50 Z" fill={a} stroke={OL} strokeWidth={SW} />
          <ellipse cx="100" cy="112" rx="58" ry="60" fill={c} stroke={OL} strokeWidth={SW} />
          <ellipse cx="100" cy="132" rx="30" ry="34" fill={a} />
          {bossFace({ fangs: true })}
        </g>
      );
    case "golem":
      return (
        <g strokeLinejoin="round">
          <rect x="46" y="58" width="108" height="110" rx="22" fill={c} stroke={OL} strokeWidth={SW} />
          <circle cx="38" cy="150" r="20" fill={c} stroke={OL} strokeWidth={SW} />
          <circle cx="162" cy="150" r="20" fill={c} stroke={OL} strokeWidth={SW} />
          {[["M70,70 L78,96", 0], ["M132,80 L124,110", 0], ["M96,120 L104,150", 0]].map(([d], i) => (
            <path key={i} d={d as string} stroke={a} strokeWidth={5} strokeLinecap="round" />
          ))}
          {bossFace({ eyeY: 96, pupil: a })}
        </g>
      );
    case "kraken":
      return (
        <g strokeLinejoin="round">
          {[0, 1, 2, 3, 4].map((i) => {
            const x = 50 + i * 25;
            const dir = i % 2 === 0 ? 1 : -1;
            return <path key={i} d={`M${x},130 Q${x + dir * 16},165 ${x + dir * 4},185`} stroke={c} strokeWidth={15} strokeLinecap="round" fill="none" />;
          })}
          <ellipse cx="100" cy="100" rx="62" ry="58" fill={c} stroke={OL} strokeWidth={SW} />
          <ellipse cx="100" cy="118" rx="34" ry="30" fill={a} opacity="0.5" />
          {bossFace({ eyeY: 92 })}
        </g>
      );
    case "mech":
      return (
        <g strokeLinejoin="round">
          <line x1="100" y1="40" x2="100" y2="20" stroke={OL} strokeWidth={5} />
          <circle cx="100" cy="16" r="7" fill="#ef4444" stroke={OL} strokeWidth={3} />
          <rect x="48" y="44" width="104" height="100" rx="20" fill={c} stroke={OL} strokeWidth={SW} />
          <rect x="62" y="78" width="76" height="34" rx="14" fill={OL} />
          <circle cx="86" cy="95" r="9" fill={a} />
          <circle cx="114" cy="95" r="9" fill={a} />
          <rect x="74" y="124" width="52" height="8" rx="4" fill={darken(c)} />
          {[60, 140].map((x) => <circle key={x} cx={x} cy={56} r="4" fill={darken(c)} />)}
        </g>
      );
    case "phantom":
      return (
        <g strokeLinejoin="round" opacity={0.92}>
          <path d="M50,110 Q50,46 100,46 Q150,46 150,110 L150,176 Q138,160 126,176 Q114,160 100,176 Q86,160 74,176 Q62,160 50,176 Z" fill={c} stroke={OL} strokeWidth={SW} />
          <ellipse cx="82" cy="96" rx="10" ry="14" fill={a} />
          <ellipse cx="118" cy="96" rx="10" ry="14" fill={a} />
          <circle cx="82" cy="98" r="4" fill={OL} />
          <circle cx="118" cy="98" r="4" fill={OL} />
          <ellipse cx="100" cy="126" rx="11" ry="14" fill="#2a0a1f" stroke={OL} strokeWidth={3} />
        </g>
      );
    case "guardian":
    default:
      return (
        <g strokeLinejoin="round">
          <ellipse cx="100" cy="104" rx="74" ry="30" fill="none" stroke={a} strokeWidth={6} opacity="0.7" />
          <circle cx="100" cy="100" r="56" fill={c} stroke={OL} strokeWidth={SW} />
          <circle cx="100" cy="100" r="30" fill={a} opacity="0.45" />
          {bossFace({ eyeY: 94, pupil: "#fff" })}
          <path d="M100,40 l5,11 12,1 -9,9 3,12 -11,-7 -11,7 3,-12 -9,-9 12,-1 Z" fill={a} stroke={OL} strokeWidth={2} />
        </g>
      );
  }
}

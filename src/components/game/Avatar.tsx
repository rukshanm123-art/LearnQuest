"use client";

import { useId } from "react";
import { AVATAR_MAP } from "@/data/avatars";
import { cn } from "@/lib/utils/cn";
import type { AvatarPart } from "@/types";

/**
 * Layered 2D "dress-up" avatar. Every cosmetic is an SVG layer drawn to a single
 * shared body template, so hats / clothes / accessories sit correctly on the
 * character (a real dress-up game — not floating emoji stickers).
 */

type Parts = Partial<Record<AvatarPart["slot"], string | null>>;
const OL = "#241a33"; // bold near-black cartoon outline
const SW = 5;

const part = (id?: string | null) => (id ? AVATAR_MAP[id] : undefined);
function darken(hex: string, f = 0.8) {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${Math.round(((n >> 16) & 255) * f)},${Math.round(((n >> 8) & 255) * f)},${Math.round((n & 255) * f)})`;
}

const SIZES = { sm: 48, md: 72, lg: 120, xl: 240 };

export function Avatar({
  parts,
  size = "md",
  className,
  ring = true,
  photoUrl,
}: {
  parts: Parts;
  size?: keyof typeof SIZES;
  className?: string;
  ring?: boolean;
  photoUrl?: string | null;
}) {
  const gid = useId().replace(/:/g, "");
  const px = SIZES[size];
  const grad = part(parts.background)?.grad ?? ["#cdedff", "#7cc4ff"];
  // Circular (ring) contexts crop to head + shoulders; scenes show the full body.
  const viewBox = ring ? "24 14 152 150" : "0 0 200 232";

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        ring ? "rounded-full ring-4 ring-white shadow-card" : "rounded-4xl shadow-card",
        className,
      )}
      style={ring ? { width: px, height: px } : undefined}
      aria-hidden
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <svg viewBox={viewBox} className="h-full w-full" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`bg-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={grad[0]} />
              <stop offset="1" stopColor={grad[1]} />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="200" height="232" fill={`url(#bg-${gid})`} />
          <Character parts={parts} />
        </svg>
      )}
    </div>
  );
}

/** Big full-body scene variant (used for the Avatar Studio preview). */
export function AvatarStage({ parts, className }: { parts: Parts; petId?: string | null; className?: string }) {
  return <Avatar parts={parts} ring={false} className={className} />;
}

// ── The character (shared body template) ─────────────────────
function Character({ parts }: { parts: Parts }) {
  const base = part(parts.base);
  const skin = base?.color ?? "#f4c79a";
  const hair = base?.hair ?? "short";
  const hairCol = base?.hairColor ?? "#6b4423";
  const outfit = part(parts.outfit);
  const oKind = outfit?.kind ?? "tshirt";
  const oCol = outfit?.color ?? "#38bdf8";
  const oCol2 = outfit?.color2 ?? "#ffffff";
  const hat = part(parts.hat);
  const face = part(parts.face);
  const acc = part(parts.accessory);
  const longBottom = oKind === "dress" || oKind === "royal";

  return (
    <>
      {oKind === "hero" && (
        <path d="M76,138 Q100,150 124,138 L150,212 Q100,196 50,212 Z" fill={oCol} stroke={OL} strokeWidth={SW} strokeLinejoin="round" />
      )}
      {hairBack(hair, hairCol)}

      {/* legs */}
      <path d="M92,176 L90,212" stroke={OL} strokeWidth={22} strokeLinecap="round" />
      <path d="M108,176 L110,212" stroke={OL} strokeWidth={22} strokeLinecap="round" />
      <path d="M92,176 L90,212" stroke={skin} strokeWidth={18} strokeLinecap="round" />
      <path d="M108,176 L110,212" stroke={skin} strokeWidth={18} strokeLinecap="round" />
      <ellipse cx="88" cy="215" rx="13" ry="7.5" fill="#374151" stroke={OL} strokeWidth={SW} />
      <ellipse cx="112" cy="215" rx="13" ry="7.5" fill="#374151" stroke={OL} strokeWidth={SW} />

      {!longBottom && bottoms()}

      {/* arms */}
      {arm("M78,140 Q66,158 60,176", skin)}
      {arm("M122,140 Q134,158 140,176", skin)}

      {/* torso */}
      <rect x="70" y="126" width="60" height="58" rx="22" fill={skin} stroke={OL} strokeWidth={SW} />
      {outfitTop(oKind, oCol, oCol2)}

      {/* hands (over sleeves) */}
      <circle cx="60" cy="177" r="11" fill={skin} stroke={OL} strokeWidth={SW} />
      <circle cx="140" cy="177" r="11" fill={skin} stroke={OL} strokeWidth={SW} />

      {/* head */}
      <ellipse cx="50" cy="82" rx="9" ry="12" fill={skin} stroke={OL} strokeWidth={SW} />
      <ellipse cx="150" cy="82" rx="9" ry="12" fill={skin} stroke={OL} strokeWidth={SW} />
      <ellipse cx="100" cy="74" rx="50" ry="52" fill={skin} stroke={OL} strokeWidth={SW} />
      <ellipse cx="80" cy="54" rx="16" ry="11" fill="#fff" opacity="0.16" />

      {faceBase()}
      {face && faceOverlay(face.kind ?? "", face.color ?? "#1f2937")}
      {hairFront(hair, hairCol)}
      {hat && hatShape(hat.kind ?? "", hat.color ?? "#2563eb")}
      {acc && accessory(acc.kind ?? "", acc.color ?? "#fbbf24")}
    </>
  );
}

function arm(d: string, skin: string) {
  return (
    <>
      <path d={d} stroke={OL} strokeWidth={20} strokeLinecap="round" fill="none" />
      <path d={d} stroke={skin} strokeWidth={16} strokeLinecap="round" fill="none" />
    </>
  );
}

function bottoms() {
  return (
    <>
      <path d="M92,172 L91,194" stroke={OL} strokeWidth={23} strokeLinecap="round" />
      <path d="M108,172 L109,194" stroke={OL} strokeWidth={23} strokeLinecap="round" />
      <path d="M92,172 L91,194" stroke="#26408b" strokeWidth={19} strokeLinecap="round" />
      <path d="M108,172 L109,194" stroke="#26408b" strokeWidth={19} strokeLinecap="round" />
    </>
  );
}

// ── Outfits ──────────────────────────────────────────────────
function outfitTop(kind: string, col: string, col2: string) {
  const sleeve = (d: string, c: string) => <path d={d} stroke={c} strokeWidth={18} strokeLinecap="round" fill="none" />;
  const torso = (c: string) => (
    <g>
      <path d="M70,148 q0,-22 30,-22 q30,0 30,22 l0,34 q-30,10 -60,0 Z" fill={c} stroke={OL} strokeWidth={SW} strokeLinejoin="round" />
      {/* cel shade for volume */}
      <path d="M72,176 q28,9 56,0 l0,6 q-28,10 -56,0 Z" fill="#000" opacity="0.12" />
    </g>
  );
  switch (kind) {
    case "stripe":
      return (
        <g>
          {sleeve("M80,141 Q70,151 66,162", col)}
          {sleeve("M120,141 Q130,151 134,162", col)}
          {torso(col)}
          <path d="M72,156 q28,9 56,0" stroke={col2} strokeWidth={6} fill="none" />
          <path d="M72,168 q28,9 56,0" stroke={col2} strokeWidth={6} fill="none" />
        </g>
      );
    case "hoodie":
      return (
        <g>
          <path d="M74,122 q26,18 52,0 q-4,18 -26,18 q-22,0 -26,-18 Z" fill={darken(col, 0.85)} stroke={OL} strokeWidth={SW} />
          {sleeve("M80,141 Q70,151 66,162", col)}
          {sleeve("M120,141 Q130,151 134,162", col)}
          {torso(col)}
          <path d="M88,160 h24 v14 h-24 Z" fill={darken(col, 0.85)} stroke={OL} strokeWidth={2} />
        </g>
      );
    case "dress":
      return (
        <g>
          {sleeve("M82,141 Q74,149 72,158", col)}
          {sleeve("M118,141 Q126,149 128,158", col)}
          <path d="M72,150 q28,-20 56,0 l16,52 q-44,14 -88,0 Z" fill={col} stroke={OL} strokeWidth={SW} strokeLinejoin="round" />
        </g>
      );
    case "lab":
      return (
        <g>
          {sleeve("M80,141 Q70,151 66,162", "#f8fafc")}
          {sleeve("M120,141 Q130,151 134,162", "#f8fafc")}
          {torso("#f8fafc")}
          <path d="M100,128 l0,52" stroke="#cbd5e1" strokeWidth={2} />
          <circle cx="92" cy="162" r="2.4" fill="#94a3b8" />
          <circle cx="92" cy="172" r="2.4" fill="#94a3b8" />
        </g>
      );
    case "hivis":
      return (
        <g>
          {sleeve("M80,141 Q70,151 66,162", col)}
          {sleeve("M120,141 Q130,151 134,162", col)}
          {torso(col)}
          <path d="M88,128 l0,52 M112,128 l0,52" stroke="#e5e7eb" strokeWidth={4} />
          <path d="M72,170 q28,9 56,0" stroke="#e5e7eb" strokeWidth={5} fill="none" />
        </g>
      );
    case "sport":
      return (
        <g>
          {sleeve("M80,141 Q70,151 66,162", darken(col, 0.85))}
          {sleeve("M120,141 Q130,151 134,162", darken(col, 0.85))}
          {torso(col)}
          <text x="100" y="172" textAnchor="middle" fontSize="20" fontWeight="900" fill="#fff">7</text>
        </g>
      );
    case "hero":
      return (
        <g>
          {sleeve("M80,141 Q70,151 66,162", col)}
          {sleeve("M120,141 Q130,151 134,162", col)}
          {torso(col)}
          <path d="M100,150 l5,11 12,1 -9,9 3,12 -11,-7 -11,7 3,-12 -9,-9 12,-1 Z" fill={col2} stroke={OL} strokeWidth={2} />
        </g>
      );
    case "royal":
      return (
        <g>
          <path d="M72,134 q28,-12 56,0 l0,12 q-28,10 -56,0 Z" fill="#f8fafc" stroke={OL} strokeWidth={SW} />
          {sleeve("M82,144 Q74,152 72,160", col)}
          {sleeve("M118,144 Q126,152 128,160", col)}
          <path d="M74,150 q26,-12 52,0 l14,52 q-40,14 -80,0 Z" fill={col} stroke={OL} strokeWidth={SW} strokeLinejoin="round" />
          <path d="M100,150 l0,52" stroke={col2} strokeWidth={5} />
        </g>
      );
    default: // tshirt
      return (
        <g>
          {sleeve("M80,141 Q70,151 66,162", col)}
          {sleeve("M120,141 Q130,151 134,162", col)}
          {torso(col)}
        </g>
      );
  }
}

// ── Hair ─────────────────────────────────────────────────────
function hairBack(kind: string, col: string) {
  if (kind === "long" || kind === "pixie")
    return <path d="M52,66 Q34,140 70,156 Q66,110 70,76 Z M148,66 Q166,140 130,156 Q134,110 130,76 Z" fill={col} stroke={OL} strokeWidth={SW} strokeLinejoin="round" />;
  if (kind === "ponytail")
    return <path d="M150,64 Q182,86 170,134 Q150,124 146,82 Z" fill={col} stroke={OL} strokeWidth={SW} strokeLinejoin="round" />;
  if (kind === "afro") return <circle cx="100" cy="64" r="62" fill={col} stroke={OL} strokeWidth={SW} />;
  return null;
}

function hairFront(kind: string, col: string) {
  if (kind === "none" || kind === "antenna") return null;
  if (kind === "buzz")
    return <path d="M56,68 Q60,34 100,32 Q140,34 144,68 Q120,54 100,54 Q80,54 56,68 Z" fill={col} opacity={0.92} stroke={OL} strokeWidth={SW} strokeLinejoin="round" />;
  if (kind === "robot")
    return (
      <g>
        <rect x="60" y="36" width="80" height="20" rx="8" fill="#94a3b8" stroke={OL} strokeWidth={SW} />
        <line x1="100" y1="36" x2="100" y2="22" stroke={OL} strokeWidth={SW} />
        <circle cx="100" cy="18" r="6" fill="#ef4444" stroke={OL} strokeWidth={SW} />
      </g>
    );
  if (kind === "curly" || kind === "afro") {
    const c = [62, 78, 100, 122, 138];
    return (
      <g stroke={OL} strokeWidth={SW}>
        {c.map((x, i) => <circle key={i} cx={x} cy={46 - (i % 2) * 6} r="15" fill={col} />)}
      </g>
    );
  }
  // short / long / ponytail / pixie share a crown + fringe
  return (
    <g>
      <path
        d="M54,72 Q56,28 100,26 Q144,28 146,72 Q140,50 116,48 Q108,60 96,50 Q74,50 54,72 Z"
        fill={col}
        stroke={OL}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      {/* glossy highlight */}
      <path d="M64,58 Q82,40 106,44" stroke="#fff" strokeWidth={4} strokeLinecap="round" fill="none" opacity="0.28" />
    </g>
  );
}

// ── Face ─────────────────────────────────────────────────────
function eye(cx: number) {
  return (
    <g>
      <ellipse cx={cx} cy={78} rx={8.5} ry={11} fill="#fff" stroke={OL} strokeWidth={2.5} />
      <circle cx={cx + 1} cy={80} r={5.2} fill="#4a7fb5" />
      <circle cx={cx + 1} cy={80} r={2.7} fill="#1a1330" />
      <circle cx={cx + 3} cy={75.5} r={2.4} fill="#fff" />
    </g>
  );
}

function faceBase() {
  return (
    <g>
      {/* raised eyebrows = cheerful */}
      <path d="M73,62 Q82,56 91,62" stroke={OL} strokeWidth={4} fill="none" strokeLinecap="round" />
      <path d="M109,62 Q118,56 127,62" stroke={OL} strokeWidth={4} fill="none" strokeLinecap="round" />
      {eye(82)}
      {eye(118)}
      {/* blush */}
      <ellipse cx="66" cy="92" rx="8" ry="4.5" fill="#fb7185" opacity="0.55" />
      <ellipse cx="134" cy="92" rx="8" ry="4.5" fill="#fb7185" opacity="0.55" />
      {/* big open grin with teeth + tongue */}
      <path d="M84,96 Q100,100 116,96 Q113,114 100,116 Q87,114 84,96 Z" fill="#6e2235" stroke={OL} strokeWidth={3} strokeLinejoin="round" />
      <path d="M88,98 Q100,101 112,98 L110,104 Q100,107 90,104 Z" fill="#fff" />
      <ellipse cx="100" cy="112" rx="7" ry="4" fill="#f06a8a" />
    </g>
  );
}

function faceOverlay(kind: string, col: string) {
  if (kind === "freckles")
    return (
      <g fill={col}>
        {[72, 78, 75].map((x, i) => <circle key={`l${i}`} cx={x} cy={90 + (i % 2) * 4} r="1.6" />)}
        {[122, 128, 125].map((x, i) => <circle key={`r${i}`} cx={x} cy={90 + (i % 2) * 4} r="1.6" />)}
      </g>
    );
  if (kind === "facepaint")
    return <path d="M120,92 l3,6 7,1 -5,5 1,7 -6,-3 -6,3 1,-7 -5,-5 7,-1 Z" fill={col} stroke={OL} strokeWidth={1.5} />;
  const dark = kind === "sunnies";
  return (
    <g stroke={col} strokeWidth={3} fill={dark ? "#111827" : "#bae6fd"} fillOpacity={dark ? 0.95 : 0.4}>
      <circle cx="82" cy="80" r="11" />
      <circle cx="118" cy="80" r="11" />
      <line x1="93" y1="80" x2="107" y2="80" />
      <line x1="71" y1="78" x2="58" y2="74" strokeWidth={3} />
    </g>
  );
}

// ── Hats ─────────────────────────────────────────────────────
function hatShape(kind: string, col: string) {
  switch (kind) {
    case "cap":
      return (
        <g stroke={OL} strokeWidth={SW} strokeLinejoin="round">
          <path d="M56,52 Q100,16 144,52 Q100,40 56,52 Z" fill={col} />
          <ellipse cx="126" cy="54" rx="30" ry="8" fill={darken(col, 0.85)} />
          <circle cx="100" cy="24" r="4" fill={darken(col, 0.8)} />
        </g>
      );
    case "beanie":
      return (
        <g stroke={OL} strokeWidth={SW} strokeLinejoin="round">
          <path d="M54,56 Q100,14 146,56 Z" fill={col} />
          <rect x="52" y="50" width="96" height="13" rx="6" fill={darken(col, 0.85)} />
          <circle cx="100" cy="16" r="7" fill="#f8fafc" />
        </g>
      );
    case "sun":
      return (
        <g stroke={OL} strokeWidth={SW} strokeLinejoin="round">
          <ellipse cx="100" cy="58" rx="60" ry="13" fill={col} />
          <path d="M70,54 Q100,26 130,54 Z" fill={darken(col, 0.92)} />
          <path d="M72,52 q28,8 56,0" stroke={darken(col, 0.8)} strokeWidth={4} fill="none" />
        </g>
      );
    case "party":
      return (
        <g stroke={OL} strokeWidth={SW} strokeLinejoin="round">
          <path d="M100,4 L78,54 L122,54 Z" fill={col} />
          <circle cx="100" cy="6" r="6" fill="#fde047" />
          <circle cx="94" cy="30" r="3" fill="#fff" />
          <circle cx="106" cy="42" r="3" fill="#fff" />
        </g>
      );
    case "wizard":
      return (
        <g stroke={OL} strokeWidth={SW} strokeLinejoin="round">
          <path d="M100,0 Q90,38 76,58 L124,58 Q110,38 100,0 Z" fill={col} />
          <ellipse cx="100" cy="58" rx="42" ry="9" fill={darken(col, 0.85)} />
          <path d="M100,20 l3,7 7,1 -5,5 1,7 -6,-4 -6,4 1,-7 -5,-5 7,-1 Z" fill="#fde047" />
        </g>
      );
    case "crown":
      return (
        <g stroke={OL} strokeWidth={SW} strokeLinejoin="round">
          <path d="M60,54 L72,28 L86,46 L100,24 L114,46 L128,28 L140,54 Z" fill={col} />
          <rect x="60" y="52" width="80" height="8" fill={darken(col, 0.85)} />
          <circle cx="100" cy="40" r="3.5" fill="#ef4444" />
        </g>
      );
    default:
      return null;
  }
}

// ── Accessories (held by the right hand) ─────────────────────
function accessory(kind: string, col: string) {
  switch (kind) {
    case "book":
      return (
        <g stroke={OL} strokeWidth={SW} strokeLinejoin="round">
          <rect x="128" y="166" width="26" height="20" rx="2" fill={col} />
          <line x1="141" y1="166" x2="141" y2="186" stroke="#fff" strokeWidth={2} />
        </g>
      );
    case "ball":
      return <circle cx="150" cy="180" r="13" fill={col} stroke={OL} strokeWidth={SW} />;
    case "balloon":
      return (
        <g>
          <path d="M140,177 Q158,168 158,152" stroke={OL} strokeWidth={2} fill="none" />
          <ellipse cx="158" cy="142" rx="15" ry="18" fill={col} stroke={OL} strokeWidth={SW} />
        </g>
      );
    case "flower":
      return (
        <g stroke={OL} strokeWidth={2}>
          <path d="M140,177 L154,150" stroke="#16a34a" strokeWidth={4} />
          {[0, 1, 2, 3, 4].map((i) => {
            const a = (i / 5) * Math.PI * 2;
            return <circle key={i} cx={154 + Math.cos(a) * 8} cy={146 + Math.sin(a) * 8} r="6" fill={col} />;
          })}
          <circle cx="154" cy="146" r="5" fill="#fff" />
        </g>
      );
    case "wand":
    case "star":
      return (
        <g stroke={OL} strokeWidth={2}>
          <path d="M140,177 L156,150" stroke="#7c3aed" strokeWidth={4} strokeLinecap="round" />
          <path d="M156,138 l4,9 10,1 -7,7 2,10 -9,-5 -9,5 2,-10 -7,-7 10,-1 Z" fill={col} stroke={OL} strokeWidth={SW} strokeLinejoin="round" />
        </g>
      );
    case "trophy":
      return (
        <g stroke={OL} strokeWidth={SW} strokeLinejoin="round">
          <path d="M140,150 h22 v6 a11,11 0 0 1 -22,0 Z" fill={col} />
          <rect x="148" y="166" width="6" height="8" fill={col} />
          <rect x="142" y="174" width="18" height="5" rx="2" fill={darken(col, 0.85)} />
        </g>
      );
    default:
      return null;
  }
}

# Design system

LearnQuest's look is **bright, rounded, and tactile** — friendly enough for a 5-year-old, not babyish for a 14-year-old. The system is implemented in `tailwind.config.ts` + `src/app/globals.css` and consumed through a small set of components.

## Principles

1. **Game, not worksheet.** Big tactile buttons, satisfying motion, instant reward feedback.
2. **Clarity first.** One primary action per screen; generous spacing; high contrast.
3. **Calm on failure.** Wrong answers use soft tones and encouraging copy — never harsh red buzzers.
4. **Inclusive by default.** Accessibility is built into the primitives, not bolted on.

## Colour

Semantic tokens (Tailwind):

| Token | Use |
|-------|-----|
| `brand` (50–900) | Primary blue — navigation, primary actions |
| `xp` `#22c55e` | XP / correct / success |
| `coin` `#fbbf24` | Coins / soft currency |
| `gem` `#a855f7` | Premium currency / AI tutor |
| `streak` `#fb7185` | Streaks / gentle "not quite" |
| `subject.*` | Per-subject identity (english/maths/science/social/tech/reo) |
| `ink` / `cloud` | Foreground / app background |

Each **subject owns a colour** used consistently across cards, worlds, badges, and progress bars, so learners build a mental map.

## Typography

- **Display:** *Baloo 2* (`--font-display`) — rounded, playful, for headings & numbers.
- **Body:** *Nunito* (`--font-body`) — warm, highly legible.
- Loaded via `next/font` with `display: swap`; CSS-variable fallbacks to system rounded fonts.
- Headings use `text-wrap: balance`; numbers use `tabular-nums` for stable stat readouts.

## Motion

- **Framer Motion** for entrances, progress springs, and hover lifts.
- **canvas-confetti** for celebrations (`celebrate.ts`): `burst()` (correct), `bigWin()` (level-up / achievement / boss), `coinRain()` (rewards).
- Custom keyframes: `float-slow`, `pop-in`, `wiggle`, `shimmer`, `coin-spin`.
- **All motion is disabled under `prefers-reduced-motion`** (CSS + JS guards in `celebrate.ts`).

## Sound

`src/lib/sound/sfx.ts` synthesises SFX with the **Web Audio API** — no audio files (great for Lighthouse). Cheerful arpeggio for correct, soft descending tone for wrong (never jarring), plus coin/level-up/click/whoosh. Honours a persisted mute toggle (header speaker icon).

## Components

| Component | File | Notes |
|-----------|------|-------|
| `Button` / `buttonVariants` | `components/ui/Button.tsx` | Chunky `.btn-pop` with a 3D bottom shadow that depresses on press; variants: brand/coin/xp/danger/ghost/outline; links reuse `buttonVariants` |
| `Card` | `components/ui/Card.tsx` | Soft `rounded-4xl` surface + `CardTitle`/`CardLabel` |
| `ProgressBar` | `components/ui/ProgressBar.tsx` | Spring-animated, shimmer sheen, ARIA `progressbar` |
| `Avatar` | `components/game/Avatar.tsx` | Composes emoji parts (base/hat/accessory) |
| `HeaderStats` | `components/game/HeaderStats.tsx` | Live level/XP/coins/gems/streak chips |
| `AchievementBadge` | `components/game/AchievementBadge.tsx` | Rarity frames + locked/secret states |
| `AppShell` | `components/layout/AppShell.tsx` | Top nav + grown-up links + mobile bottom tab bar |

### The signature button

`.btn-pop` (in `globals.css`) gives every button a coloured "base" shadow so it reads as a physical, pressable key. `active:translate-y-1` + a shorter shadow make it depress — the core tactile feel of the app.

## Accessibility (WCAG-minded)

- Semantic landmarks (`header`, `nav`, `main#main`) + a **skip link**.
- Visible, high-contrast **focus rings** (`:focus-visible` → 4px brand ring).
- ARIA on progress bars and stat chips; buttons have `aria-label`s where icon-only.
- `prefers-reduced-motion` fully respected.
- Colour is never the *only* signal — correct/incorrect also use icons (✓/✕) and copy.
- Hit targets are large (kid-friendly), text scales with the viewport.

## Voice & tone

Warm, encouraging, distinctly **Aotearoa**. Te reo Māori is woven in naturally — *Kia ora*, *Ka pai*, *whānau*, *kaiako*, *ākonga*, *tamariki*. Praise effort over ability ("mistakes help our brains grow"). The AI tutor persona is **Tui** 🦜 — kind, brief, and never makes a child feel bad.

## Responsive & mobile-first

Layouts start single-column and expand at `sm`/`md`/`lg`. On phones, primary navigation moves to a fixed **bottom tab bar**; the desktop top-nav and grown-up links hide. Content max-width is 6xl for comfortable reading on large screens.

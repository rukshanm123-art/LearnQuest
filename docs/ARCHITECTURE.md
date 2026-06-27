# Architecture

LearnQuest is a **Next.js 15 App Router** application. It is designed to run in two modes from the same codebase:

- **Demo mode** (default) — no backend; game state persists in `localStorage`. Ideal for development, demos, and offline play.
- **Cloud mode** — Supabase provides auth + Postgres; OpenAI powers the live AI tutor. Enabled purely by setting env vars.

```
┌──────────────────────────────────────────────────────────────┐
│                          Browser                               │
│                                                                │
│  Next.js (RSC + Client Islands)                                │
│  ┌───────────────┐   ┌──────────────────────────────────────┐ │
│  │ Server Comps  │   │ Client Islands ("use client")        │ │
│  │ layout, /play │   │ dashboards, quiz engine, shop        │ │
│  │ Suspense      │   │  ▲ Zustand store (persisted)         │ │
│  └───────┬───────┘   └──────────┬───────────────────────────┘ │
│          │                      │                              │
│          │                      ├─ gamification engine (pure) │
│          │                      ├─ curriculum mapping (pure)  │
│          │                      └─ Web Audio SFX / confetti   │
└──────────┼──────────────────────┼─────────────────────────────┘
           │ fetch                 │ (cloud mode only)
           ▼                       ▼
   ┌───────────────┐       ┌───────────────────────────────────┐
   │ /api/tutor    │──────▶│ OpenAI (optional)                 │
   │ (route)       │  fall │  → deterministic fallback if no   │
   └───────────────┘  back │    key / error / timeout          │
                           └───────────────────────────────────┘
           ▲
           │ (cloud mode)
   ┌───────┴───────────────────────────────────────────────────┐
   │ Supabase: Postgres + Auth + RLS (see supabase/schema.sql)  │
   └───────────────────────────────────────────────────────────┘
```

## Rendering strategy

- **Static-first.** Every non-API route prerenders to static HTML (`○` in the build output). Interactivity is layered on as client islands, keeping First Load JS ~102 kB shared.
- **Client islands** are marked `"use client"` and own all stateful game logic. They read the persisted store and re-render reactively.
- **`useSearchParams`** (in the quiz) is wrapped in a `<Suspense>` boundary, per Next 15 requirements.

## State management

`src/lib/store/useGameStore.ts` is a **Zustand** store with the `persist` middleware (key `learnquest-player-v1`).

- **Single source of truth** for the player on the client: XP, coins, gems, streak, mastery, owned pets/avatars, achievements, completed quests, daily XP.
- **Hydration safety:** storage is guarded for SSR; `useHydrated()` gates UI that depends on persisted values so the server and first client render match (no hydration flicker/mismatch).
- **Actions return rich outcomes** (`AnswerOutcome`, `QuestOutcome`) so the UI can fire celebrations (confetti, level-up sounds, achievement toasts) without the store importing any UI.

## Gamification engine

`src/lib/gamification/` is **pure, deterministic, framework-free** TypeScript:

- `engine.ts` — level curve, reward computation, streak math, adaptive difficulty, mastery EMA.
- `constants.ts` — every balance number in one tunable place.
- `achievements.ts` — catalogue + `evaluateAchievements()`.

Because it's pure, the exact same code can run **client-side optimistically** and **server-side authoritatively** (a Supabase Edge Function) for anti-cheat reconciliation. See [GAMIFICATION.md](GAMIFICATION.md).

## Curriculum engine

`src/lib/curriculum/` holds the NZ Curriculum data (`nz-curriculum.ts`) and the **mapping engine** (`mapping.ts`) that translates a learner's age band → NZC levels → the eligible content pool. The same predicates map cleanly to SQL `WHERE` clauses in cloud mode. See [CURRICULUM.md](CURRICULUM.md).

## AI tutor

`/api/tutor` (`src/app/api/tutor/route.ts`) accepts an attempt and returns a kid-friendly explanation.

1. If `OPENAI_API_KEY` is set → calls OpenAI with an age-tuned system prompt (`lib/ai/tutor.ts`), 8 s timeout.
2. On missing key / error / timeout / rate limit → **deterministic fallback** using the question's own explanation, so the feature never breaks.

The UI shows an `· AI` badge only when the model actually answered.

## Data layer & migration path

| Concern | Demo mode | Cloud mode |
|---------|-----------|------------|
| Content (questions, quests, pets…) | `src/data/*.ts` | `questions`, `quests`, … tables |
| Player state | `localStorage` via Zustand | `player_state` + `attempts` |
| Auth | none (anonymous) | Supabase Auth |
| Leaderboards/analytics | local only | SQL views + Edge Functions |

The TypeScript types in `src/types/index.ts` intentionally mirror the SQL schema, so swapping the data source is a matter of replacing the `data/*` imports with Supabase queries behind the same interfaces.

## Security model

- **Postgres Row Level Security** enforces that students see only their own data, parents see their children, and teachers see only their class members (`supabase/schema.sql`).
- **Children-first privacy:** child profiles can exist without an auth account, managed under a guardian.
- **Anti-cheat:** XP/coins are computed by the pure engine server-side from the immutable `attempts` log; the denormalised `player_state` is a cache, not the source of truth.

## Extensibility

- **Add a question:** append to `src/data/questions.ts` (or insert a `questions` row). It's instantly picked up by the mapping engine + adaptive selector.
- **Add a subject/world:** add to `SUBJECTS` + `WORLDS` + `STRANDS` in `nz-curriculum.ts`.
- **Add an activity type:** extend `ActivityType`, render a branch in the quiz engine, and add an `evaluate()` case.
- **Add an achievement/pet/avatar:** append to the respective `data/` or `gamification/` catalogue.

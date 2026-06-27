# API design

LearnQuest keeps its API surface deliberately small. Most reads/writes in cloud mode go directly through the **Supabase client** (guarded by RLS), while bespoke server logic lives in **Next.js route handlers**.

## Live endpoint

### `POST /api/tutor`

Returns a kid-friendly explanation for an attempt. Upgrades to OpenAI when configured; otherwise serves a deterministic fallback.

**Request**

```jsonc
{
  "questionPrompt": "How many sides does a hexagon have?",
  "studentAnswer": "8",
  "correctAnswer": "6",
  "ageBand": "8-10",          // "5-7" | "8-10" | "11-14"
  "subject": "maths",
  "wasCorrect": false,
  "explanation": "\"Hex\" means six — a hexagon has 6 sides."
}
```

**Response** `200`

```jsonc
{
  "ai": true,                  // false when the fallback answered
  "message": "Great thinking! A hexagon actually has 6 sides...",
  "hint": "The answer is \"6\". Want to try a similar one?"  // optional
}
```

**Behaviour**

- No `OPENAI_API_KEY` → deterministic fallback (`ai: false`).
- OpenAI error / timeout (8 s) / rate-limit → fallback, still `200`.
- Malformed body → `400` with a friendly message.

---

## Planned Supabase surface (cloud mode)

These run client-side via `@supabase/supabase-js`, enforced by [RLS](DATABASE.md#row-level-security). Mutations that affect rewards are funnelled through **Edge Functions** so the server is authoritative.

### Reads (RLS-guarded `select`)

| Operation | Table/View | Who can read |
|-----------|-----------|--------------|
| Player state | `player_state` | self, guardians, teachers |
| Attempt history | `attempts` | self, guardians, teachers |
| Subject mastery | `subject_mastery` | self, guardians, teachers |
| Achievements | `player_achievements` | self, guardians, teachers |
| Class roster | `class_members` + `profiles` | owning teacher |
| Leaderboard | `leaderboard` view | authenticated |
| Content | `questions`, `quests`, `strands`, `pets`, … | public |

### Edge Functions (server-authoritative writes)

| Function | Purpose | Why server-side |
|----------|---------|-----------------|
| `submit-attempt` | Insert into `attempts`, recompute rewards with the **pure gamification engine**, update `player_state` + `subject_mastery`, evaluate achievements | Anti-cheat: XP/coins can't be forged by the client |
| `complete-quest` | Award quest/boss rewards, grant boss pet | Same |
| `claim-daily` | Idempotent daily-challenge reward | Prevent double-claims |
| `weekly-report` | Generate AI parent report from `attempts` | Uses server OpenAI key |
| `tournament-tick` | Roll up scores, settle weekly tournaments | Scheduled, trusted |

**`submit-attempt` contract (proposed)**

```jsonc
// POST (Supabase Function)
{ "questionId": "ma-3", "answer": 1, "timeMs": 3200 }
// ← returns the same AnswerOutcome shape the client already consumes:
{ "reward": { "xp": 16, "coins": 4, "bonuses": ["Speedy +5 XP"] },
  "leveledUp": false, "newLevel": 2, "newlyUnlocked": [], "correct": true }
```

Because the engine in `src/lib/gamification/engine.ts` is pure and dependency-free, the **same module** is imported by both the optimistic client path and the authoritative Edge Function — the client predicts, the server confirms.

## Conventions

- All timestamps `timestamptz` (UTC); dates as `yyyy-mm-dd`.
- Reward math is centralised in `gamification/constants.ts` — never hard-coded in routes.
- Errors degrade gracefully; gameplay never blocks on a network failure.

# Database

The production data store is **PostgreSQL on Supabase**. The complete schema — tables, enums, indexes, RLS policies, helper functions, and the leaderboard view — is in [`supabase/schema.sql`](../supabase/schema.sql).

## Entity overview

```
auth.users ─1:1─ profiles ─┬─1:1─ player_state
                           ├─1:N─ attempts ───────▶ questions ──▶ strands
                           ├─1:N─ subject_mastery
                           ├─M:N─ achievements   (player_achievements)
                           ├─M:N─ pets           (player_pets)
                           └─M:N─ avatar_parts   (player_avatar_parts)

profiles ─M:N─ profiles                (guardianships: parent ⇄ child)
profiles(teacher) ─1:N─ classes ─M:N─ profiles(student)   (class_members)
classes ─1:N─ assignments ──▶ quests ;  assignment_progress (M:N student)
```

## Design decisions

- **Profiles decoupled from `auth.users`.** `profiles.auth_id` is nullable so a **child can exist without their own login**, managed by a guardian — essential for the under-13 audience.
- **Event-sourced rewards.** `attempts` is an **immutable log**; `player_state` and `subject_mastery` are **denormalised caches** for fast dashboard reads, kept current by Edge Functions. The cache can always be rebuilt from `attempts` — and that's how anti-cheat reconciliation works.
- **Content as data.** `questions`, `quests`, `strands`, `pets`, `avatar_parts`, `achievements` are plain tables, world-readable, writable only by the service role (authoring tools).
- **Enums** (`subject_id`, `age_band`, `activity_type`, `rarity`, `user_role`) keep the schema tight and mirror the TypeScript unions in `src/types`.
- **JSONB** for `options`/`tokens`/`answer`/`equipped_avatar` — flexible activity shapes without a table explosion.

## Row Level Security

Every user table has RLS enabled. Three `security definer` helpers express the access model:

| Helper | True when… |
|--------|-----------|
| `is_self(p)` | the current auth user **is** profile `p` |
| `is_guardian(child)` | the current user is a **guardian** of `child` |
| `teaches(student)` | the current teacher **owns a class** the student is in |

Policy summary:

- **Students** read/write only their own `player_state`, `attempts`, mastery, collectibles.
- **Parents** read (not write) their children's data.
- **Teachers** read data for students in classes they own.
- **Content** tables are public-read.

Reward-affecting **writes** go through Edge Functions using the service role, so RLS protects the direct path and the server stays authoritative on XP/coins.

## Seeding

The demo content in `src/data/*.ts` is the canonical seed source. Two options:

1. **Generate `seed.sql`** from the TS data (a small script that emits `INSERT`s) and run it in the SQL editor.
2. **Seed at runtime** via a one-off admin script using the service-role client.

Keep `src/types/index.ts`, `supabase/schema.sql`, and `src/data/*` in lock-step — they intentionally describe the same domain.

## Migrations

Use the Supabase CLI:

```bash
supabase init
supabase db diff -f <name>   # capture schema changes as a migration
supabase db push             # apply to the linked project
```

Treat `schema.sql` as the baseline migration; evolve via timestamped migrations thereafter.

## Indexing & performance

- `attempts(profile_id, created_at desc)` — dashboards & recent-activity.
- `attempts(profile_id, strand_id)` — weakness detection.
- `questions(subject, age_band, level) where active` — the hot content-selection path.
- The `leaderboard` view uses a window `rank()`; promote to a **materialised view** refreshed on a schedule once volumes grow (Phase 3/8).

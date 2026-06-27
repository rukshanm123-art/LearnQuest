# Content authoring pipeline

The authoring CMS, NZC tagging taxonomy and seeding pipeline — the tooling to grow from a small seed bank to the 20k–100k curriculum-aligned items a commercial NZ platform needs.

Like the rest of LearnQuest it runs in **demo mode** with zero backend (browser-local content store) and **persists to Supabase when configured** — the CMS write-throughs and a loader use the RLS-guarded `questions` table via `src/lib/content/supabase-repo.ts`.

## Roles & permissions

The CMS is gated to **author**, **reviewer** and **admin** (see `docs/AUTH.md`):

- **Author** — create & edit drafts, submit for review. Cannot publish or delete.
- **Reviewer** — everything authors can, plus **approve & publish** and retire (publishing is blocked while an item has QA errors).
- **Admin** — full control, including delete.

## The Content Studio (`/author`)

Open it as **author**, **reviewer** or **admin** (e.g. `author@learnquest.nz` / `demo1234`) → **Content** in the nav. It has three tabs:

### 1. Library
- Every item with status, subject, year, objective count and live **error count**.
- Filter by subject/status, full-text search.
- Lifecycle: **Draft → In review → Published → (Retired)**. Publishing is blocked while an item has QA errors.
- Per-item actions: edit, submit, approve & publish, retire/restore, duplicate, delete.
- A QA summary banner (total / clean / with-errors / errors / warnings).

### 2. Coverage
A subject × Year (1–8) matrix of **published** item counts — green = healthy, amber = thin, red = gap. This is the backlog driver for scaling content (#03).

### 3. Import / Export
- **Import** JSON or CSV; every row is schema-validated and valid rows are added as drafts, with a per-row error report.
- **Export** the whole bank as JSON or CSV (round-trips), plus a CSV template.

## The editor

`src/components/author/ItemEditor.tsx` authors every activity type with:
- Subject → strand, **Year** (auto-derives NZC level + age band), difficulty, XP/coins.
- Type-specific fields: MCQ options + correct answer; math-puzzle answer; sentence-building sentence (auto-tokenised); reading-comprehension passage.
- **Curriculum objective** tagging (#02).
- A **live preview** and **live QA** panel.

## Curriculum taxonomy (#02)

`src/lib/curriculum/objectives.ts` defines NZC achievement objectives tagged to **Years 1–8** (Maths, English, Science to start) with codes, descriptions, levels and prerequisite links. Helpers: `objectivesForSubject`, `yearToLevel`, `yearToAgeBand`. Extend this dataset (ideally with a registered teacher) toward full coverage.

## Automated QA (#03)

`src/lib/content/qa.ts` runs on every save and import:
- **Structural** validation via the zod schema (`src/lib/content/schema.ts`).
- **Answer-key sanity** (MCQ index in range, correct type per activity).
- **Tag completeness** (objective + year present).
- **Reading level** vs target year (`approxReadingYear`) — soft warning.
- **Duplicate** prompt detection.

`qaReport(items)` aggregates counts for the dashboard.

## AI-assisted drafting (#03)

`POST /api/author/draft` (`subject`, `year`, `count`, optional `objectiveId`) returns **draft** items. With `OPENAI_API_KEY` set it uses the model (JSON-mode, schema-validated); otherwise a deterministic generator produces real Maths items and clearly-labelled templates for other subjects. **Drafts never auto-publish** — they land in the Library for human review. Trigger it from Library → **AI draft**.

## Import/export formats

- **JSON** — an array of `Question` objects (see `src/types/index.ts`). First-class, fully round-tripped.
- **CSV** — columns match the schema; array fields (`options`, `tokens`, `objectiveIds`) are `|`-delimited. Use the in-app **CSV template**.

## From authored content → gameplay → production

1. **In the demo**, items you **publish** in the Studio are merged live into the quiz pools (`src/app/play/quiz/QuizGame.tsx` reads published items from the content store) — author a question, publish it, and it appears in play.
2. **For production**: Export JSON → generate a DB seed → load into Postgres:

```bash
node scripts/content/generate-seed.mjs learnquest-content.json supabase/seed.sql
# then run supabase/seed.sql after supabase/schema.sql
```

The generator emits `insert … on conflict do update`, only for **published** items, with correct enum casts and `jsonb` fields.

## Starter Maths bank (generated)

A ready-made **Maths Years 1–8** bank ships with the demo (320 items, ~40/year), generated programmatically so every answer is correct and tagged to objectives. It seeds the Studio (Coverage shows Maths green Y1–8) and is playable immediately.

```bash
npm run content:maths -- 40    # → src/data/maths-bank.json (40 items/year)
```

Regenerate it, then turn any export into SQL:

```bash
npm run content:seed -- src/data/maths-bank.json supabase/seed.sql
```

This is the template for scaling other subjects: generate/author → review → publish → seed.

## Persistence (Supabase)

`src/lib/content/supabase-repo.ts` implements `list / upsert / setStatus / delete / bulkUpsert` against the `questions` table. The content store **write-throughs** every mutation when `NEXT_PUBLIC_SUPABASE_*` is set, and `useContentBootstrap()` (on `/author`) loads from Supabase when configured, else seeds the local demo bank. Schema additions (status, version, year, `objective_ids`, author/reviewer ids, RLS policies, `curriculum_objectives`) are in `supabase/schema.sql`.

## Production hardening (next)

- Promote the CMS write-throughs to server actions/Edge Functions (defence in depth on top of RLS).
- Add media (images/audio) via Supabase Storage.
- Add the AI-drafting queue + batch QA at scale, and a throughput dashboard (#03).
- Generate the bulk content bank across all subjects with an author panel + AI drafting.

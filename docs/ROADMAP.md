# Implementation roadmap

A phased plan from this foundation to a nationally-scaled platform. Each phase lists the goal, key deliverables, and the "done when" acceptance bar.

> Effort estimates assume a small cross-functional team (2 eng, 1 designer, 1 curriculum lead, fractional PM). Adjust to taste.

---

## ✅ Phase 0 — Foundation *(this repository)*

**Goal:** a runnable, impressive vertical slice proving the whole experience.

- Next.js 15 + TS + Tailwind design system
- Gamification engine (XP, levels, coins, streaks, adaptive difficulty, achievements)
- Playable quiz engine with 5 activity types, quests + a boss battle
- AI tutor (OpenAI + fallback), pets & avatar shop, collection
- Student / parent / teacher dashboards
- Full Postgres schema + RLS, complete docs

**Done when:** `npm run build` passes, all routes serve, demo mode is fully playable. ✔️

---

## Phase 1 — Accounts & cloud sync · ~3–4 weeks

**Goal:** real users, progress that follows them across devices.

- Supabase Auth (email magic-link + Google); child accounts managed by guardians
- Wire `data/*` reads and store writes to Supabase (behind the existing interfaces)
- Server-authoritative reward writes via Edge Function (anti-cheat)
- Onboarding flow (pick age band, name, avatar)

**Done when:** a student can sign in on two devices and see identical progress; XP can't be forged from the client.

---

## Phase 2 — Content scale & authoring · ~4–6 weeks

**Goal:** hundreds of questions per subject/level, authored by educators.

- Curriculum-lead authoring tool (CRUD on `questions`/`quests`, preview, QA workflow)
- Content tagging against full NZC achievement objectives
- Import pipeline + `supabase/seed.sql` generation from `src/data`
- Coverage dashboard (gaps by subject × level × strand)

**Done when:** ≥150 questions/subject across Levels 1–5 with reviewer sign-off.

---

## Phase 3 — Social & live ops · ~4–6 weeks

**Goal:** the retention loops — competition and events.

- Global + class + friends leaderboards (SQL views, already stubbed)
- **Weekly tournaments** and **seasonal events** (event tables + scheduler)
- Daily challenge streak rewards, gem economy, limited-time pets/worlds
- Notifications (email + web push) for streak reminders & results

**Done when:** a weekly tournament runs end-to-end and measurably lifts D7 retention.

---

## Phase 4 — AI personalisation · ~4 weeks

**Goal:** a genuinely adaptive path per learner.

- Personalised learning path from the `attempts` history (weakness detection → next-best activity)
- AI-generated weekly parent reports (replace the deterministic summary)
- Difficulty calibration tuned on real data; spaced-repetition scheduling
- Guardrails: content safety, age-appropriateness, hallucination checks on tutor output

**Done when:** recommended activities measurably improve mastery vs. a random baseline.

---

## Phase 5 — Te Reo Māori & localisation · ~3–4 weeks

**Goal:** ship the first-class Te Reo Māori world (already scaffolded).

- Audio pronunciation (waiata, kupu), macron-correct typography
- Partnership review with reo Māori educators for tikanga & accuracy
- Full bilingual UI toggle

**Done when:** Te Reo Māori subject is removed from "coming soon" with reviewed content.

---

## Phase 6 — Mobile & PWA · ~3 weeks

- Installable PWA (offline play, home-screen icon, push)
- Capacitor wrappers for App Store / Play Store if native is required
- Haptics + richer sound design

**Done when:** installable, passes PWA audit, offline daily challenge works.

---

## Phase 7 — Schools (B2B) · ~6 weeks

- Class roster import, bulk student provisioning, SSO (Education clouds)
- Assignment grading, standards-based reporting for kaiako
- School & regional leaderboards; admin/principal analytics

**Done when:** a pilot school runs a full term on LearnQuest.

---

## Phase 8 — Scale, compliance & quality · ongoing

- NZ Privacy Act 2020 compliance, data residency, parental consent flows
- Accessibility audit to WCAG 2.2 AA; independent security review
- Load testing, observability (Sentry + analytics), SLOs
- Lighthouse ≥95 budget enforced in CI

**Done when:** compliance sign-off + green CI performance/a11y budgets.

---

## Suggested sequencing

```
P0 ✅ ─▶ P1 ─▶ P2 ─┬─▶ P3 ─▶ P4 ─▶ P6 ─▶ P7
                   └─▶ P5 (parallelisable)
P8 runs continuously from P1 onward.
```

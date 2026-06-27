# 🚀 LearnQuest

> Learning that feels like your favourite game.

LearnQuest is a gamified learning platform for New Zealand tamariki aged **5–14**, aligned to the **New Zealand Curriculum**. It blends the progression loops of Duolingo, the collectible joy of Pokémon, and the bright, tactile world-building of Roblox into a safe, ad-free place to learn English, Maths, Science, Social Sciences, Technology and Te Reo Māori — with AI woven through the experience.

Built with **Next.js 15 / React 19 / TypeScript**, a real gamification engine, voice narration, and AI-powered tutoring, storytelling and reading coaching — with student, parent, teacher and admin experiences.

🔗 **Live demo:** https://learnquest-delta.vercel.app

---

## ✨ Features

| Area | Notes |
|------|-------|
| 🗺️ **Learning Journey** | Sequential teach → practise lessons on a themed 2D world map, with mastery stars, an avatar that walks the path, and a boss battle as each world's capstone |
| 🔊 **Voice narration** | British-English read-aloud (Web Speech API) for lessons, questions and feedback — essential for early readers |
| 📚 **AI Story Studio** | Generates original, personalised, **reading-level-adapted** stories (Gemini) with read-along narration + vocabulary — an infinite reading library |
| 🎤 **AI Reading Coach** | Child reads aloud / answers by voice (speech recognition); AI scores fluency, highlights missed words, and judges spoken comprehension answers |
| 🎮 **Gamification engine** | XP, levels, coins, gems, streaks, adaptive difficulty, achievements, anti-farm reward rules |
| 🧒 **Dress-up avatar** | Layered 2D cartoon avatar — characters, outfits, hats, faces, accessories all fit the body (no stickers); buy-to-confirm |
| ⚔️ **Boss battles** | 2D cartoon bosses with HP, hearts, power-ups, hit reactions; once-only rewards |
| 🐾 **Pets + 🔭 Critterpedia** | Collectible pets plus a 400+ critter Pokédex unlocked by learning |
| 🏠 **My Room** | Spend coins on furniture/decor and build a personal space |
| 👪 **Parent dashboard** | Estimated **reading age vs actual age + improvement**, fluency/comprehension/vocabulary scores, weekly activity, AI report |
| 🍎 **Teacher dashboard** | Roster, class leaderboard, AI assignment generator |
| 🛡️ **Admin consoles** | Platform-admin + school-admin (schools, users, audit, announcements) |
| ✍️ **Content Studio** | Authoring CMS with NZC objectives, QA workflow, AI drafting, import/export |
| 🔐 **Auth & roles** | Student / parent / teacher / school-admin / author / reviewer / platform-admin; demo-local + Supabase cloud |

> **Demo mode:** the app runs end-to-end with **no API keys** — progress persists in `localStorage`, and every AI feature has a deterministic fallback. Add Supabase + Gemini keys to enable cloud sync and live AI.

---

## 🧱 Tech stack

- **[Next.js 15](https://nextjs.org)** (App Router, RSC) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS** design system · **Framer Motion** + **canvas-confetti** for game juice
- **Zustand** (persisted) for client game state
- **Supabase** (Auth + Postgres + RLS) — optional, demo-mode friendly
- **Gemini** (or OpenAI) for AI tutor, stories, reading coach & reports — optional, with fallbacks
- **Web Speech API** for narration (TTS) + reading coach (STT)

---

## 🚀 Quick start

```bash
npm install
cp .env.example .env.local   # optional — fill in Supabase / Gemini keys for cloud + AI
npm run dev                  # → http://localhost:3000
```

| Script | Does |
|--------|------|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

---

## 👥 Demo accounts

One-click on `/login`, or sign in with password `demo1234`:

| Role | Email | Lands on |
|------|-------|----------|
| Platform admin | `admin@learnquest.nz` | `/admin` |
| School admin | `principal@aotearoa.school.nz` | `/school` |
| Teacher | `hana@aotearoa.school.nz` | `/teacher` |
| Parent | `sarah@learnquest.nz` | `/parent` |
| Student | `aroha@aotearoa.school.nz` | `/dashboard` |

- **Families** register at `/register`; **schools** at `/for-schools` (students join with the demo code **`AOTEAROA`**).

---

## 🗂️ Project structure

```
src/
├── app/                      # Next.js App Router
│   ├── dashboard/            # Student home
│   ├── adventure/            # Learning Journey map
│   ├── lesson/[id]/          # Narrated teach step
│   ├── play/quiz/            # Core gameplay engine (+ lessons)
│   ├── library/              # AI Story Studio + reader
│   ├── coach/                # AI Reading Coach (voice)
│   ├── collection/           # Avatar dress-up · pets · Critterpedia · trophies
│   ├── room/                 # Build-a-room
│   ├── bosses/               # Boss arena
│   ├── parent/ teacher/      # Whānau analytics · kaiako classroom
│   ├── school/ admin/        # School-admin · platform-admin consoles
│   ├── author/               # Content Studio
│   └── api/                  # AI routes (tutor, story, coach, report, assignment)
├── components/               # ui · game (Avatar, Boss2D…) · auth · layout · author
├── lib/                      # gamification · curriculum · auth · ai · audio · coach · store · supabase
├── data/                     # Seed content (questions, lessons, quests, pets, avatars, critters, decor)
└── types/                    # Domain types

supabase/schema.sql           # Postgres schema + RLS
docs/                         # Architecture, database, gamification, deployment, …
scripts/content/              # Question-bank generators
```

---

## 📚 Documentation

See [`docs/`](docs/) — [Architecture](docs/ARCHITECTURE.md), [Auth & institutions](docs/AUTH.md),
[Database](docs/DATABASE.md), [Gamification](docs/GAMIFICATION.md), [Curriculum](docs/CURRICULUM.md),
[Content pipeline](docs/CONTENT_PIPELINE.md), [Design system](docs/DESIGN_SYSTEM.md),
[API](docs/API.md), [Roadmap](docs/ROADMAP.md), [Deployment](docs/DEPLOYMENT.md).

---

## ♿ Accessibility & 🇳🇿 Aotearoa

WCAG-minded (semantic landmarks, skip link, focus rings, `prefers-reduced-motion`, voice narration). Curriculum strands map to the real NZC learning areas; Te Reo Māori is woven through the UI and content celebrates local context.

## 📄 License

Proprietary — © LearnQuest. All rights reserved.

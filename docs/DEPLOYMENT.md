# Deployment

LearnQuest deploys cleanly to **Vercel** (recommended) with **Supabase** for data/auth and **OpenAI** for the tutor. It also runs anywhere Node 18.18+ can host a Next.js server.

## 0. Prerequisites

- Node ≥ 18.18 (repo developed on Node 24)
- A Vercel account
- (Optional) a Supabase project
- (Optional) an OpenAI API key

## 1. Environment variables

Copy `.env.example` → `.env.local` for local dev, and set the same in your host's dashboard for production.

| Variable | Required? | Purpose |
|----------|-----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Cloud mode | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cloud mode | Public anon key (browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server tasks | Trusted writes; **server only** |
| `OPENAI_API_KEY` | Live AI tutor | Falls back gracefully if unset |
| `OPENAI_MODEL` | No | Defaults to `gpt-4o-mini` |
| `NEXT_PUBLIC_APP_URL` | No | Canonical URL for SEO/OG tags |

> The app builds and runs with **none** of these set (demo mode).

## 2. Deploy to Vercel

```bash
npm i -g vercel
vercel            # link & preview deploy
vercel --prod     # production
```

Or: push to GitHub → "Import Project" in Vercel → add env vars → deploy. Vercel auto-detects Next.js; no build config needed.

- Build command: `next build` (default)
- Output: `.next` (default)
- Node version: set to 20.x+ in Project Settings.

## 3. Supabase setup (cloud mode)

1. Create a project at [supabase.com](https://supabase.com).
2. In the **SQL Editor**, run `supabase/schema.sql` (creates tables, enums, RLS, the leaderboard view, helper functions).
3. Seed content — run your generated `seed.sql`, or a script that reads `src/data/*` (see [DATABASE.md](DATABASE.md)).
4. **Auth → Providers:** enable Email (magic link) and any social providers.
5. Copy the project URL + anon key into env vars. Keep the **service role key** server-side only.

RLS is enabled on all user tables — verify policies with the Supabase policy tester before launch.

## 4. OpenAI setup (live tutor)

Set `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`). The `/api/tutor` route uses a short timeout and falls back to the deterministic tutor on any failure, so a missing/over-quota key never breaks gameplay.

## 5. Custom domain & SEO

- Add your domain in Vercel → Domains.
- Set `NEXT_PUBLIC_APP_URL` so OpenGraph/Twitter tags and `metadataBase` resolve correctly.

## 6. CI (GitHub Actions)

```yaml
name: ci
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run build
```

Add Lighthouse CI to enforce the ≥95 performance budget (Phase 8).

## 7. Performance checklist (Lighthouse ≥95)

- ✅ All non-API routes prerender statically
- ✅ Fonts via `next/font` with `display: swap`
- ✅ Zero audio assets (Web Audio synthesised SFX)
- ✅ `optimizePackageImports` for `lucide-react` / `framer-motion`
- ✅ `prefers-reduced-motion` respected
- ▶️ Add `next/image` for any future raster art; keep LCP element text-based
- ▶️ Enable Vercel Analytics / Speed Insights

## 8. Observability & operations

- **Errors:** add Sentry (`@sentry/nextjs`).
- **Product analytics:** privacy-respecting (e.g. PostHog/Plausible) — be careful with children's data.
- **Backups:** enable Supabase point-in-time recovery before launch.

## 9. Privacy & compliance (NZ)

LearnQuest handles **children's data**. Before public launch:

- Comply with the **NZ Privacy Act 2020**; document data flows and retention.
- Implement verifiable **parental consent** for under-age accounts.
- Minimise PII; prefer display names over real names; consider data residency.
- Run an accessibility (WCAG 2.2 AA) and independent security review.

# Authentication, roles & institutions

LearnQuest is multi-tenant and role-based. Like the rest of the app it runs in two modes from one codebase:

- **Demo mode** (default) — a complete, browser-local auth backend (`src/lib/auth/store.ts`) so every role and the whole school-onboarding flow work with **zero setup**. Accounts/sessions persist in `localStorage`.
- **Production mode** — the same component layer backed by **Supabase Auth** + RLS-guarded tables (`schools`, `invitations`, `subscriptions`, `audit_log`, `announcements`, and `profiles.school_id`; see `supabase/schema.sql`).

## Roles & access

| Role | Home | Can see / do |
|------|------|--------------|
| `student` | `/dashboard` | Play, earn XP/pets, view own progress & collection |
| `parent` | `/parent` | Analytics for their linked tamariki; manage children; family billing |
| `teacher` | `/teacher` | Classroom: roster, leaderboard, assignments, school join code |
| `school_admin` | `/school` | Manage staff, seats, plan, invites & leaderboard for one school |
| `author` | `/author` | Create & edit content drafts and submit them for review |
| `reviewer` | `/author` | Review, approve & **publish** content; retire items |
| `admin` | `/admin` | Platform-wide: all schools & users, suspend, plans, audit, announcements, content |

`guest` is a `student` with `isGuest: true` — instant play, with an upsell to create an account and keep progress.

## Registration flows

- **Students / Parents / Teachers** → `/register` (a role chooser with a tailored form). Students may join a school with a **school code**; a privacy/parental-consent checkbox is required for students and parents.
- **Institutions** → `/for-schools` ("Want to implement LearnQuest in your school?"). Registering a school creates the `school` + a `school_admin` account, starts a 30-day trial, and generates a unique **join code**.

## Onboarding an institution (the Turnitin-style B2B flow)

1. A school lead registers at **/for-schools** → becomes `school_admin`, lands on **/school**.
2. They **invite kaiako** (teachers) by email and share the **join code**.
3. Teachers register/join with the code (`/register` → teacher), build classes, and share the code with ākonga.
4. Students sign up with the code and are enrolled in the school; the school-admin & platform-admin consoles reflect real counts immediately.

## Route guarding

Client guards live in `src/lib/auth/guard.tsx`:

```tsx
const { ready } = useRequireRole(["teacher"]); // redirects if not a signed-in teacher
return <AppShell>{ready ? <TeacherInner /> : <AuthLoading />}</AppShell>;
```

`useRequireRole()` (no args) just requires being signed in. Unauthenticated users go to `/login?next=…`; wrong-role users are sent to their own home. In production these checks are **defence-in-depth** on top of Supabase RLS — the database is the real boundary.

## Multi-tenancy & security (RLS)

`supabase/schema.sql` enforces tenant isolation with `security definer` helpers:

- `is_self`, `is_guardian`, `teaches` — student/parent/teacher data scoping.
- `is_platform_admin()` — platform admins bypass tenant scoping.
- `my_school_id()` — scopes school reads/writes to the caller's school.

So a teacher only ever sees their own classes' students; a school admin only their school; a platform admin everything. Reward-affecting writes still go through Edge Functions (see [API.md](API.md)) so XP/coins remain server-authoritative.

## Billing & plans

Plans are modelled in `subscriptions` (family or school scoped). The UI is at **/pricing** (Free / Family / School / District). The school-admin console manages plan + seats; the platform-admin console can change any school's plan. Payment provider fields (`provider`, `external_id`) are ready for a Stripe integration (Phase 7) — the demo simply sets the plan directly.

## 🔑 Demo accounts

Seeded automatically on first load. Password for all: **`demo1234`** (or use the one-click buttons on **/login**).

| Role | Email |
|------|-------|
| Platform admin | `admin@learnquest.nz` |
| School admin | `principal@aotearoa.school.nz` |
| Author | `author@learnquest.nz` |
| Reviewer | `reviewer@learnquest.nz` |
| Teacher | `hana@aotearoa.school.nz` |
| Parent | `sarah@learnquest.nz` |
| Student | `aroha@aotearoa.school.nz` |

Demo school **Aotearoa Primary School** has join code **`AOTEAROA`**, 2 teachers and 6 students.

## Switching to production (Supabase Auth)

1. Run `supabase/schema.sql` (includes the institution tables + RLS).
2. Enable Email + social providers in Supabase Auth.
3. Replace the demo backend calls in `src/lib/auth/store.ts` with Supabase Auth (`signUp`, `signInWithPassword`, `signInWithOAuth`) and table reads/writes — **the pages, guards, and `useCurrentAccount()`/role API stay the same**.
4. Move reward writes to Edge Functions; keep client guards as UX.

## Production checklist (children's data)

- Verifiable **parental consent** for under-age accounts (consent flag captured at sign-up).
- Passwords handled only by Supabase Auth (bcrypt server-side) — never stored as in demo mode.
- Email verification + password reset.
- NZ **Privacy Act 2020** alignment, data minimisation, audit retention policy.
- Rate-limiting + bot protection on auth endpoints.

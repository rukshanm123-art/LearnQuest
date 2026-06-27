-- ════════════════════════════════════════════════════════════════════════
--  LearnQuest — PostgreSQL schema for Supabase
--  Run in the Supabase SQL editor, or `supabase db push` with the CLI.
--  Mirrors the TypeScript domain in src/types/index.ts.
-- ════════════════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";

-- ─── Enums ───────────────────────────────────────────────────────────────
create type user_role     as enum ('student', 'parent', 'teacher', 'school_admin', 'author', 'reviewer', 'admin');
create type age_band       as enum ('5-7', '8-10', '11-14');
create type subject_id     as enum ('english','maths','science','social','tech','reo');
create type activity_type  as enum (
  'multiple-choice','drag-and-drop','sentence-building','matching',
  'timed-challenge','reading-comprehension','math-puzzle','science-sim'
);
create type rarity         as enum ('common','rare','epic','legendary');

-- ─── Identity & profiles ─────────────────────────────────────────────────
-- One row per auth user. Children may exist without an auth user (managed by
-- a parent), so `auth_id` is nullable.
create table profiles (
  id           uuid primary key default uuid_generate_v4(),
  auth_id      uuid unique references auth.users (id) on delete cascade,
  role         user_role not null default 'student',
  display_name text not null,
  age_band     age_band,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Parent ⇄ child links (a parent can manage many children; a child can have
-- many guardians).
create table guardianships (
  parent_id uuid references profiles (id) on delete cascade,
  child_id  uuid references profiles (id) on delete cascade,
  primary key (parent_id, child_id)
);

-- ─── Classrooms ──────────────────────────────────────────────────────────
create table classes (
  id           uuid primary key default uuid_generate_v4(),
  teacher_id   uuid not null references profiles (id) on delete cascade,
  name         text not null,
  school       text,
  join_code    text unique not null,
  created_at   timestamptz not null default now()
);

create table class_members (
  class_id   uuid references classes (id) on delete cascade,
  student_id uuid references profiles (id) on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (class_id, student_id)
);

-- ─── Curriculum content ──────────────────────────────────────────────────
create table strands (
  id          text primary key,             -- e.g. 'ma-number'
  subject     subject_id not null,
  name        text not null,
  description text,
  levels      int[] not null default '{}'   -- NZC levels 1..5
);

create table questions (
  id           text primary key,            -- e.g. 'ma-3'
  subject      subject_id not null,
  strand_id    text not null references strands (id),
  age_band     age_band not null,
  level        int not null check (level between 1 and 5),
  type         activity_type not null,
  difficulty   int not null check (difficulty between 1 and 5),
  prompt       text not null,
  passage      text,
  options      jsonb,                        -- string[]
  tokens       jsonb,                        -- string[]
  answer       jsonb not null,               -- number | string
  explanation  text not null,
  xp           int not null default 10,
  coins        int not null default 3,
  active       boolean not null default true,
  created_by   uuid references profiles (id),
  created_at   timestamptz not null default now()
);
create index questions_subject_age_idx on questions (subject, age_band, level) where active;
create index questions_strand_idx       on questions (strand_id);

create table quests (
  id           text primary key,
  subject      subject_id not null,
  title        text not null,
  description  text,
  age_band     age_band not null,
  level        int not null,
  is_boss      boolean not null default false,
  reward_xp    int not null default 0,
  reward_coins int not null default 0,
  question_ids text[] not null default '{}'
);

-- ─── Player progression ──────────────────────────────────────────────────
-- Hot, denormalised counters for fast dashboard reads. The source of truth
-- for XP/coins is the immutable `attempts` + ledger below; this is a cache
-- kept current by triggers / edge functions.
create table player_state (
  profile_id        uuid primary key references profiles (id) on delete cascade,
  total_xp          int not null default 0,
  coins             int not null default 25,
  gems              int not null default 0,
  streak_days       int not null default 0,
  last_active_date  date,
  equipped_pet_id   text,
  equipped_avatar   jsonb not null default '{"base":"base-explorer","hat":null,"outfit":null,"accessory":null}',
  updated_at        timestamptz not null default now()
);

-- Immutable event log — every answer. Powers analytics, weakness detection,
-- and anti-cheat reconciliation.
create table attempts (
  id          bigint generated always as identity primary key,
  profile_id  uuid not null references profiles (id) on delete cascade,
  question_id text not null references questions (id),
  subject     subject_id not null,
  strand_id   text not null,
  correct     boolean not null,
  time_ms     int not null,
  xp_awarded  int not null default 0,
  coins_awarded int not null default 0,
  created_at  timestamptz not null default now()
);
create index attempts_profile_idx on attempts (profile_id, created_at desc);
create index attempts_strand_idx  on attempts (profile_id, strand_id);

-- Rolling per-subject mastery snapshot (updated from attempts).
create table subject_mastery (
  profile_id   uuid references profiles (id) on delete cascade,
  subject      subject_id not null,
  xp           int not null default 0,
  accuracy     real not null default 0,     -- 0..1 EMA
  attempts     int not null default 0,
  weak_strands text[] not null default '{}',
  primary key (profile_id, subject)
);

-- ─── Collectibles & rewards ──────────────────────────────────────────────
create table achievements (
  id          text primary key,
  name        text not null,
  description text,
  icon        text,
  rarity      rarity not null default 'common',
  secret      boolean not null default false
);
create table player_achievements (
  profile_id     uuid references profiles (id) on delete cascade,
  achievement_id text references achievements (id),
  unlocked_at    timestamptz not null default now(),
  primary key (profile_id, achievement_id)
);

create table pets (
  id     text primary key,
  name   text not null,
  species text,
  emoji  text,
  rarity rarity not null default 'common',
  cost   int,                                -- null = reward-gated
  perk   text
);
create table player_pets (
  profile_id  uuid references profiles (id) on delete cascade,
  pet_id      text references pets (id),
  acquired_at timestamptz not null default now(),
  primary key (profile_id, pet_id)
);

create table avatar_parts (
  id   text primary key,
  slot text not null,                        -- base | hat | outfit | accessory
  name text not null,
  emoji text,
  cost int not null default 0
);
create table player_avatar_parts (
  profile_id uuid references profiles (id) on delete cascade,
  part_id    text references avatar_parts (id),
  primary key (profile_id, part_id)
);

-- ─── Daily / events ──────────────────────────────────────────────────────
create table daily_completions (
  profile_id   uuid references profiles (id) on delete cascade,
  day          date not null,
  reward_coins int not null default 0,
  primary key (profile_id, day)
);

-- ─── Assignments (teacher → class) ───────────────────────────────────────
create table assignments (
  id          uuid primary key default uuid_generate_v4(),
  class_id    uuid not null references classes (id) on delete cascade,
  quest_id    text not null references quests (id),
  assigned_by uuid not null references profiles (id),
  due_date    date,
  created_at  timestamptz not null default now()
);
create table assignment_progress (
  assignment_id uuid references assignments (id) on delete cascade,
  student_id    uuid references profiles (id) on delete cascade,
  completed     boolean not null default false,
  score         real,
  completed_at  timestamptz,
  primary key (assignment_id, student_id)
);

-- ─── Leaderboard view ────────────────────────────────────────────────────
create view leaderboard as
select
  p.id                                            as profile_id,
  p.display_name,
  ps.total_xp,
  ps.streak_days,
  rank() over (order by ps.total_xp desc)         as global_rank
from player_state ps
join profiles p on p.id = ps.profile_id
where p.role = 'student';

-- ─── updated_at trigger ──────────────────────────────────────────────────
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger trg_profiles_updated   before update on profiles
  for each row execute function set_updated_at();
create trigger trg_player_state_updated before update on player_state
  for each row execute function set_updated_at();

-- ════════════════════════════════════════════════════════════════════════
--  Row Level Security
--  Children's data is sensitive: students see only their own; parents see
--  their children; teachers see only members of classes they own.
-- ════════════════════════════════════════════════════════════════════════
alter table profiles            enable row level security;
alter table player_state        enable row level security;
alter table attempts            enable row level security;
alter table subject_mastery     enable row level security;
alter table player_achievements enable row level security;
alter table player_pets         enable row level security;

-- Helper: is the current auth user this profile?
create or replace function is_self(p uuid) returns boolean as $$
  select exists (select 1 from profiles where id = p and auth_id = auth.uid());
$$ language sql security definer stable;

-- Helper: is the current user a guardian of this child?
create or replace function is_guardian(child uuid) returns boolean as $$
  select exists (
    select 1 from guardianships g
    join profiles pp on pp.id = g.parent_id
    where g.child_id = child and pp.auth_id = auth.uid()
  );
$$ language sql security definer stable;

-- Helper: does the current teacher own a class this student belongs to?
create or replace function teaches(student uuid) returns boolean as $$
  select exists (
    select 1 from class_members cm
    join classes c    on c.id = cm.class_id
    join profiles tp  on tp.id = c.teacher_id
    where cm.student_id = student and tp.auth_id = auth.uid()
  );
$$ language sql security definer stable;

create policy "read own/child/class profile" on profiles for select
  using (is_self(id) or is_guardian(id) or teaches(id));
create policy "update own profile" on profiles for update using (is_self(id));

create policy "read own/child/class state" on player_state for select
  using (is_self(profile_id) or is_guardian(profile_id) or teaches(profile_id));
create policy "write own state" on player_state for all
  using (is_self(profile_id)) with check (is_self(profile_id));

create policy "read own/child/class attempts" on attempts for select
  using (is_self(profile_id) or is_guardian(profile_id) or teaches(profile_id));
create policy "insert own attempts" on attempts for insert
  with check (is_self(profile_id));

create policy "read mastery" on subject_mastery for select
  using (is_self(profile_id) or is_guardian(profile_id) or teaches(profile_id));
create policy "read achievements" on player_achievements for select
  using (is_self(profile_id) or is_guardian(profile_id) or teaches(profile_id));
create policy "read pets" on player_pets for select using (is_self(profile_id));

-- Content tables (questions, strands, pets…) are world-readable; writes are
-- restricted to the service role used by the authoring tools.
alter table questions enable row level security;
create policy "questions are public" on questions for select using (true);

-- ════════════════════════════════════════════════════════════════════════
--  Institutions, billing & platform admin
--  Powers the "implement in your school" onboarding, the school-admin console
--  and the platform-admin console (mirrors src/lib/auth/*).
-- ════════════════════════════════════════════════════════════════════════

create table schools (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  contact_email text not null,
  region        text,
  join_code     text unique not null,            -- staff/students join with this
  plan          text not null default 'trial',   -- trial | school | district
  status        text not null default 'trial',   -- trial | active | suspended
  seats         int  not null default 30,
  admin_id      uuid references profiles (id),    -- owning school_admin
  trial_ends_at timestamptz,
  created_at    timestamptz not null default now()
);

-- A profile belongs to at most one school; a class can belong to a school.
alter table profiles add column school_id uuid references schools (id);
alter table classes  add column school_id uuid references schools (id);

create table invitations (
  id         uuid primary key default uuid_generate_v4(),
  email      text not null,
  role       user_role not null,
  school_id  uuid references schools (id) on delete cascade,
  code       text not null,
  status     text not null default 'pending',     -- pending | accepted | revoked
  invited_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

-- Billing. Either school_id (institutional) or profile_id (family) is set.
create table subscriptions (
  id                 uuid primary key default uuid_generate_v4(),
  school_id          uuid references schools (id) on delete cascade,
  profile_id         uuid references profiles (id) on delete cascade,
  plan               text not null,               -- free | family | school | district
  status             text not null default 'active', -- trialing | active | past_due | canceled
  seats              int,
  provider           text,                         -- e.g. 'stripe'
  external_id        text,                         -- provider subscription id
  current_period_end timestamptz,
  created_at         timestamptz not null default now(),
  check (school_id is not null or profile_id is not null)
);

create table audit_log (
  id       bigint generated always as identity primary key,
  at       timestamptz not null default now(),
  actor_id uuid references profiles (id),
  action   text not null,
  detail   text
);
create index audit_log_at_idx on audit_log (at desc);

create table announcements (
  id         uuid primary key default uuid_generate_v4(),
  author_id  uuid references profiles (id),
  school_id  uuid references schools (id) on delete cascade, -- null = platform-wide
  title      text not null,
  body       text,
  audience   text not null default 'all',          -- all | teachers | parents | students | school_admins
  created_at timestamptz not null default now()
);

-- ─── RLS helpers for the institution layer ───────────────────────────────
create or replace function is_platform_admin() returns boolean as $$
  select exists (select 1 from profiles where auth_id = auth.uid() and role = 'admin');
$$ language sql security definer stable;

create or replace function my_school_id() returns uuid as $$
  select school_id from profiles where auth_id = auth.uid();
$$ language sql security definer stable;

-- ─── RLS policies ────────────────────────────────────────────────────────
alter table schools       enable row level security;
alter table invitations   enable row level security;
alter table subscriptions enable row level security;
alter table audit_log     enable row level security;
alter table announcements enable row level security;

create policy "read own school or platform admin" on schools for select
  using (id = my_school_id() or is_platform_admin());
create policy "school admin updates own school" on schools for update
  using (admin_id = (select id from profiles where auth_id = auth.uid()) or is_platform_admin());
create policy "platform admin manages schools" on schools for all
  using (is_platform_admin()) with check (is_platform_admin());

create policy "school staff read invitations" on invitations for select
  using (school_id = my_school_id() or is_platform_admin());

create policy "read own subscription" on subscriptions for select
  using (school_id = my_school_id()
      or profile_id = (select id from profiles where auth_id = auth.uid())
      or is_platform_admin());

create policy "platform admin reads audit" on audit_log for select
  using (is_platform_admin());

create policy "read relevant announcements" on announcements for select
  using (school_id is null or school_id = my_school_id() or is_platform_admin());
create policy "platform admin posts announcements" on announcements for all
  using (is_platform_admin()) with check (is_platform_admin());

-- ════════════════════════════════════════════════════════════════════════
--  Content authoring (#01/#02) — workflow, taxonomy & RLS
--  Mirrors src/lib/content/* and src/lib/curriculum/objectives.ts.
-- ════════════════════════════════════════════════════════════════════════
create type content_status as enum ('draft', 'in_review', 'published', 'retired');

alter table questions add column if not exists status        content_status not null default 'published';
alter table questions add column if not exists version       int not null default 1;
alter table questions add column if not exists year          int;
alter table questions add column if not exists objective_ids text[] not null default '{}';
alter table questions add column if not exists author_id     uuid references profiles (id);
alter table questions add column if not exists author_name   text;
alter table questions add column if not exists reviewer_id   uuid references profiles (id);
alter table questions add column if not exists updated_at    timestamptz not null default now();
create index if not exists questions_status_idx on questions (status);

-- NZC achievement objectives (taxonomy backbone, #02).
create table if not exists curriculum_objectives (
  id              text primary key,
  subject         subject_id not null,
  strand_id       text references strands (id),
  year            int not null check (year between 1 and 8),
  level           int not null check (level between 1 and 5),
  code            text,
  description     text,
  prerequisite_ids text[] not null default '{}'
);

-- Content-staff helpers.
create or replace function is_content_staff() returns boolean as $$
  select exists (select 1 from profiles where auth_id = auth.uid() and role in ('author', 'reviewer', 'admin'));
$$ language sql security definer stable;

create or replace function is_content_reviewer() returns boolean as $$
  select exists (select 1 from profiles where auth_id = auth.uid() and role in ('reviewer', 'admin'));
$$ language sql security definer stable;

-- Learners see only PUBLISHED items; content staff see everything.
drop policy if exists "questions are public" on questions;
create policy "read published or staff" on questions for select
  using (status = 'published' or is_content_staff());
-- Authors may create/edit; reviewers/admins may publish & delete.
create policy "content staff insert" on questions for insert with check (is_content_staff());
create policy "content staff update" on questions for update using (is_content_staff());
create policy "content reviewer delete" on questions for delete using (is_content_reviewer());

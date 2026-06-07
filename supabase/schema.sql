-- ════════════════════════════════════════════════════════════════
-- Fitness PR Tracker — Supabase / PostgreSQL schema
-- Paste this whole file into the Supabase SQL Editor and click "Run".
--
-- Design notes:
--  • exercise_id columns are TEXT slugs (e.g. 'flat-bench-press') that match
--    the static exercise library in the app — so there's no exercises table
--    to seed.
--  • A trigger auto-creates a profile row in public.users whenever someone
--    signs up, reading username/age/sex/unit from the signup metadata.
--  • RLS: profiles + PRs are readable by any signed-in user (needed for
--    search + leaderboards); everything is writable only by its owner.
-- ════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ── users (profile; id mirrors auth.users.id) ───────────────────
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  username text unique not null,
  age integer not null default 0,
  sex text not null default 'Other',
  profile_picture_url text,
  unit_preference text not null default 'kg' check (unit_preference in ('kg','lbs')),
  created_at timestamptz not null default now()
);

-- Auto-create the profile when a new auth user is created.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, username, age, sex, unit_preference)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'age')::int, 0),
    coalesce(new.raw_user_meta_data->>'sex', 'Other'),
    coalesce(new.raw_user_meta_data->>'unit_preference', 'kg')
  );
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- ── routines ────────────────────────────────────────────────────
-- routine_type holds the day's custom label (e.g. "Chest & Triceps").
-- display_order keeps the days in sequence.
create table if not exists public.user_routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  routine_type text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.user_routines(id) on delete cascade,
  exercise_id text not null,
  display_order integer not null default 0
);

-- ── workouts (sessions + rest days) ─────────────────────────────
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  workout_type text not null, -- the day's label (e.g. "Push", "Arms") or "Rest"
  workout_date date not null,
  is_rest_day boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists workouts_user_date_idx on public.workouts(user_id, workout_date);

create table if not exists public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  exercise_id text not null,
  display_order integer not null default 0
);
create table if not exists public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references public.workout_exercises(id) on delete cascade,
  set_number integer not null,
  reps integer not null default 0,
  weight numeric not null default 0,
  unit text not null default 'kg'
);

-- ── personal_prs (highest weight per user+exercise) ─────────────
create table if not exists public.personal_prs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  exercise_id text not null,
  best_weight numeric not null,
  unit text not null default 'kg',
  workout_id uuid references public.workouts(id) on delete set null,
  achieved_at timestamptz not null default now(),
  unique (user_id, exercise_id)
);

-- ── friends ─────────────────────────────────────────────────────
create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_user_id uuid not null references public.users(id) on delete cascade,
  receiver_user_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','rejected')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (sender_user_id, receiver_user_id)
);
create table if not exists public.friends (
  id uuid primary key default gen_random_uuid(),
  user_id_1 uuid not null references public.users(id) on delete cascade,
  user_id_2 uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (user_id_1 <> user_id_2)
);

-- ── food_logs (weekly-ephemeral; calorie range + per-item breakdown) ──
create table if not exists public.food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  log_date date not null,
  raw_text text not null,
  health_score integer not null check (health_score between 1 and 10),
  explanation text,
  calories_low numeric,
  calories_high numeric,
  calories_partial boolean default false,
  items jsonb,
  created_at timestamptz not null default now()
);

-- ════════════════════════════ RLS ══════════════════════════════
alter table public.users enable row level security;
alter table public.user_routines enable row level security;
alter table public.routine_exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_sets enable row level security;
alter table public.personal_prs enable row level security;
alter table public.friend_requests enable row level security;
alter table public.friends enable row level security;
alter table public.food_logs enable row level security;

-- users: any signed-in user can read profiles (search + leaderboards);
-- you may only update your own. (Insert is done by the signup trigger.)
create policy users_select on public.users for select to authenticated using (true);
create policy users_update on public.users for update to authenticated using (auth.uid() = id);

-- routines: private to the owner
create policy routines_all on public.user_routines for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy routine_ex_all on public.routine_exercises for all to authenticated
  using (exists (select 1 from public.user_routines r where r.id = routine_id and r.user_id = auth.uid()))
  with check (exists (select 1 from public.user_routines r where r.id = routine_id and r.user_id = auth.uid()));

-- workouts: private to the owner
create policy workouts_all on public.workouts for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy workout_ex_all on public.workout_exercises for all to authenticated
  using (exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid()))
  with check (exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid()));
create policy workout_sets_all on public.workout_sets for all to authenticated
  using (exists (
    select 1 from public.workout_exercises we
    join public.workouts w on w.id = we.workout_id
    where we.id = workout_exercise_id and w.user_id = auth.uid()))
  with check (exists (
    select 1 from public.workout_exercises we
    join public.workouts w on w.id = we.workout_id
    where we.id = workout_exercise_id and w.user_id = auth.uid()));

-- PRs: any signed-in user can read (leaderboards); only the owner writes.
create policy prs_select on public.personal_prs for select to authenticated using (true);
create policy prs_write on public.personal_prs for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- friend requests: only the two parties can see / act on them
create policy fr_select on public.friend_requests for select to authenticated
  using (auth.uid() = sender_user_id or auth.uid() = receiver_user_id);
create policy fr_insert on public.friend_requests for insert to authenticated
  with check (auth.uid() = sender_user_id);
create policy fr_update on public.friend_requests for update to authenticated
  using (auth.uid() = sender_user_id or auth.uid() = receiver_user_id);
create policy fr_delete on public.friend_requests for delete to authenticated
  using (auth.uid() = sender_user_id or auth.uid() = receiver_user_id);

-- friendships: visible to / editable by either party
create policy friends_select on public.friends for select to authenticated
  using (auth.uid() = user_id_1 or auth.uid() = user_id_2);
create policy friends_insert on public.friends for insert to authenticated
  with check (auth.uid() = user_id_1 or auth.uid() = user_id_2);
create policy friends_delete on public.friends for delete to authenticated
  using (auth.uid() = user_id_1 or auth.uid() = user_id_2);

-- food: private to the owner
create policy food_all on public.food_logs for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════════
-- OPTIONAL: weekly food-log cleanup (the app also prunes on read/write).
-- Needs the pg_cron extension (Database → Extensions → enable "pg_cron").
-- ════════════════════════════════════════════════════════════════
-- select cron.schedule('purge-old-food-logs', '5 0 * * 1',
--   $$ delete from public.food_logs where log_date < date_trunc('week', now())::date $$);

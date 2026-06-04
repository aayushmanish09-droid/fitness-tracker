# 🏋️ PR Tracker — Social Fitness PR Tracker

A simple, fast, focused web app for lifters. Build your own routines from a large
exercise library, log sets/reps/weight, automatically track your highest-weight
**PRs**, see your monthly progression, view your training on a **color-coded
calendar**, add friends, and battle it out on **exercise-specific leaderboards**.
Plus a lightweight free-text **food log** with a 1–10 health score.

> Two questions, answered: **"Am I lifting heavier over time?"** and
> **"Who has the highest PR for this exercise?"**

Built with **React + Vite**, **Tailwind CSS**, **Recharts**, and a clean service
layer that runs on **localStorage out of the box** (zero setup) and is ready to
swap to **Supabase**.

---

## ✨ Design

Dark, athletic, energetic — inspired by modern fitness UIs.

- **Theme:** layered near-black surfaces + a punchy **lime / chartreuse** accent (`#C7F716`)
- **Type:** `Barlow Condensed` (display) + `Barlow` (body) — condensed, sporty
- **Workout color coding:** Push · blue, Pull · red, Legs · green, Upper · purple,
  Lower · orange, Rest · gray
- Fully responsive (desktop top-nav, mobile bottom tab bar), accessible focus
  states, `prefers-reduced-motion` respected, SVG icons (no emoji).

---

## 🚀 Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build
npm run preview  # preview the build
```

### Try it instantly — demo account

On the login screen click **“Explore the demo account”** (or log in with):

```
email:    demo@prtracker.app
password: demo1234
```

The demo account (`@aayushlifts`) comes pre-loaded with **5 routines**, **~6 months
of workout history** (so the calendar and charts are full), PRs, **3 friends** with
their own PRs, **1 pending friend request**, and food logs.

> Fresh sign-ups start empty (as the spec requires — no default routines) but get
> one pending friend request and searchable demo users so the social features work.

---

## 🧭 The 3 sections

| Tab | What it does |
| --- | --- |
| **Log** | Start Workout · Log Rest Day · Log Food · recent activity |
| **Progress** | Personal PR summary → Workout Calendar → Monthly progression charts |
| **Friends** | Search users · friend requests · friend list · exercise leaderboards |

### Core flows
- **Routine Builder** — pick a type (Push/Pull/Legs/Upper/Lower), search & filter the
  exercise library by muscle group, add/remove/reorder, save. One routine per type.
- **Workout Logger** — your saved routine loads automatically; enter sets/reps/weight,
  add sets, **add an extra exercise just for that session** (without touching the routine),
  and on save the app detects **new PRs** (highest weight ever) and celebrates them.
- **Edit / delete past workouts** — tap any **calendar day** or any **recent-activity row**
  to reopen a saved workout, fix its sets/exercises/date, or delete it. PRs **recalculate
  from your full history** afterward, so dropping or removing a top lift correctly lowers the PR.
- **Workout Calendar** — replaces the traditional history list. Color-coded days (tap to edit),
  always-visible legend, monthly training-distribution summary, month navigation
  (prev / next / today).
- **Leaderboards** — per exercise, ranks **you + accepted friends** by PR (never global).
- **Food** — free-text entry → a **1–10 health score with per-item reasoning** (why each
  food helped or hurt: "high in protein", "mostly added sugar") **plus a calorie estimate
  as a range**. Staples use known facts (rice ≈130 kcal/100g, 1 banana ≈105 kcal); composite
  items widen the range and react to modifiers (grilled vs fried patty, double, extra sauce).
  Food logs are **weekly-ephemeral** — automatically cleared at the start of each week
  (workouts/PRs are kept permanently).
- **Profile** (tap your avatar, top-right) — change your **profile picture** (pick from your
  photo library **or take one with your camera**), edit your **username**, and **change your
  password**. Pictures are auto-cropped & downscaled; the camera falls back to file-pick if
  no camera/permission.

---

## 🗂️ Project structure

```
src/
  lib/
    constants.js          workout types, colors, muscle groups
    exerciseLibrary.js     full shared exercise library (stable slug ids)
    foodScore.js           rule-based 1–10 food scoring
    prLogic.js             PR + monthly-series helpers
    db.js                  localStorage-backed store (mirrors the SQL schema)
    seed.js                deterministic demo data
  services/
    api.js                 ← seam: switches backend via VITE_DATA_BACKEND
    localApi.js            localStorage backend (default)
    supabaseApi.js         Supabase backend (real multi-user)
    supabaseClient.js      Supabase client (created from env keys)
  context/AuthContext.jsx
  components/              ui kit, Layout, Modal, Toaster, WorkoutCalendar,
                           ExerciseProgressChart, CameraCapture, AuthShell
  pages/                   Login, Signup, Log, RoutineBuilder, WorkoutLogger,
                           Progress, ExerciseDetail, Friends, Profile
supabase/schema.sql        Postgres schema + RLS + signup trigger
```

---

## 🔌 Data backend (localStorage → Supabase)

The UI **only ever imports from `src/services/api.js`**, which is a thin switch:

```
services/
  api.js            ← switch (picks one of the two below via env)
  localApi.js       ← localStorage backend (default, zero-config)
  supabaseApi.js    ← Supabase backend (real multi-user)
  supabaseClient.js
```

- **Default (`local`)** — everything persists in `localStorage`. No setup, fully
  functional, great for demos and single-device use. (Friends/leaderboards use the
  seeded demo users — they don't sync across devices.)
- **Supabase (`supabase`)** — real accounts, real friends & leaderboards across
  devices. **Both backends are fully implemented** — you only flip the env flag.

### Turn on Supabase (5 steps)
1. Create a free project at [supabase.com](https://supabase.com).
2. **SQL Editor → New query →** paste all of [`supabase/schema.sql`](./supabase/schema.sql) → **Run**.
3. **Authentication → Providers → Email →** turn **OFF "Confirm email"** (so signup logs you
   straight in). *(Optional — leave it on if you want email verification.)*
4. **Project Settings → API →** copy the **Project URL** and **anon public key** into a new
   `.env` file (copy `.env.example`):
   ```
   VITE_DATA_BACKEND=supabase
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
5. `npm run dev` (or redeploy). Sign up a real account — done.

> Deploying? Add those same 3 env vars in your host (Vercel → Project → Settings →
> Environment Variables), then redeploy.

How it stays secure: **Row Level Security** is enabled on every table — profiles and PRs
are readable by signed-in users (needed for search + leaderboards), but everything is
**writable only by its owner**. A signup trigger auto-creates each user's profile.

Recommended hosting: **Vercel** (frontend) + **Supabase** (DB/Auth).

---

## ✅ Acceptance criteria (all met)

Sign up · log in · choose kg/lbs · build Push + Pull/Legs/Upper/Lower routines ·
start a workout (saved routine auto-loads) · enter sets/reps/weight · save ·
PR updates when a higher weight is logged · personal PR list · per-exercise monthly
progression · search a user by username · send/accept/reject friend requests ·
friend list · exercise leaderboard ranking accepted friends by PR · free-text food
log with a 1–10 score.

**Deliberately excluded (per spec):** macros/quantities, rep/volume PRs, estimated 1RM,
weekly/daily charts, overall/monthly/food leaderboards, water tracking, timers,
coaching, activity feeds, etc. The app stays simple and focused.

> **Food add-ons (beyond the original spec, by request):** lightweight calorie
> *estimates* (ranges, not precise macro tracking), clear per-item reasoning, and
> weekly auto-clearing of food logs. These are intentional extensions of the
> "keep food simple" rule, not a full nutrition tracker.

---

## 🛠️ Tech

React 18 · Vite 5 · React Router 6 · Tailwind CSS 3 · Recharts · lucide-react ·
@supabase/supabase-js

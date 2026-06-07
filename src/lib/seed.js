// Deterministic seed data so the app is demoable on first load.
// Creates: a rich demo account, friends with PRs, searchable users,
// a pending incoming request, ~6 months of workout history + food logs.

import { readDB, writeDB, uid } from './db.js'
import { EXERCISE_LIBRARY } from './exerciseLibrary.js'
import { calculateFoodHealthScore } from './foodScore.js'

const NAME_TO_ID = Object.fromEntries(EXERCISE_LIBRARY.map((e) => [e.name, e.id]))
const exId = (name) => {
  const id = NAME_TO_ID[name]
  if (!id) throw new Error('Unknown exercise in seed: ' + name)
  return id
}

const round25 = (x) => Math.round(x / 2.5) * 2.5
const toDateStr = (d) => d.toISOString().slice(0, 10)

// ── Demo account routines ───────────────────────────────────────
const DEMO_ROUTINES = {
  Push: [
    'Flat Bench Press',
    'Incline Dumbbell Bench Press',
    'Machine Chest Press',
    'Cable Fly',
    'Barbell Shoulder Press',
    'Lateral Raise',
    'Tricep Pushdown',
  ],
  Pull: [
    'Pull-Up',
    'Lat Pulldown',
    'Barbell Row',
    'Seated Cable Row',
    'Face Pull',
    'Barbell Curl',
    'Hammer Curl',
  ],
  Legs: [
    'Squat',
    'Leg Press',
    'Romanian Deadlift',
    'Leg Extension',
    'Hamstring Curl',
    'Standing Calf Raise',
  ],
  Upper: [
    'Flat Bench Press',
    'Barbell Row',
    'Barbell Shoulder Press',
    'Lat Pulldown',
    'Dumbbell Curl',
    'Tricep Pushdown',
  ],
  Lower: [
    'Squat',
    'Romanian Deadlift',
    'Leg Press',
    'Hip Thrust',
    'Leg Extension',
    'Seated Calf Raise',
  ],
}

// base weight (kg, ~6 months ago) + monthly growth for the demo user
const DEMO_PROGRESSION = {
  'Flat Bench Press': { base: 62, growth: 4 },
  'Incline Dumbbell Bench Press': { base: 24, growth: 1.5 },
  'Machine Chest Press': { base: 60, growth: 3.5 },
  'Cable Fly': { base: 12, growth: 0.6 },
  'Barbell Shoulder Press': { base: 38, growth: 2.8 },
  'Lateral Raise': { base: 8, growth: 0.4 },
  'Tricep Pushdown': { base: 25, growth: 1.5 },
  'Pull-Up': { base: 0, growth: 0 },
  'Lat Pulldown': { base: 50, growth: 3 },
  'Barbell Row': { base: 55, growth: 3.2 },
  'Seated Cable Row': { base: 50, growth: 2.5 },
  'Face Pull': { base: 18, growth: 0.8 },
  'Barbell Curl': { base: 25, growth: 1.4 },
  'Hammer Curl': { base: 14, growth: 0.7 },
  'Dumbbell Curl': { base: 12, growth: 0.6 },
  Squat: { base: 80, growth: 6.5 },
  'Leg Press': { base: 130, growth: 12 },
  'Romanian Deadlift': { base: 70, growth: 6.5 },
  'Leg Extension': { base: 45, growth: 2.5 },
  'Hamstring Curl': { base: 35, growth: 2 },
  'Standing Calf Raise': { base: 60, growth: 3 },
  'Seated Calf Raise': { base: 50, growth: 2.5 },
  'Hip Thrust': { base: 80, growth: 6 },
}

function weightFor(name, monthsProgress) {
  const p = DEMO_PROGRESSION[name] || { base: 20, growth: 1 }
  if (p.base === 0) return 0 // bodyweight
  return round25(p.base + p.growth * monthsProgress)
}

// weekly schedule -> workout type (null = no entry that day)
const WEEKLY = {
  1: 'Push', // Mon
  2: 'Pull', // Tue
  3: 'Legs', // Wed
  4: 'Rest', // Thu
  5: 'Upper', // Fri
  6: 'Lower', // Sat
  0: 'Rest', // Sun
}

// seeded RNG so the demo is stable across reloads
function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── Friends / searchable users + their leaderboard PRs ──────────
const LEADERBOARD_PRS = {
  marklifts: {
    'Flat Bench Press': 100, 'Incline Bench Press': 80, 'Machine Chest Press': 110,
    Squat: 130, 'Leg Press': 220, 'Romanian Deadlift': 120,
    'Barbell Shoulder Press': 60, 'Barbell Row': 80, 'Dumbbell Row': 40,
  },
  staceyfit: {
    'Flat Bench Press': 72, 'Incline Bench Press': 55, 'Machine Chest Press': 82,
    Squat: 140, 'Leg Press': 205, 'Romanian Deadlift': 132,
    'Barbell Shoulder Press': 45, 'Barbell Row': 65, 'Dumbbell Row': 32,
  },
  johnbench: {
    'Flat Bench Press': 95, 'Incline Bench Press': 75, 'Machine Chest Press': 100,
    Squat: 112, 'Leg Press': 185, 'Romanian Deadlift': 102,
    'Barbell Shoulder Press': 55, 'Barbell Row': 70, 'Dumbbell Row': 36,
  },
  ryan_pr: {
    'Flat Bench Press': 90, 'Incline Bench Press': 78, 'Machine Chest Press': 105,
    Squat: 125, 'Leg Press': 210, 'Romanian Deadlift': 116,
    'Barbell Shoulder Press': 57, 'Barbell Row': 74, 'Dumbbell Row': 38,
  },
  lift_emma: {
    'Flat Bench Press': 60, 'Incline Bench Press': 45, 'Machine Chest Press': 70,
    Squat: 100, 'Leg Press': 160, 'Romanian Deadlift': 95,
    'Barbell Shoulder Press': 35, 'Barbell Row': 55, 'Dumbbell Row': 26,
  },
  deadlift_dan: {
    'Flat Bench Press': 110, 'Incline Bench Press': 85, 'Machine Chest Press': 120,
    Squat: 150, 'Leg Press': 240, 'Romanian Deadlift': 140,
    'Barbell Shoulder Press': 62, 'Barbell Row': 85, 'Dumbbell Row': 44,
  },
}

const DEMO_USERS = [
  { username: 'marklifts', email: 'mark@demo.app', age: 28, sex: 'Male', unit_preference: 'kg' },
  { username: 'staceyfit', email: 'stacey@demo.app', age: 26, sex: 'Female', unit_preference: 'kg' },
  { username: 'johnbench', email: 'john@demo.app', age: 31, sex: 'Male', unit_preference: 'kg' },
  { username: 'ryan_pr', email: 'ryan@demo.app', age: 24, sex: 'Male', unit_preference: 'kg' },
  { username: 'lift_emma', email: 'emma@demo.app', age: 27, sex: 'Female', unit_preference: 'kg' },
  { username: 'deadlift_dan', email: 'dan@demo.app', age: 33, sex: 'Male', unit_preference: 'kg' },
]

const DEMO_PASSWORD = 'demo1234'

function makeUser(db, { username, email, age, sex, unit_preference }) {
  const id = uid()
  db.users.push({
    id,
    email,
    username,
    age,
    sex,
    unit_preference,
    profile_picture_url: null,
    created_at: new Date().toISOString(),
  })
  db._passwords[id] = DEMO_PASSWORD
  return id
}

function setPR(db, userId, exerciseName, weight, unit = 'kg') {
  db.personal_prs.push({
    id: uid(),
    user_id: userId,
    exercise_id: exId(exerciseName),
    best_weight: weight,
    unit,
    workout_id: null,
    achieved_at: new Date().toISOString(),
  })
}

function setRoutine(db, userId, routineType, exerciseNames, order = 0) {
  const routineId = uid()
  const now = new Date().toISOString()
  db.user_routines.push({
    id: routineId,
    user_id: userId,
    routine_type: routineType,
    display_order: order,
    created_at: now,
    updated_at: now,
  })
  exerciseNames.forEach((name, i) => {
    db.routine_exercises.push({
      id: uid(),
      routine_id: routineId,
      exercise_id: exId(name),
      display_order: i,
    })
  })
}

// Generate ~6 months of workout history for the demo user + PRs.
function generateHistory(db, userId) {
  const rand = mulberry32(20260602)
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const start = new Date(today)
  start.setDate(start.getDate() - 183) // ~6 months

  const bestByExercise = {} // exerciseName -> { weight, workoutId, date }

  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay()
    const type = WEEKLY[dow]
    if (!type) continue
    // skip ~12% of training days, ~30% of scheduled rest days
    const skipChance = type === 'Rest' ? 0.3 : 0.12
    if (rand() < skipChance) continue

    const dateStr = toDateStr(d)
    const monthsProgress = (d - start) / (1000 * 60 * 60 * 24 * 30)

    const workoutId = uid()
    const isRest = type === 'Rest'
    db.workouts.push({
      id: workoutId,
      user_id: userId,
      workout_type: type,
      workout_date: dateStr,
      is_rest_day: isRest,
      created_at: new Date(d).toISOString(),
    })
    if (isRest) continue

    const exercises = DEMO_ROUTINES[type]
    exercises.forEach((name, i) => {
      const weId = uid()
      db.workout_exercises.push({
        id: weId,
        workout_id: workoutId,
        exercise_id: exId(name),
        display_order: i,
      })
      const top = weightFor(name, monthsProgress)
      // 3 sets: warmup, mid, top (with small jitter that never exceeds top)
      const sets = [
        { reps: 10, w: round25(top * 0.85) },
        { reps: 8, w: round25(top * 0.92) },
        { reps: 6, w: top },
      ]
      sets.forEach((s, si) => {
        db.workout_sets.push({
          id: uid(),
          workout_exercise_id: weId,
          set_number: si + 1,
          reps: s.reps,
          weight: s.w,
          unit: 'kg',
        })
      })
      // track PR
      const prev = bestByExercise[name]
      if (!prev || top > prev.weight) {
        bestByExercise[name] = { weight: top, workoutId, date: dateStr }
      }
    })
  }

  // write personal PRs from generated history
  for (const [name, info] of Object.entries(bestByExercise)) {
    if (info.weight <= 0) continue
    db.personal_prs.push({
      id: uid(),
      user_id: userId,
      exercise_id: exId(name),
      best_weight: info.weight,
      unit: 'kg',
      workout_id: info.workoutId,
      achieved_at: new Date(info.date).toISOString(),
    })
  }
}

function seedFoodLogs(db, userId) {
  const samples = [
    { daysAgo: 0, text: 'oats, banana, protein shake, eggs' },
    { daysAgo: 1, text: 'grilled chicken, rice, broccoli, greek yogurt' },
    { daysAgo: 2, text: 'pizza, coke, fries' },
    { daysAgo: 3, text: 'salmon, sweet potato, salad, almonds' },
    { daysAgo: 4, text: 'protein shake, sandwich, apple' },
    { daysAgo: 6, text: 'burger, fries, soda, ice cream' },
    { daysAgo: 7, text: 'eggs, spinach, oatmeal, cottage cheese' },
  ]
  for (const s of samples) {
    const d = new Date()
    d.setDate(d.getDate() - s.daysAgo)
    const { score, explanation, calories, items } = calculateFoodHealthScore(s.text)
    db.food_logs.push({
      id: uid(),
      user_id: userId,
      log_date: toDateStr(d),
      raw_text: s.text,
      health_score: score,
      explanation,
      calories_low: calories.low,
      calories_high: calories.high,
      calories_partial: calories.partial,
      items,
      created_at: d.toISOString(),
    })
  }
}

function makeFriendship(db, a, b) {
  db.friends.push({
    id: uid(),
    user_id_1: a,
    user_id_2: b,
    created_at: new Date().toISOString(),
  })
}

// Add a pending incoming friend request to a (new) user from a demo user.
export function addStarterIncomingRequest(userId) {
  const db = readDB()
  const ryan = db.users.find((u) => u.username === 'ryan_pr')
  if (!ryan) return
  const exists = db.friend_requests.find(
    (r) =>
      r.sender_user_id === ryan.id &&
      r.receiver_user_id === userId &&
      r.status === 'pending',
  )
  const alreadyFriends = db.friends.find(
    (f) =>
      (f.user_id_1 === ryan.id && f.user_id_2 === userId) ||
      (f.user_id_2 === ryan.id && f.user_id_1 === userId),
  )
  if (!exists && !alreadyFriends) {
    db.friend_requests.push({
      id: uid(),
      sender_user_id: ryan.id,
      receiver_user_id: userId,
      status: 'pending',
      created_at: new Date().toISOString(),
      responded_at: null,
    })
  }
  writeDB(db)
}

export function seedIfNeeded() {
  const db = readDB()
  if (db._seeded) return

  // 1) demo "other" users + their leaderboard PRs
  const userIdByName = {}
  for (const u of DEMO_USERS) {
    const id = makeUser(db, u)
    userIdByName[u.username] = id
    const prs = LEADERBOARD_PRS[u.username]
    if (prs) {
      for (const [exName, w] of Object.entries(prs)) setPR(db, id, exName, w)
    }
  }

  // 2) the demo account the user logs into
  const demoId = uid()
  db.users.push({
    id: demoId,
    email: 'demo@prtracker.app',
    username: 'aayushlifts',
    age: 24,
    sex: 'Male',
    unit_preference: 'kg',
    profile_picture_url: null,
    created_at: new Date().toISOString(),
  })
  db._passwords[demoId] = DEMO_PASSWORD

  // routines (Push, Pull, Legs, Upper, Lower) → the demo's 5-day split
  Object.entries(DEMO_ROUTINES).forEach(([type, names], i) => {
    setRoutine(db, demoId, type, names, i)
  })
  // history + PRs + food
  generateHistory(db, demoId)
  seedFoodLogs(db, demoId)

  // friendships: aayushlifts is friends with mark, stacey, john
  makeFriendship(db, demoId, userIdByName.marklifts)
  makeFriendship(db, demoId, userIdByName.staceyfit)
  makeFriendship(db, demoId, userIdByName.johnbench)

  // pending incoming request from ryan_pr -> demo account
  db.friend_requests.push({
    id: uid(),
    sender_user_id: userIdByName.ryan_pr,
    receiver_user_id: demoId,
    status: 'pending',
    created_at: new Date().toISOString(),
    responded_at: null,
  })

  db._seeded = true
  writeDB(db)
}

export const DEMO_CREDENTIALS = { email: 'demo@prtracker.app', password: DEMO_PASSWORD }

// ─────────────────────────────────────────────────────────────────
// Service layer — the single seam between UI and data.
// Every spec API function lives here. Backed by the localStorage DB.
// To move to Supabase: implement the same function signatures against
// the Supabase client (see supabaseClient.js) and switch the export.
// Screens never import the DB directly, so they don't change.
// ─────────────────────────────────────────────────────────────────

import {
  readDB,
  writeDB,
  mutate,
  uid,
  getSessionUserId,
  setSessionUserId,
} from '../lib/db.js'
import { EXERCISE_LIBRARY, EXERCISE_BY_ID } from '../lib/exerciseLibrary.js'
import { calculateFoodHealthScore } from '../lib/foodScore.js'
import { maxWeightFromSets, buildMonthlySeries, filterSeriesByRange } from '../lib/prLogic.js'
import { seedIfNeeded, addStarterIncomingRequest } from '../lib/seed.js'
import { isSupabaseConfigured } from './supabaseClient.js'

// Seed the local demo data whenever this (local) backend is the one actually
// running. Supabase only "wins" when the flag is set AND the keys are present;
// if someone sets VITE_DATA_BACKEND=supabase but hasn't pasted their keys yet,
// we fall back to local — and must still seed so the app isn't empty.
const usingSupabase = import.meta.env.VITE_DATA_BACKEND === 'supabase' && isSupabaseConfigured
if (!usingSupabase) {
  seedIfNeeded()
  pruneFoodLogs() // food is weekly-ephemeral — clear anything before this week
}

const ok = (v) => Promise.resolve(v)
const fail = (msg) => Promise.reject(new Error(msg))
const exObj = (id) => EXERCISE_BY_ID[id] || { id, name: 'Unknown', muscle_group: '', category: '' }

// ════════════════════════════ AUTH ════════════════════════════
export function getCurrentUser() {
  const id = getSessionUserId()
  if (!id) return ok(null)
  const db = readDB()
  return ok(db.users.find((u) => u.id === id) || null)
}

export function login(email, password) {
  const db = readDB()
  const user = db.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase())
  if (!user) return fail('No account found with that email.')
  if (db._passwords[user.id] !== password) return fail('Incorrect password.')
  setSessionUserId(user.id)
  return ok(user)
}

export function signUp(email, password, profileData) {
  const db = readDB()
  const emailLc = String(email).toLowerCase()
  if (db.users.some((u) => u.email.toLowerCase() === emailLc))
    return fail('An account with that email already exists.')
  if (db.users.some((u) => u.username.toLowerCase() === String(profileData.username).toLowerCase()))
    return fail('That username is taken — pick another.')

  const id = uid()
  const user = {
    id,
    email,
    username: profileData.username,
    age: Number(profileData.age),
    sex: profileData.sex,
    unit_preference: profileData.unit_preference || 'kg',
    profile_picture_url: profileData.profile_picture_url || null,
    created_at: new Date().toISOString(),
  }
  db.users.push(user)
  db._passwords[id] = password
  writeDB(db)

  // give new users one pending request so social flow is demoable
  addStarterIncomingRequest(id)
  setSessionUserId(id)
  return ok(user)
}

export function logout() {
  setSessionUserId(null)
  return ok(true)
}

export function getUserById(id) {
  const db = readDB()
  return ok(db.users.find((u) => u.id === id) || null)
}

const USERNAME_RE = /^[a-zA-Z0-9_.]{3,20}$/

// Update editable profile fields: username and/or profile_picture_url.
// Pass profile_picture_url: null to remove the photo.
export function updateProfile(userId, updates) {
  const db = readDB()
  const user = db.users.find((u) => u.id === userId)
  if (!user) return fail('User not found.')

  if (updates.username != null) {
    const uname = String(updates.username).trim()
    if (!USERNAME_RE.test(uname))
      return fail('Username must be 3–20 characters: letters, numbers, _ or . only.')
    if (db.users.some((u) => u.id !== userId && u.username.toLowerCase() === uname.toLowerCase()))
      return fail('That username is taken — pick another.')
    user.username = uname
  }

  if (updates.profile_picture_url !== undefined) {
    user.profile_picture_url = updates.profile_picture_url
  }

  writeDB(db)
  return ok(user)
}

export function changePassword(userId, currentPassword, newPassword) {
  const db = readDB()
  const user = db.users.find((u) => u.id === userId)
  if (!user) return fail('User not found.')
  if (db._passwords[userId] !== currentPassword) return fail('Current password is incorrect.')
  if (!newPassword || newPassword.length < 6) return fail('New password must be at least 6 characters.')
  if (newPassword === currentPassword) return fail('New password must be different from the current one.')
  db._passwords[userId] = newPassword
  writeDB(db)
  return ok(true)
}

// ════════════════════════ EXERCISES ═══════════════════════════
export function getExerciseLibrary() {
  return ok(EXERCISE_LIBRARY)
}
export function searchExercises(query) {
  const q = String(query || '').toLowerCase().trim()
  if (!q) return ok(EXERCISE_LIBRARY)
  return ok(EXERCISE_LIBRARY.filter((e) => e.name.toLowerCase().includes(q)))
}
export function filterExercisesByMuscleGroup(group) {
  if (!group || group === 'all') return ok(EXERCISE_LIBRARY)
  return ok(EXERCISE_LIBRARY.filter((e) => e.muscle_group === group))
}

// ════════════════════════ ROUTINES ════════════════════════════
function routineWithExercises(db, routine) {
  if (!routine) return null
  const items = db.routine_exercises
    .filter((re) => re.routine_id === routine.id)
    .sort((a, b) => a.display_order - b.display_order)
    .map((re) => ({
      routine_exercise_id: re.id,
      display_order: re.display_order,
      ...exObj(re.exercise_id),
    }))
  return { ...routine, exercises: items }
}

export function getUserRoutine(userId, routineType) {
  const db = readDB()
  const routine = db.user_routines.find(
    (r) => r.user_id === userId && r.routine_type === routineType,
  )
  return ok(routineWithExercises(db, routine))
}

export function getAllUserRoutines(userId) {
  const db = readDB()
  const routines = db.user_routines
    .filter((r) => r.user_id === userId)
    .map((r) => routineWithExercises(db, r))
  return ok(routines)
}

// upsert by (user_id, routine_type)
export function saveUserRoutine(userId, routineType, exerciseIds) {
  return ok(
    mutate((db) => {
      let routine = db.user_routines.find(
        (r) => r.user_id === userId && r.routine_type === routineType,
      )
      const now = new Date().toISOString()
      if (!routine) {
        routine = { id: uid(), user_id: userId, routine_type: routineType, created_at: now, updated_at: now }
        db.user_routines.push(routine)
      } else {
        routine.updated_at = now
        db.routine_exercises = db.routine_exercises.filter((re) => re.routine_id !== routine.id)
      }
      exerciseIds.forEach((exId, i) => {
        db.routine_exercises.push({
          id: uid(),
          routine_id: routine.id,
          exercise_id: exId,
          display_order: i,
        })
      })
      return routineWithExercises(db, routine)
    }),
  )
}

export function updateUserRoutine(routineId, exerciseIds) {
  return ok(
    mutate((db) => {
      const routine = db.user_routines.find((r) => r.id === routineId)
      if (!routine) return null
      routine.updated_at = new Date().toISOString()
      db.routine_exercises = db.routine_exercises.filter((re) => re.routine_id !== routineId)
      exerciseIds.forEach((exId, i) => {
        db.routine_exercises.push({ id: uid(), routine_id: routineId, exercise_id: exId, display_order: i })
      })
      return routineWithExercises(db, routine)
    }),
  )
}

export function deleteExerciseFromRoutine(routineExerciseId) {
  return ok(
    mutate((db) => {
      db.routine_exercises = db.routine_exercises.filter((re) => re.id !== routineExerciseId)
      return true
    }),
  )
}

export function reorderRoutineExercises(routineId, orderedExerciseIds) {
  return updateUserRoutine(routineId, orderedExerciseIds)
}

// ── Split (the user's whole multi-day program) ──────────────────
// A "split" is just the ordered list of the user's routine days, where
// routine_type holds the custom label (e.g. "Chest & Triceps").
export function getSplit(userId) {
  const db = readDB()
  const days = db.user_routines
    .filter((r) => r.user_id === userId)
    .map((r) => routineWithExercises(db, r))
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    .map((r, i) => ({ id: r.id, name: r.routine_type, order: r.display_order ?? i, exercises: r.exercises }))
  return ok(days)
}

export function getRoutineById(userId, routineId) {
  const db = readDB()
  const r = db.user_routines.find((x) => x.id === routineId && x.user_id === userId)
  if (!r) return ok(null)
  const full = routineWithExercises(db, r)
  return ok({ id: r.id, name: r.routine_type, exercises: full.exercises })
}

// Replace the user's entire split. days = [{ id?, name, exerciseIds:[...] }]
export function saveSplit(userId, days) {
  return ok(
    mutate((db) => {
      const now = new Date().toISOString()
      const keep = new Set(days.filter((d) => d.id).map((d) => d.id))
      // drop removed days + their exercises
      const userRoutineIds = db.user_routines.filter((r) => r.user_id === userId).map((r) => r.id)
      for (const rid of userRoutineIds) {
        if (!keep.has(rid)) {
          db.user_routines = db.user_routines.filter((r) => r.id !== rid)
          db.routine_exercises = db.routine_exercises.filter((re) => re.routine_id !== rid)
        }
      }
      // upsert each day in order
      days.forEach((d, i) => {
        let routine = d.id ? db.user_routines.find((r) => r.id === d.id && r.user_id === userId) : null
        if (!routine) {
          routine = { id: uid(), user_id: userId, routine_type: d.name, display_order: i, created_at: now, updated_at: now }
          db.user_routines.push(routine)
        } else {
          routine.routine_type = d.name
          routine.display_order = i
          routine.updated_at = now
          db.routine_exercises = db.routine_exercises.filter((re) => re.routine_id !== routine.id)
        }
        ;(d.exerciseIds || []).forEach((exId, j) => {
          db.routine_exercises.push({ id: uid(), routine_id: routine.id, exercise_id: exId, display_order: j })
        })
      })
      return true
    }),
  )
}

// ════════════════════════ WORKOUTS ════════════════════════════
// Returns the saved routine for prefilling, or { routineExists:false }.
export function startWorkout(userId, workoutType) {
  const db = readDB()
  const routine = db.user_routines.find(
    (r) => r.user_id === userId && r.routine_type === workoutType,
  )
  if (!routine) return ok({ routineExists: false, exercises: [] })
  const full = routineWithExercises(db, routine)
  return ok({ routineExists: true, exercises: full.exercises })
}

// exercisesWithSets: [{ exercise_id, sets: [{reps, weight}] }]
export function saveWorkout(userId, workoutType, exercisesWithSets, date) {
  const db = readDB()
  const user = db.users.find((u) => u.id === userId)
  const unit = user?.unit_preference || 'kg'
  const workoutDate = date || new Date().toISOString().slice(0, 10)

  const workout = {
    id: uid(),
    user_id: userId,
    workout_type: workoutType,
    workout_date: workoutDate,
    is_rest_day: false,
    created_at: new Date().toISOString(),
  }
  db.workouts.push(workout)

  exercisesWithSets.forEach((ex, i) => {
    const weId = uid()
    db.workout_exercises.push({
      id: weId,
      workout_id: workout.id,
      exercise_id: ex.exercise_id,
      display_order: i,
    })
    ;(ex.sets || []).forEach((s, si) => {
      const reps = Number(s.reps) || 0
      const weight = Number(s.weight) || 0
      if (reps === 0 && weight === 0) return // skip empty rows
      db.workout_sets.push({
        id: uid(),
        workout_exercise_id: weId,
        set_number: si + 1,
        reps,
        weight,
        unit,
      })
    })
  })
  writeDB(db)

  const newPRs = computePRs(workout.id)
  return ok({ workout, newPRs })
}

export function logRestDay(userId, date) {
  const workoutDate = date || new Date().toISOString().slice(0, 10)
  return ok(
    mutate((db) => {
      const workout = {
        id: uid(),
        user_id: userId,
        workout_type: 'Rest',
        workout_date: workoutDate,
        is_rest_day: true,
        created_at: new Date().toISOString(),
      }
      db.workouts.push(workout)
      return workout
    }),
  )
}

// Recent logs: workouts + food, newest first.
export function getRecentLogs(userId, limit = 12) {
  pruneFoodLogs()
  const db = readDB()
  const workouts = db.workouts
    .filter((w) => w.user_id === userId)
    .map((w) => ({
      kind: 'workout',
      id: w.id,
      date: w.workout_date,
      created_at: w.created_at,
      workout_type: w.workout_type,
      is_rest_day: w.is_rest_day,
      exerciseCount: db.workout_exercises.filter((we) => we.workout_id === w.id).length,
    }))
  const foods = db.food_logs
    .filter((f) => f.user_id === userId)
    .map((f) => ({
      kind: 'food',
      id: f.id,
      date: f.log_date,
      created_at: f.created_at,
      raw_text: f.raw_text,
      health_score: f.health_score,
      explanation: f.explanation,
      calories_low: f.calories_low,
      calories_high: f.calories_high,
      calories_partial: f.calories_partial,
    }))
  const all = [...workouts, ...foods].sort(
    (a, b) =>
      b.date.localeCompare(a.date) || (b.created_at || '').localeCompare(a.created_at || ''),
  )
  return ok(all.slice(0, limit))
}

// Calendar: all workouts in a given month (year, monthIndex 0-11)
export function getMonthWorkouts(userId, year, monthIndex) {
  const db = readDB()
  const prefix = `${year}-${String(monthIndex + 1).padStart(2, '0')}`
  const days = db.workouts
    .filter((w) => w.user_id === userId && w.workout_date.startsWith(prefix))
    .map((w) => ({ id: w.id, date: w.workout_date, type: w.workout_type, is_rest_day: w.is_rest_day }))
  // dedupe by date — last logged wins
  const byDate = {}
  for (const d of days) byDate[d.date] = d
  const summary = {}
  for (const d of Object.values(byDate)) summary[d.type] = (summary[d.type] || 0) + 1
  return ok({ byDate, summary })
}

// Load one saved workout shaped for the logger (sets as editable strings).
export function getWorkout(workoutId) {
  const db = readDB()
  const w = db.workouts.find((x) => x.id === workoutId)
  if (!w) return ok(null)
  const exercises = db.workout_exercises
    .filter((we) => we.workout_id === workoutId)
    .sort((a, b) => a.display_order - b.display_order)
    .map((we) => {
      const sets = db.workout_sets
        .filter((s) => s.workout_exercise_id === we.id)
        .sort((a, b) => a.set_number - b.set_number)
        .map((s) => ({ reps: String(s.reps), weight: String(s.weight) }))
      return {
        exercise_id: we.exercise_id,
        exercise: exObj(we.exercise_id),
        sets: sets.length ? sets : [{ reps: '', weight: '' }],
      }
    })
  return ok({
    id: w.id,
    workout_type: w.workout_type,
    workout_date: w.workout_date,
    is_rest_day: w.is_rest_day,
    exercises,
  })
}

// Replace a saved workout's exercises/sets/date, then recalc PRs (an edit can
// lower a previous PR, so we rebuild rather than only bump upward).
export function updateWorkout(userId, workoutId, exercisesWithSets, date) {
  const db = readDB()
  const workout = db.workouts.find((w) => w.id === workoutId && w.user_id === userId)
  if (!workout) return fail('Workout not found.')
  const unit = db.users.find((u) => u.id === userId)?.unit_preference || 'kg'
  if (date) workout.workout_date = date

  const oldWeIds = db.workout_exercises.filter((we) => we.workout_id === workoutId).map((we) => we.id)
  db.workout_exercises = db.workout_exercises.filter((we) => we.workout_id !== workoutId)
  db.workout_sets = db.workout_sets.filter((s) => !oldWeIds.includes(s.workout_exercise_id))

  exercisesWithSets.forEach((ex, i) => {
    const weId = uid()
    db.workout_exercises.push({ id: weId, workout_id: workoutId, exercise_id: ex.exercise_id, display_order: i })
    ;(ex.sets || []).forEach((s, si) => {
      const reps = Number(s.reps) || 0
      const weight = Number(s.weight) || 0
      if (reps === 0 && weight === 0) return
      db.workout_sets.push({ id: uid(), workout_exercise_id: weId, set_number: si + 1, reps, weight, unit })
    })
  })
  writeDB(db)
  recalcUserPRs(userId)
  return ok({ workout })
}

export function deleteWorkout(userId, workoutId) {
  const db = readDB()
  const weIds = db.workout_exercises.filter((we) => we.workout_id === workoutId).map((we) => we.id)
  db.workout_exercises = db.workout_exercises.filter((we) => we.workout_id !== workoutId)
  db.workout_sets = db.workout_sets.filter((s) => !weIds.includes(s.workout_exercise_id))
  db.workouts = db.workouts.filter((w) => !(w.id === workoutId && w.user_id === userId))
  writeDB(db)
  recalcUserPRs(userId)
  return ok(true)
}

// ══════════════════════════ PRs ═══════════════════════════════
// internal (sync) — used right after saving a workout
function computePRs(workoutId) {
  const db = readDB()
  const workout = db.workouts.find((w) => w.id === workoutId)
  if (!workout || workout.is_rest_day) return []
  const wes = db.workout_exercises.filter((we) => we.workout_id === workoutId)
  const changes = []
  for (const we of wes) {
    const sets = db.workout_sets.filter((s) => s.workout_exercise_id === we.id)
    const best = maxWeightFromSets(sets)
    if (best <= 0) continue
    const existing = db.personal_prs.find(
      (p) => p.user_id === workout.user_id && p.exercise_id === we.exercise_id,
    )
    if (!existing) {
      db.personal_prs.push({
        id: uid(),
        user_id: workout.user_id,
        exercise_id: we.exercise_id,
        best_weight: best,
        unit: sets[0]?.unit || 'kg',
        workout_id: workoutId,
        achieved_at: workout.workout_date,
      })
      changes.push({ exercise: exObj(we.exercise_id), oldWeight: null, newWeight: best })
    } else if (best > existing.best_weight) {
      changes.push({ exercise: exObj(we.exercise_id), oldWeight: existing.best_weight, newWeight: best })
      existing.best_weight = best
      existing.workout_id = workoutId
      existing.achieved_at = workout.workout_date
      existing.unit = sets[0]?.unit || existing.unit
    }
  }
  writeDB(db)
  return changes
}

export function calculatePRsAfterWorkout(workoutId) {
  return ok(computePRs(workoutId))
}

// Rebuild ALL of a user's PRs from their full history. Used after an edit or
// delete, where a PR may need to drop to the next-highest weight on record.
export function recalcUserPRs(userId) {
  return mutate((db) => {
    db.personal_prs = db.personal_prs.filter((p) => p.user_id !== userId)
    const best = {} // exercise_id -> { weight, workoutId, date, unit }
    const workouts = db.workouts.filter((w) => w.user_id === userId && !w.is_rest_day)
    for (const w of workouts) {
      const wes = db.workout_exercises.filter((we) => we.workout_id === w.id)
      for (const we of wes) {
        const sets = db.workout_sets.filter((s) => s.workout_exercise_id === we.id)
        const m = maxWeightFromSets(sets)
        if (m <= 0) continue
        const cur = best[we.exercise_id]
        if (!cur || m > cur.weight) {
          best[we.exercise_id] = { weight: m, workoutId: w.id, date: w.workout_date, unit: sets[0]?.unit || 'kg' }
        }
      }
    }
    for (const [exerciseId, info] of Object.entries(best)) {
      db.personal_prs.push({
        id: uid(),
        user_id: userId,
        exercise_id: exerciseId,
        best_weight: info.weight,
        unit: info.unit,
        workout_id: info.workoutId,
        achieved_at: info.date,
      })
    }
    return true
  })
}

export function getUserPRs(userId) {
  const db = readDB()
  const prs = db.personal_prs
    .filter((p) => p.user_id === userId)
    .map((p) => ({ ...p, exercise: exObj(p.exercise_id) }))
    .sort((a, b) => b.best_weight - a.best_weight)
  return ok(prs)
}

// History of best-per-workout for one exercise
export function getExerciseHistory(userId, exerciseId) {
  const db = readDB()
  const workouts = db.workouts.filter((w) => w.user_id === userId && !w.is_rest_day)
  const rows = []
  for (const w of workouts) {
    const we = db.workout_exercises.find(
      (x) => x.workout_id === w.id && x.exercise_id === exerciseId,
    )
    if (!we) continue
    const sets = db.workout_sets.filter((s) => s.workout_exercise_id === we.id)
    const best = maxWeightFromSets(sets)
    if (best <= 0) continue
    rows.push({ date: w.workout_date, weight: best })
  }
  rows.sort((a, b) => a.date.localeCompare(b.date))
  return ok(rows)
}

export function getMonthlyExerciseProgress(userId, exerciseId, range = '6m') {
  return getExerciseHistory(userId, exerciseId).then((history) => {
    const series = buildMonthlySeries(history)
    return filterSeriesByRange(series, range)
  })
}

// ══════════════════════════ FRIENDS ═══════════════════════════
function areFriends(db, a, b) {
  return db.friends.some(
    (f) =>
      (f.user_id_1 === a && f.user_id_2 === b) ||
      (f.user_id_1 === b && f.user_id_2 === a),
  )
}

export function searchUsersByUsername(query, currentUserId) {
  const db = readDB()
  const q = String(query || '').toLowerCase().trim()
  if (!q) return ok([])
  const results = db.users
    .filter((u) => u.id !== currentUserId && u.username.toLowerCase().includes(q))
    .map((u) => {
      let status = 'none'
      if (areFriends(db, currentUserId, u.id)) status = 'friends'
      else if (
        db.friend_requests.some(
          (r) => r.sender_user_id === currentUserId && r.receiver_user_id === u.id && r.status === 'pending',
        )
      )
        status = 'pending_out'
      else if (
        db.friend_requests.some(
          (r) => r.sender_user_id === u.id && r.receiver_user_id === currentUserId && r.status === 'pending',
        )
      )
        status = 'pending_in'
      return { ...u, relationship: status }
    })
  return ok(results)
}

export function sendFriendRequest(senderId, receiverId) {
  const db = readDB()
  if (senderId === receiverId) return fail('You cannot add yourself.')
  if (areFriends(db, senderId, receiverId)) return fail('You are already friends.')
  const existing = db.friend_requests.find(
    (r) => r.sender_user_id === senderId && r.receiver_user_id === receiverId && r.status === 'pending',
  )
  if (existing) return fail('Request already sent.')
  const req = {
    id: uid(),
    sender_user_id: senderId,
    receiver_user_id: receiverId,
    status: 'pending',
    created_at: new Date().toISOString(),
    responded_at: null,
  }
  db.friend_requests.push(req)
  writeDB(db)
  return ok(req)
}

export function getIncomingFriendRequests(userId) {
  const db = readDB()
  const reqs = db.friend_requests
    .filter((r) => r.receiver_user_id === userId && r.status === 'pending')
    .map((r) => ({ ...r, sender: db.users.find((u) => u.id === r.sender_user_id) }))
    .filter((r) => r.sender)
  return ok(reqs)
}

export function acceptFriendRequest(requestId) {
  return ok(
    mutate((db) => {
      const req = db.friend_requests.find((r) => r.id === requestId)
      if (!req) return null
      req.status = 'accepted'
      req.responded_at = new Date().toISOString()
      if (!areFriends(db, req.sender_user_id, req.receiver_user_id)) {
        db.friends.push({
          id: uid(),
          user_id_1: req.sender_user_id,
          user_id_2: req.receiver_user_id,
          created_at: new Date().toISOString(),
        })
      }
      return req
    }),
  )
}

export function rejectFriendRequest(requestId) {
  return ok(
    mutate((db) => {
      const req = db.friend_requests.find((r) => r.id === requestId)
      if (req) {
        req.status = 'rejected'
        req.responded_at = new Date().toISOString()
      }
      return req
    }),
  )
}

export function getFriends(userId) {
  const db = readDB()
  const friendIds = db.friends
    .filter((f) => f.user_id_1 === userId || f.user_id_2 === userId)
    .map((f) => (f.user_id_1 === userId ? f.user_id_2 : f.user_id_1))
  const friends = friendIds
    .map((id) => db.users.find((u) => u.id === id))
    .filter(Boolean)
  return ok(friends)
}

export function removeFriend(userId, friendId) {
  return ok(
    mutate((db) => {
      db.friends = db.friends.filter(
        (f) =>
          !(
            (f.user_id_1 === userId && f.user_id_2 === friendId) ||
            (f.user_id_1 === friendId && f.user_id_2 === userId)
          ),
      )
      // also clear any prior requests so they can re-add
      db.friend_requests = db.friend_requests.filter(
        (r) =>
          !(
            (r.sender_user_id === userId && r.receiver_user_id === friendId) ||
            (r.sender_user_id === friendId && r.receiver_user_id === userId)
          ),
      )
      return true
    }),
  )
}

// ════════════════════════ LEADERBOARDS ════════════════════════
export function getLeaderboardEnabledExercises() {
  return ok(EXERCISE_LIBRARY.filter((e) => e.leaderboard_enabled))
}

// Rank logged-in user + accepted friends by PR for an exercise.
export function getExerciseLeaderboard(userId, exerciseId) {
  const db = readDB()
  const friendIds = db.friends
    .filter((f) => f.user_id_1 === userId || f.user_id_2 === userId)
    .map((f) => (f.user_id_1 === userId ? f.user_id_2 : f.user_id_1))
  const ids = [userId, ...friendIds]
  const rows = ids
    .map((id) => {
      const pr = db.personal_prs.find((p) => p.user_id === id && p.exercise_id === exerciseId)
      const user = db.users.find((u) => u.id === id)
      if (!pr || !user) return null
      return {
        userId: id,
        username: user.username,
        best_weight: pr.best_weight,
        unit: pr.unit,
        isYou: id === userId,
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.best_weight - a.best_weight)
    .map((r, i) => ({ ...r, rank: i + 1 }))
  return ok(rows)
}

// ══════════════════════════ FOOD ══════════════════════════════
export { calculateFoodHealthScore }

// Start of the current week (Monday) as 'YYYY-MM-DD'.
function weekStartStr() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  const diff = (d.getDay() + 6) % 7 // days since Monday
  d.setDate(d.getDate() - diff)
  return d.toISOString().slice(0, 10)
}

// Food logs are not kept long-term — clear anything before this week.
export function pruneFoodLogs() {
  const ws = weekStartStr()
  mutate((db) => {
    const before = db.food_logs.length
    db.food_logs = db.food_logs.filter((f) => f.log_date >= ws)
    return before !== db.food_logs.length
  })
}

export function logFood(userId, rawText, date) {
  const { score, explanation, calories, items } = calculateFoodHealthScore(rawText)
  const logDate = date || new Date().toISOString().slice(0, 10)
  pruneFoodLogs()
  return ok(
    mutate((db) => {
      const entry = {
        id: uid(),
        user_id: userId,
        log_date: logDate,
        raw_text: rawText,
        health_score: score,
        explanation,
        calories_low: calories.low,
        calories_high: calories.high,
        calories_partial: calories.partial,
        items,
        created_at: new Date().toISOString(),
      }
      db.food_logs.push(entry)
      return entry
    }),
  )
}

export function getFoodHistory(userId, limit = 30) {
  pruneFoodLogs()
  const db = readDB()
  const rows = db.food_logs
    .filter((f) => f.user_id === userId)
    .sort((a, b) => b.log_date.localeCompare(a.log_date) || b.created_at.localeCompare(a.created_at))
  return ok(rows.slice(0, limit))
}

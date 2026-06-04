// ─────────────────────────────────────────────────────────────────
// Supabase implementation of the service layer.
// Same function names + return shapes as localApi.js, so the UI never
// changes. Selected by VITE_DATA_BACKEND=supabase (see api.js).
// ─────────────────────────────────────────────────────────────────

import { supabase } from './supabaseClient.js'
import { EXERCISE_LIBRARY, EXERCISE_BY_ID } from '../lib/exerciseLibrary.js'
import { calculateFoodHealthScore } from '../lib/foodScore.js'
import { buildMonthlySeries, filterSeriesByRange } from '../lib/prLogic.js'

const exObj = (id) => EXERCISE_BY_ID[id] || { id, name: 'Unknown', muscle_group: '', category: '' }
const maxWeight = (sets) => sets.reduce((m, s) => (Number(s.weight) > m ? Number(s.weight) : m), 0)

function need() {
  if (!supabase) throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env')
}
// Await a PostgREST query; throw on error, return data.
async function q(builder) {
  const { data, error } = await builder
  if (error) throw new Error(error.message)
  return data
}

function weekStartStr() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)) // back to Monday
  return d.toISOString().slice(0, 10)
}

// ════════════════════════════ AUTH ════════════════════════════
async function fetchProfile(id) {
  const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function getCurrentUser() {
  if (!supabase) return null
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return null
  return fetchProfile(session.user.id)
}

export async function login(email, password) {
  need()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error('Incorrect email or password.')
  return fetchProfile(data.user.id)
}

export async function signUp(email, password, profileData) {
  need()
  // friendly username pre-check (constraint is the real guard)
  const taken = await q(
    supabase.from('users').select('id').ilike('username', profileData.username).maybeSingle(),
  )
  if (taken) throw new Error('That username is taken — pick another.')

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: profileData.username,
        age: Number(profileData.age),
        sex: profileData.sex,
        unit_preference: profileData.unit_preference || 'kg',
      },
    },
  })
  if (error) throw new Error(error.message)
  if (!data.session) {
    // Email confirmation is ON for this project.
    throw new Error('Account created — check your email to confirm, then log in.')
  }
  if (profileData.profile_picture_url) {
    await supabase.from('users').update({ profile_picture_url: profileData.profile_picture_url }).eq('id', data.user.id)
  }
  return fetchProfile(data.user.id)
}

export async function logout() {
  if (supabase) await supabase.auth.signOut()
  return true
}

export async function getUserById(id) {
  need()
  return fetchProfile(id)
}

const USERNAME_RE = /^[a-zA-Z0-9_.]{3,20}$/
export async function updateProfile(userId, updates) {
  need()
  const patch = {}
  if (updates.username != null) {
    const uname = String(updates.username).trim()
    if (!USERNAME_RE.test(uname)) throw new Error('Username must be 3–20 characters: letters, numbers, _ or . only.')
    const clash = await q(
      supabase.from('users').select('id').ilike('username', uname).neq('id', userId).maybeSingle(),
    )
    if (clash) throw new Error('That username is taken — pick another.')
    patch.username = uname
  }
  if (updates.profile_picture_url !== undefined) patch.profile_picture_url = updates.profile_picture_url
  await q(supabase.from('users').update(patch).eq('id', userId))
  return fetchProfile(userId)
}

export async function changePassword(userId, currentPassword, newPassword) {
  need()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const email = session?.user?.email
  if (!email) throw new Error('Not signed in.')
  if (newPassword.length < 6) throw new Error('New password must be at least 6 characters.')
  // verify current password by re-authenticating
  const { error: reauth } = await supabase.auth.signInWithPassword({ email, password: currentPassword })
  if (reauth) throw new Error('Current password is incorrect.')
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw new Error(error.message)
  return true
}

// ════════════════════════ EXERCISES (static) ══════════════════
export async function getExerciseLibrary() {
  return EXERCISE_LIBRARY
}
export async function searchExercises(query) {
  const s = String(query || '').toLowerCase().trim()
  return s ? EXERCISE_LIBRARY.filter((e) => e.name.toLowerCase().includes(s)) : EXERCISE_LIBRARY
}
export async function filterExercisesByMuscleGroup(group) {
  return !group || group === 'all' ? EXERCISE_LIBRARY : EXERCISE_LIBRARY.filter((e) => e.muscle_group === group)
}

// ════════════════════════ ROUTINES ════════════════════════════
function shapeRoutine(r) {
  if (!r) return null
  const exercises = (r.routine_exercises || [])
    .sort((a, b) => a.display_order - b.display_order)
    .map((re) => ({ routine_exercise_id: re.id, display_order: re.display_order, ...exObj(re.exercise_id) }))
  return { id: r.id, user_id: r.user_id, routine_type: r.routine_type, exercises }
}

export async function getUserRoutine(userId, routineType) {
  need()
  const r = await q(
    supabase
      .from('user_routines')
      .select('id,user_id,routine_type, routine_exercises(id,exercise_id,display_order)')
      .eq('user_id', userId)
      .eq('routine_type', routineType)
      .maybeSingle(),
  )
  return shapeRoutine(r)
}

export async function getAllUserRoutines(userId) {
  need()
  const rows = await q(
    supabase
      .from('user_routines')
      .select('id,user_id,routine_type, routine_exercises(id,exercise_id,display_order)')
      .eq('user_id', userId),
  )
  return rows.map(shapeRoutine)
}

async function writeRoutineExercises(routineId, exerciseIds) {
  await q(supabase.from('routine_exercises').delete().eq('routine_id', routineId))
  if (exerciseIds.length) {
    await q(
      supabase
        .from('routine_exercises')
        .insert(exerciseIds.map((exId, i) => ({ routine_id: routineId, exercise_id: exId, display_order: i }))),
    )
  }
}

export async function saveUserRoutine(userId, routineType, exerciseIds) {
  need()
  let routine = await q(
    supabase.from('user_routines').select('id').eq('user_id', userId).eq('routine_type', routineType).maybeSingle(),
  )
  if (!routine) {
    routine = await q(
      supabase.from('user_routines').insert({ user_id: userId, routine_type: routineType }).select('id').single(),
    )
  } else {
    await q(supabase.from('user_routines').update({ updated_at: new Date().toISOString() }).eq('id', routine.id))
  }
  await writeRoutineExercises(routine.id, exerciseIds)
  return getUserRoutine(userId, routineType)
}

export async function updateUserRoutine(routineId, exerciseIds) {
  need()
  await writeRoutineExercises(routineId, exerciseIds)
  await q(supabase.from('user_routines').update({ updated_at: new Date().toISOString() }).eq('id', routineId))
  const r = await q(
    supabase
      .from('user_routines')
      .select('id,user_id,routine_type, routine_exercises(id,exercise_id,display_order)')
      .eq('id', routineId)
      .maybeSingle(),
  )
  return shapeRoutine(r)
}

export async function deleteExerciseFromRoutine(routineExerciseId) {
  need()
  await q(supabase.from('routine_exercises').delete().eq('id', routineExerciseId))
  return true
}

export function reorderRoutineExercises(routineId, orderedExerciseIds) {
  return updateUserRoutine(routineId, orderedExerciseIds)
}

// ════════════════════════ WORKOUTS ════════════════════════════
export async function startWorkout(userId, workoutType) {
  const routine = await getUserRoutine(userId, workoutType)
  if (!routine || routine.exercises.length === 0) return { routineExists: false, exercises: [] }
  return { routineExists: true, exercises: routine.exercises }
}

// insert workout_exercises + their sets for a workout
async function writeWorkoutChildren(workoutId, exercisesWithSets, unit) {
  const weRows = exercisesWithSets.map((ex, i) => ({
    workout_id: workoutId,
    exercise_id: ex.exercise_id,
    display_order: i,
  }))
  if (weRows.length === 0) return
  const inserted = await q(supabase.from('workout_exercises').insert(weRows).select('id,display_order'))
  const setRows = []
  exercisesWithSets.forEach((ex, i) => {
    const we = inserted.find((w) => w.display_order === i)
    ;(ex.sets || []).forEach((s, si) => {
      const reps = Number(s.reps) || 0
      const weight = Number(s.weight) || 0
      if (reps === 0 && weight === 0) return
      setRows.push({ workout_exercise_id: we.id, set_number: si + 1, reps, weight, unit })
    })
  })
  if (setRows.length) await q(supabase.from('workout_sets').insert(setRows))
}

export async function saveWorkout(userId, workoutType, exercisesWithSets, date) {
  need()
  const profile = await fetchProfile(userId)
  const unit = profile?.unit_preference || 'kg'
  const workoutDate = date || new Date().toISOString().slice(0, 10)

  const workout = await q(
    supabase
      .from('workouts')
      .insert({ user_id: userId, workout_type: workoutType, workout_date: workoutDate, is_rest_day: false })
      .select('*')
      .single(),
  )
  await writeWorkoutChildren(workout.id, exercisesWithSets, unit)

  // detect new PRs vs. pre-existing, then rebuild PR table
  const pre = await getUserPRs(userId)
  const preMap = Object.fromEntries(pre.map((p) => [p.exercise_id, p.best_weight]))
  const newPRs = []
  for (const ex of exercisesWithSets) {
    const m = maxWeight(ex.sets || [])
    if (m > 0 && m > (preMap[ex.exercise_id] ?? -Infinity)) {
      newPRs.push({ exercise: exObj(ex.exercise_id), oldWeight: preMap[ex.exercise_id] ?? null, newWeight: m })
    }
  }
  await recalcUserPRs(userId)
  return { workout, newPRs }
}

export async function logRestDay(userId, date) {
  need()
  const workoutDate = date || new Date().toISOString().slice(0, 10)
  return q(
    supabase
      .from('workouts')
      .insert({ user_id: userId, workout_type: 'Rest', workout_date: workoutDate, is_rest_day: true })
      .select('*')
      .single(),
  )
}

export async function getRecentLogs(userId, limit = 12) {
  need()
  await pruneFoodLogs(userId)
  const workouts = await q(
    supabase
      .from('workouts')
      .select('id,workout_date,created_at,workout_type,is_rest_day, workout_exercises(id)')
      .eq('user_id', userId)
      .order('workout_date', { ascending: false })
      .limit(limit),
  )
  const foods = await q(
    supabase
      .from('food_logs')
      .select('*')
      .eq('user_id', userId)
      .order('log_date', { ascending: false })
      .limit(limit),
  )
  const wItems = workouts.map((w) => ({
    kind: 'workout',
    id: w.id,
    date: w.workout_date,
    created_at: w.created_at,
    workout_type: w.workout_type,
    is_rest_day: w.is_rest_day,
    exerciseCount: (w.workout_exercises || []).length,
  }))
  const fItems = foods.map((f) => ({
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
  return [...wItems, ...fItems]
    .sort((a, b) => b.date.localeCompare(a.date) || (b.created_at || '').localeCompare(a.created_at || ''))
    .slice(0, limit)
}

export async function getMonthWorkouts(userId, year, monthIndex) {
  need()
  const first = new Date(Date.UTC(year, monthIndex, 1)).toISOString().slice(0, 10)
  const next = new Date(Date.UTC(year, monthIndex + 1, 1)).toISOString().slice(0, 10)
  const rows = await q(
    supabase
      .from('workouts')
      .select('id,workout_date,workout_type,is_rest_day')
      .eq('user_id', userId)
      .gte('workout_date', first)
      .lt('workout_date', next),
  )
  const byDate = {}
  for (const w of rows) byDate[w.workout_date] = { id: w.id, date: w.workout_date, type: w.workout_type, is_rest_day: w.is_rest_day }
  const summary = {}
  for (const d of Object.values(byDate)) summary[d.type] = (summary[d.type] || 0) + 1
  return { byDate, summary }
}

export async function getWorkout(workoutId) {
  need()
  const w = await q(
    supabase
      .from('workouts')
      .select('id,user_id,workout_type,workout_date,is_rest_day, workout_exercises(exercise_id,display_order, workout_sets(set_number,reps,weight))')
      .eq('id', workoutId)
      .maybeSingle(),
  )
  if (!w) return null
  const exercises = (w.workout_exercises || [])
    .sort((a, b) => a.display_order - b.display_order)
    .map((we) => {
      const sets = (we.workout_sets || [])
        .sort((a, b) => a.set_number - b.set_number)
        .map((s) => ({ reps: String(s.reps), weight: String(s.weight) }))
      return { exercise_id: we.exercise_id, exercise: exObj(we.exercise_id), sets: sets.length ? sets : [{ reps: '', weight: '' }] }
    })
  return { id: w.id, workout_type: w.workout_type, workout_date: w.workout_date, is_rest_day: w.is_rest_day, exercises }
}

export async function updateWorkout(userId, workoutId, exercisesWithSets, date) {
  need()
  const workout = await q(
    supabase.from('workouts').select('*').eq('id', workoutId).eq('user_id', userId).maybeSingle(),
  )
  if (!workout) throw new Error('Workout not found.')
  const profile = await fetchProfile(userId)
  const unit = profile?.unit_preference || 'kg'
  if (date) await q(supabase.from('workouts').update({ workout_date: date }).eq('id', workoutId))
  // wipe children (sets cascade) then rewrite
  await q(supabase.from('workout_exercises').delete().eq('workout_id', workoutId))
  await writeWorkoutChildren(workoutId, exercisesWithSets, unit)
  await recalcUserPRs(userId)
  return { workout: { ...workout, workout_date: date || workout.workout_date } }
}

export async function deleteWorkout(userId, workoutId) {
  need()
  await q(supabase.from('workouts').delete().eq('id', workoutId).eq('user_id', userId))
  await recalcUserPRs(userId)
  return true
}

// ══════════════════════════ PRs ═══════════════════════════════
export async function recalcUserPRs(userId) {
  need()
  const workouts = await q(
    supabase
      .from('workouts')
      .select('id,workout_date,is_rest_day, workout_exercises(exercise_id, workout_sets(weight,unit))')
      .eq('user_id', userId)
      .eq('is_rest_day', false),
  )
  const best = {}
  for (const w of workouts) {
    for (const we of w.workout_exercises || []) {
      const m = maxWeight(we.workout_sets || [])
      if (m <= 0) continue
      const cur = best[we.exercise_id]
      if (!cur || m > cur.weight) {
        best[we.exercise_id] = { weight: m, workoutId: w.id, date: w.workout_date, unit: (we.workout_sets[0] || {}).unit || 'kg' }
      }
    }
  }
  await q(supabase.from('personal_prs').delete().eq('user_id', userId))
  const insert = Object.entries(best).map(([exerciseId, info]) => ({
    user_id: userId,
    exercise_id: exerciseId,
    best_weight: info.weight,
    unit: info.unit,
    workout_id: info.workoutId,
    achieved_at: info.date,
  }))
  if (insert.length) await q(supabase.from('personal_prs').insert(insert))
  return true
}

export async function calculatePRsAfterWorkout() {
  return []
}

export async function getUserPRs(userId) {
  need()
  const rows = await q(supabase.from('personal_prs').select('*').eq('user_id', userId))
  return rows
    .map((p) => ({ ...p, exercise: exObj(p.exercise_id) }))
    .sort((a, b) => b.best_weight - a.best_weight)
}

export async function getExerciseHistory(userId, exerciseId) {
  need()
  const workouts = await q(
    supabase
      .from('workouts')
      .select('workout_date, workout_exercises(exercise_id, workout_sets(weight))')
      .eq('user_id', userId)
      .eq('is_rest_day', false),
  )
  const rows = []
  for (const w of workouts) {
    const we = (w.workout_exercises || []).find((x) => x.exercise_id === exerciseId)
    if (!we) continue
    const m = maxWeight(we.workout_sets || [])
    if (m > 0) rows.push({ date: w.workout_date, weight: m })
  }
  rows.sort((a, b) => a.date.localeCompare(b.date))
  return rows
}

export async function getMonthlyExerciseProgress(userId, exerciseId, range = '6m') {
  const history = await getExerciseHistory(userId, exerciseId)
  return filterSeriesByRange(buildMonthlySeries(history), range)
}

// ══════════════════════════ FRIENDS ═══════════════════════════
async function friendIds(userId) {
  const rows = await q(
    supabase.from('friends').select('user_id_1,user_id_2').or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`),
  )
  return rows.map((f) => (f.user_id_1 === userId ? f.user_id_2 : f.user_id_1))
}

export async function searchUsersByUsername(query, currentUserId) {
  need()
  const s = String(query || '').trim()
  if (!s) return []
  const users = await q(
    supabase
      .from('users')
      .select('id,username,profile_picture_url')
      .ilike('username', `%${s}%`)
      .neq('id', currentUserId)
      .limit(20),
  )
  const fIds = new Set(await friendIds(currentUserId))
  const reqs = await q(
    supabase
      .from('friend_requests')
      .select('sender_user_id,receiver_user_id,status')
      .or(`sender_user_id.eq.${currentUserId},receiver_user_id.eq.${currentUserId}`)
      .eq('status', 'pending'),
  )
  return users.map((u) => {
    let relationship = 'none'
    if (fIds.has(u.id)) relationship = 'friends'
    else if (reqs.some((r) => r.sender_user_id === currentUserId && r.receiver_user_id === u.id)) relationship = 'pending_out'
    else if (reqs.some((r) => r.sender_user_id === u.id && r.receiver_user_id === currentUserId)) relationship = 'pending_in'
    return { ...u, relationship }
  })
}

export async function sendFriendRequest(senderId, receiverId) {
  need()
  if (senderId === receiverId) throw new Error('You cannot add yourself.')
  const { error } = await supabase
    .from('friend_requests')
    .insert({ sender_user_id: senderId, receiver_user_id: receiverId, status: 'pending' })
  if (error) throw new Error(error.code === '23505' ? 'Request already sent.' : error.message)
  return true
}

export async function getIncomingFriendRequests(userId) {
  need()
  const reqs = await q(
    supabase
      .from('friend_requests')
      .select('id,sender_user_id,created_at')
      .eq('receiver_user_id', userId)
      .eq('status', 'pending'),
  )
  if (reqs.length === 0) return []
  const senders = await q(
    supabase.from('users').select('id,username,profile_picture_url').in('id', reqs.map((r) => r.sender_user_id)),
  )
  const byId = Object.fromEntries(senders.map((u) => [u.id, u]))
  return reqs.map((r) => ({ ...r, sender: byId[r.sender_user_id] })).filter((r) => r.sender)
}

export async function acceptFriendRequest(requestId) {
  need()
  const req = await q(supabase.from('friend_requests').select('*').eq('id', requestId).maybeSingle())
  if (!req) return null
  await q(
    supabase.from('friend_requests').update({ status: 'accepted', responded_at: new Date().toISOString() }).eq('id', requestId),
  )
  await q(supabase.from('friends').insert({ user_id_1: req.sender_user_id, user_id_2: req.receiver_user_id }))
  return req
}

export async function rejectFriendRequest(requestId) {
  need()
  await q(
    supabase.from('friend_requests').update({ status: 'rejected', responded_at: new Date().toISOString() }).eq('id', requestId),
  )
  return true
}

export async function getFriends(userId) {
  need()
  const ids = await friendIds(userId)
  if (ids.length === 0) return []
  return q(supabase.from('users').select('id,username,profile_picture_url,unit_preference').in('id', ids))
}

export async function removeFriend(userId, friendId) {
  need()
  await q(
    supabase
      .from('friends')
      .delete()
      .or(
        `and(user_id_1.eq.${userId},user_id_2.eq.${friendId}),and(user_id_1.eq.${friendId},user_id_2.eq.${userId})`,
      ),
  )
  await q(
    supabase
      .from('friend_requests')
      .delete()
      .or(
        `and(sender_user_id.eq.${userId},receiver_user_id.eq.${friendId}),and(sender_user_id.eq.${friendId},receiver_user_id.eq.${userId})`,
      ),
  )
  return true
}

// ════════════════════════ LEADERBOARDS ════════════════════════
export async function getLeaderboardEnabledExercises() {
  return EXERCISE_LIBRARY.filter((e) => e.leaderboard_enabled)
}

export async function getExerciseLeaderboard(userId, exerciseId) {
  need()
  const ids = [userId, ...(await friendIds(userId))]
  const prs = await q(
    supabase.from('personal_prs').select('user_id,best_weight,unit').eq('exercise_id', exerciseId).in('user_id', ids),
  )
  if (prs.length === 0) return []
  const users = await q(supabase.from('users').select('id,username').in('id', prs.map((p) => p.user_id)))
  const nameById = Object.fromEntries(users.map((u) => [u.id, u.username]))
  return prs
    .map((p) => ({ userId: p.user_id, username: nameById[p.user_id] || '—', best_weight: p.best_weight, unit: p.unit, isYou: p.user_id === userId }))
    .sort((a, b) => b.best_weight - a.best_weight)
    .map((r, i) => ({ ...r, rank: i + 1 }))
}

// ══════════════════════════ FOOD ══════════════════════════════
export { calculateFoodHealthScore }

export async function pruneFoodLogs(userId) {
  if (!supabase) return false
  let uid = userId
  if (!uid) {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    uid = session?.user?.id
  }
  if (!uid) return false
  await q(supabase.from('food_logs').delete().eq('user_id', uid).lt('log_date', weekStartStr()))
  return true
}

export async function logFood(userId, rawText, date) {
  need()
  await pruneFoodLogs(userId)
  const { score, explanation, calories, items } = calculateFoodHealthScore(rawText)
  const entry = {
    user_id: userId,
    log_date: date || new Date().toISOString().slice(0, 10),
    raw_text: rawText,
    health_score: score,
    explanation,
    calories_low: calories.low,
    calories_high: calories.high,
    calories_partial: calories.partial,
    items,
  }
  return q(supabase.from('food_logs').insert(entry).select('*').single())
}

export async function getFoodHistory(userId, limit = 30) {
  need()
  await pruneFoodLogs(userId)
  return q(
    supabase.from('food_logs').select('*').eq('user_id', userId).order('log_date', { ascending: false }).limit(limit),
  )
}

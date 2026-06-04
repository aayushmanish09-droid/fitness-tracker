// ─────────────────────────────────────────────────────────────────
// Tiny localStorage-backed "database".
// Mirrors the Supabase Postgres schema (normalized tables) so the
// service layer can be swapped to real Supabase without touching the UI.
// ─────────────────────────────────────────────────────────────────

const DB_KEY = 'prt:db:v2'
const SESSION_KEY = 'prt:session:v1'

const EMPTY_DB = {
  users: [],
  user_routines: [],
  routine_exercises: [],
  workouts: [],
  workout_exercises: [],
  workout_sets: [],
  personal_prs: [],
  friend_requests: [],
  friends: [],
  food_logs: [],
  _passwords: {}, // { [userId]: plaintext } — DEMO ONLY, never do this in prod
  _seeded: false,
}

export function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function readDB() {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (!raw) return structuredClone(EMPTY_DB)
    return { ...structuredClone(EMPTY_DB), ...JSON.parse(raw) }
  } catch {
    return structuredClone(EMPTY_DB)
  }
}

export function writeDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db))
  return db
}

// Mutate helper — read, transform, persist, return result.
export function mutate(fn) {
  const db = readDB()
  const result = fn(db)
  writeDB(db)
  return result
}

// ── Session (current logged-in user id) ──────────────────────────
export function getSessionUserId() {
  return localStorage.getItem(SESSION_KEY) || null
}
export function setSessionUserId(userId) {
  if (userId) localStorage.setItem(SESSION_KEY, userId)
  else localStorage.removeItem(SESSION_KEY)
}

export function resetDB() {
  localStorage.removeItem(DB_KEY)
  localStorage.removeItem(SESSION_KEY)
}

// ─────────────────────────────────────────────────────────────────
// Backend switch. The whole UI imports from here and never cares which
// backend is live. Set VITE_DATA_BACKEND=supabase (+ Supabase keys) to
// run fully online; otherwise the zero-config localStorage backend runs.
// ─────────────────────────────────────────────────────────────────

import * as local from './localApi.js'
import * as remote from './supabaseApi.js'
import { isSupabaseConfigured } from './supabaseClient.js'

const wantSupabase = import.meta.env.VITE_DATA_BACKEND === 'supabase'

if (wantSupabase && !isSupabaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    '[PR Tracker] VITE_DATA_BACKEND=supabase but Supabase keys are missing — falling back to the local backend.',
  )
}

const impl = wantSupabase && isSupabaseConfigured ? remote : local

export const BACKEND = impl === remote ? 'supabase' : 'local'

// Auth
export const getCurrentUser = impl.getCurrentUser
export const login = impl.login
export const signUp = impl.signUp
export const logout = impl.logout
export const getUserById = impl.getUserById
export const updateProfile = impl.updateProfile
export const changePassword = impl.changePassword

// Exercises
export const getExerciseLibrary = impl.getExerciseLibrary
export const searchExercises = impl.searchExercises
export const filterExercisesByMuscleGroup = impl.filterExercisesByMuscleGroup

// Routines
export const getUserRoutine = impl.getUserRoutine
export const getAllUserRoutines = impl.getAllUserRoutines
export const saveUserRoutine = impl.saveUserRoutine
export const updateUserRoutine = impl.updateUserRoutine
export const deleteExerciseFromRoutine = impl.deleteExerciseFromRoutine
export const reorderRoutineExercises = impl.reorderRoutineExercises

// Workouts
export const startWorkout = impl.startWorkout
export const saveWorkout = impl.saveWorkout
export const logRestDay = impl.logRestDay
export const getRecentLogs = impl.getRecentLogs
export const getMonthWorkouts = impl.getMonthWorkouts
export const getWorkout = impl.getWorkout
export const updateWorkout = impl.updateWorkout
export const deleteWorkout = impl.deleteWorkout

// PRs
export const calculatePRsAfterWorkout = impl.calculatePRsAfterWorkout
export const recalcUserPRs = impl.recalcUserPRs
export const getUserPRs = impl.getUserPRs
export const getExerciseHistory = impl.getExerciseHistory
export const getMonthlyExerciseProgress = impl.getMonthlyExerciseProgress

// Friends
export const searchUsersByUsername = impl.searchUsersByUsername
export const sendFriendRequest = impl.sendFriendRequest
export const getIncomingFriendRequests = impl.getIncomingFriendRequests
export const acceptFriendRequest = impl.acceptFriendRequest
export const rejectFriendRequest = impl.rejectFriendRequest
export const getFriends = impl.getFriends
export const removeFriend = impl.removeFriend

// Leaderboards
export const getLeaderboardEnabledExercises = impl.getLeaderboardEnabledExercises
export const getExerciseLeaderboard = impl.getExerciseLeaderboard

// Food
export const calculateFoodHealthScore = impl.calculateFoodHealthScore
export const logFood = impl.logFood
export const getFoodHistory = impl.getFoodHistory
export const pruneFoodLogs = impl.pruneFoodLogs

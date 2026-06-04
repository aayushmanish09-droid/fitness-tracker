// Shared exercise library. `id` is a stable slug so seeded PRs/history
// can reference exercises deterministically across reloads.

const slug = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

// raw: [name, muscle_group, category, is_weighted, leaderboard_enabled]
const RAW = [
  // ── Chest (push) ─────────────────────────────────────────────
  ['Flat Bench Press', 'chest', 'push', true, true],
  ['Incline Bench Press', 'chest', 'push', true, true],
  ['Decline Bench Press', 'chest', 'push', true, false],
  ['Dumbbell Bench Press', 'chest', 'push', true, false],
  ['Incline Dumbbell Bench Press', 'chest', 'push', true, false],
  ['Decline Dumbbell Bench Press', 'chest', 'push', true, false],
  ['Machine Chest Press', 'chest', 'push', true, true],
  ['Pec Deck', 'chest', 'push', true, false],
  ['Cable Fly', 'chest', 'push', true, false],
  ['Low Cable Fly', 'chest', 'push', true, false],
  ['High Cable Fly', 'chest', 'push', true, false],
  ['Dumbbell Fly', 'chest', 'push', true, false],
  ['Push-Up', 'chest', 'push', false, false],
  ['Weighted Push-Up', 'chest', 'push', true, false],
  ['Chest Dip', 'chest', 'push', true, false],

  // ── Back (pull) ──────────────────────────────────────────────
  ['Pull-Up', 'back', 'pull', false, false],
  ['Chin-Up', 'back', 'pull', false, false],
  ['Lat Pulldown', 'back', 'pull', true, false],
  ['Wide-Grip Lat Pulldown', 'back', 'pull', true, false],
  ['Close-Grip Lat Pulldown', 'back', 'pull', true, false],
  ['Seated Cable Row', 'back', 'pull', true, false],
  ['Barbell Row', 'back', 'pull', true, true],
  ['Dumbbell Row', 'back', 'pull', true, true],
  ['T-Bar Row', 'back', 'pull', true, false],
  ['Machine Row', 'back', 'pull', true, false],
  ['Chest-Supported Row', 'back', 'pull', true, false],
  ['Straight-Arm Pulldown', 'back', 'pull', true, false],
  ['Face Pull', 'back', 'pull', true, false],

  // ── Shoulders (push) ─────────────────────────────────────────
  ['Barbell Shoulder Press', 'shoulders', 'push', true, true],
  ['Dumbbell Shoulder Press', 'shoulders', 'push', true, false],
  ['Machine Shoulder Press', 'shoulders', 'push', true, false],
  ['Arnold Press', 'shoulders', 'push', true, false],
  ['Lateral Raise', 'shoulders', 'push', true, false],
  ['Cable Lateral Raise', 'shoulders', 'push', true, false],
  ['Front Raise', 'shoulders', 'push', true, false],
  ['Rear Delt Fly', 'shoulders', 'push', true, false],
  ['Reverse Pec Deck', 'shoulders', 'push', true, false],
  ['Upright Row', 'shoulders', 'push', true, false],

  // ── Biceps (pull) ────────────────────────────────────────────
  ['Barbell Curl', 'biceps', 'pull', true, false],
  ['EZ Bar Curl', 'biceps', 'pull', true, false],
  ['Dumbbell Curl', 'biceps', 'pull', true, false],
  ['Hammer Curl', 'biceps', 'pull', true, false],
  ['Preacher Curl', 'biceps', 'pull', true, false],
  ['Cable Curl', 'biceps', 'pull', true, false],
  ['Concentration Curl', 'biceps', 'pull', true, false],
  ['Incline Dumbbell Curl', 'biceps', 'pull', true, false],

  // ── Triceps (push) ───────────────────────────────────────────
  ['Tricep Pushdown', 'triceps', 'push', true, false],
  ['Rope Pushdown', 'triceps', 'push', true, false],
  ['Overhead Tricep Extension', 'triceps', 'push', true, false],
  ['Skull Crusher', 'triceps', 'push', true, false],
  ['Close-Grip Bench Press', 'triceps', 'push', true, false],
  ['Cable Kickback', 'triceps', 'push', true, false],
  ['Tricep Dip', 'triceps', 'push', true, false],

  // ── Legs ─────────────────────────────────────────────────────
  ['Squat', 'legs', 'legs', true, true],
  ['Front Squat', 'legs', 'legs', true, false],
  ['Hack Squat', 'legs', 'legs', true, false],
  ['Leg Press', 'legs', 'legs', true, true],
  ['Bulgarian Split Squat', 'legs', 'legs', true, false],
  ['Walking Lunges', 'legs', 'legs', true, false],
  ['Leg Extension', 'legs', 'legs', true, false],
  ['Hamstring Curl', 'legs', 'legs', true, false],
  ['Romanian Deadlift', 'legs', 'legs', true, true],
  ['Hip Thrust', 'legs', 'legs', true, false],
  ['Glute Bridge', 'legs', 'legs', true, false],
  ['Standing Calf Raise', 'legs', 'legs', true, false],
  ['Seated Calf Raise', 'legs', 'legs', true, false],

  // ── Core ─────────────────────────────────────────────────────
  ['Plank', 'core', 'legs', false, false],
  ['Crunch', 'core', 'legs', false, false],
  ['Cable Crunch', 'core', 'legs', true, false],
  ['Hanging Leg Raise', 'core', 'legs', false, false],
  ['Leg Raise', 'core', 'legs', false, false],
  ['Russian Twist', 'core', 'legs', true, false],
  ['Ab Wheel Rollout', 'core', 'legs', false, false],

  // ── Cardio ───────────────────────────────────────────────────
  ['Treadmill', 'cardio', 'cardio', false, false],
  ['Stairmaster', 'cardio', 'cardio', false, false],
  ['Cycling', 'cardio', 'cardio', false, false],
  ['Rowing Machine', 'cardio', 'cardio', false, false],
  ['Elliptical', 'cardio', 'cardio', false, false],
]

export const EXERCISE_LIBRARY = RAW.map(
  ([name, muscle_group, category, is_weighted, leaderboard_enabled]) => ({
    id: slug(name),
    name,
    muscle_group,
    category,
    is_weighted,
    leaderboard_enabled,
  }),
)

export const EXERCISE_BY_ID = Object.fromEntries(
  EXERCISE_LIBRARY.map((e) => [e.id, e]),
)

// ── Rest is still a real thing (Log Rest Day) ────────────────────
export const REST_LABEL = 'Rest'

// Legacy fixed types — kept for backward compatibility with older data.
export const ROUTINE_TYPES = ['Push', 'Pull', 'Legs', 'Upper', 'Lower']
export const WORKOUT_TYPES = [...ROUTINE_TYPES, 'Rest']

// ── Muscle groups ───────────────────────────────────────────────
export const ALL_MUSCLE_GROUPS = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'core', 'cardio']

export const MUSCLE_GROUP_LABELS = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  legs: 'Legs',
  core: 'Core',
  cardio: 'Cardio',
}

// Muscle groups suggested for a few common day labels (used to pre-filter the picker)
export const ROUTINE_MUSCLE_GROUPS = {
  Push: ['chest', 'shoulders', 'triceps'],
  Pull: ['back', 'biceps'],
  Legs: ['legs', 'core'],
  Upper: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
  Lower: ['legs', 'core'],
}

export const UNITS = ['kg', 'lbs']
export const SEXES = ['Male', 'Female', 'Other']

// ── Day color coding ─────────────────────────────────────────────
// Days now have custom names, so colors are derived from the label.
// Common labels get a stable, sensible color; anything else is hashed
// to the palette so it's still consistent every time.
const DAY_PALETTE = [
  '#3B82F6', // blue
  '#F0454B', // red
  '#22C55E', // green
  '#A855F7', // purple
  '#FB923C', // orange
  '#14B8A6', // teal
  '#EC4899', // pink
  '#EAB308', // yellow
  '#6366F1', // indigo
  '#06B6D4', // cyan
]

// substring → color (checked in order)
const KNOWN_LABEL_COLORS = [
  ['rest', '#4B5563'],
  ['push', '#3B82F6'],
  ['pull', '#F0454B'],
  ['leg', '#22C55E'],
  ['upper', '#A855F7'],
  ['lower', '#FB923C'],
  ['chest', '#06B6D4'],
  ['back', '#6366F1'],
  ['shoulder', '#EAB308'],
  ['arm', '#EC4899'],
  ['full body', '#14B8A6'],
  ['full-body', '#14B8A6'],
]

export function colorForLabel(label) {
  if (!label) return '#4B5563'
  const l = String(label).toLowerCase()
  for (const [key, color] of KNOWN_LABEL_COLORS) {
    if (l.includes(key)) return color
  }
  let h = 0
  for (let i = 0; i < l.length; i++) h = (h * 31 + l.charCodeAt(i)) >>> 0
  return DAY_PALETTE[h % DAY_PALETTE.length]
}

export const DAY_COUNT_OPTIONS = [2, 3, 4, 5, 6]

// ── Suggested splits, inspired by well-known coaches ─────────────
// Exercise names must match the library exactly (resolved to ids on apply).
export const SUGGESTED_SPLITS = {
  2: [
    {
      id: 'nippard-fullbody-2',
      name: 'Jeff Nippard — Full Body 2×',
      author: 'Jeff Nippard',
      blurb: 'Two efficient full-body sessions. Perfect when time is tight.',
      days: [
        { name: 'Full Body A', exercises: ['Flat Bench Press', 'Barbell Row', 'Squat', 'Lateral Raise', 'Barbell Curl', 'Tricep Pushdown'] },
        { name: 'Full Body B', exercises: ['Barbell Shoulder Press', 'Lat Pulldown', 'Romanian Deadlift', 'Incline Dumbbell Bench Press', 'Hammer Curl', 'Rope Pushdown'] },
      ],
    },
  ],
  3: [
    {
      id: 'nippard-ppl-3',
      name: 'Jeff Nippard — Push / Pull / Legs',
      author: 'Jeff Nippard',
      blurb: 'Balanced 3-day PPL that hits everything once a week. Great all-rounder.',
      days: [
        { name: 'Push', exercises: ['Flat Bench Press', 'Incline Dumbbell Bench Press', 'Machine Shoulder Press', 'Lateral Raise', 'Tricep Pushdown', 'Overhead Tricep Extension'] },
        { name: 'Pull', exercises: ['Pull-Up', 'Barbell Row', 'Lat Pulldown', 'Face Pull', 'Barbell Curl', 'Hammer Curl'] },
        { name: 'Legs', exercises: ['Squat', 'Romanian Deadlift', 'Leg Press', 'Leg Extension', 'Hamstring Curl', 'Standing Calf Raise'] },
      ],
    },
    {
      id: 'drmike-fullbody-3',
      name: 'Dr. Mike (RP) — Full Body 3×',
      author: 'Dr. Mike Israetel',
      blurb: 'Every muscle 3× a week. Ideal for beginners and busy schedules.',
      days: [
        { name: 'Full Body A', exercises: ['Flat Bench Press', 'Barbell Row', 'Squat', 'Lateral Raise', 'Barbell Curl', 'Tricep Pushdown'] },
        { name: 'Full Body B', exercises: ['Barbell Shoulder Press', 'Lat Pulldown', 'Romanian Deadlift', 'Incline Dumbbell Bench Press', 'Hammer Curl', 'Rope Pushdown'] },
        { name: 'Full Body C', exercises: ['Incline Bench Press', 'Seated Cable Row', 'Leg Press', 'Cable Fly', 'Preacher Curl', 'Skull Crusher'] },
      ],
    },
  ],
  4: [
    {
      id: 'nippard-ul-4',
      name: 'Jeff Nippard — Upper / Lower',
      author: 'Jeff Nippard',
      blurb: 'Each muscle 2× a week over 4 days. The science-based sweet spot.',
      days: [
        { name: 'Upper A', exercises: ['Flat Bench Press', 'Barbell Row', 'Barbell Shoulder Press', 'Lat Pulldown', 'Barbell Curl', 'Tricep Pushdown'] },
        { name: 'Lower A', exercises: ['Squat', 'Romanian Deadlift', 'Leg Press', 'Leg Extension', 'Standing Calf Raise', 'Hanging Leg Raise'] },
        { name: 'Upper B', exercises: ['Incline Dumbbell Bench Press', 'Seated Cable Row', 'Lateral Raise', 'Pull-Up', 'Hammer Curl', 'Overhead Tricep Extension'] },
        { name: 'Lower B', exercises: ['Front Squat', 'Hamstring Curl', 'Bulgarian Split Squat', 'Hip Thrust', 'Seated Calf Raise', 'Cable Crunch'] },
      ],
    },
    {
      id: 'arnold-4',
      name: 'Arnold — 4-Day Split',
      author: 'Arnold Schwarzenegger',
      blurb: 'Golden-era volume. Chest & back paired, then shoulders & arms.',
      days: [
        { name: 'Chest & Back', exercises: ['Flat Bench Press', 'Incline Bench Press', 'Pull-Up', 'Barbell Row', 'Cable Fly', 'Straight-Arm Pulldown'] },
        { name: 'Shoulders & Arms', exercises: ['Barbell Shoulder Press', 'Lateral Raise', 'Barbell Curl', 'Skull Crusher', 'Hammer Curl', 'Rope Pushdown'] },
        { name: 'Legs', exercises: ['Squat', 'Leg Press', 'Romanian Deadlift', 'Leg Extension', 'Hamstring Curl', 'Standing Calf Raise'] },
        { name: 'Chest & Back 2', exercises: ['Incline Dumbbell Bench Press', 'Dumbbell Row', 'Pec Deck', 'Lat Pulldown', 'Chest Dip', 'Face Pull'] },
      ],
    },
  ],
  5: [
    {
      id: 'arnold-bro-5',
      name: 'Arnold — 5-Day Bro Split',
      author: 'Arnold Schwarzenegger',
      blurb: 'One muscle group per day. Maximum focus and volume — the classic.',
      days: [
        { name: 'Chest', exercises: ['Flat Bench Press', 'Incline Bench Press', 'Dumbbell Fly', 'Machine Chest Press', 'Chest Dip'] },
        { name: 'Back', exercises: ['Pull-Up', 'Barbell Row', 'Lat Pulldown', 'Seated Cable Row', 'T-Bar Row'] },
        { name: 'Shoulders', exercises: ['Barbell Shoulder Press', 'Lateral Raise', 'Rear Delt Fly', 'Front Raise', 'Upright Row'] },
        { name: 'Arms', exercises: ['Barbell Curl', 'Hammer Curl', 'Preacher Curl', 'Tricep Pushdown', 'Skull Crusher', 'Overhead Tricep Extension'] },
        { name: 'Legs', exercises: ['Squat', 'Leg Press', 'Romanian Deadlift', 'Leg Extension', 'Hamstring Curl', 'Standing Calf Raise'] },
      ],
    },
    {
      id: 'cbum-5',
      name: 'Chris Bumstead — 5-Day',
      author: 'Chris Bumstead',
      blurb: 'PPL plus dedicated arms and shoulders. Built for aesthetics.',
      days: [
        { name: 'Push', exercises: ['Flat Bench Press', 'Incline Dumbbell Bench Press', 'Machine Shoulder Press', 'Lateral Raise', 'Tricep Pushdown'] },
        { name: 'Pull', exercises: ['Pull-Up', 'Barbell Row', 'Lat Pulldown', 'Face Pull', 'Barbell Curl'] },
        { name: 'Legs', exercises: ['Squat', 'Romanian Deadlift', 'Leg Press', 'Leg Extension', 'Standing Calf Raise'] },
        { name: 'Arms', exercises: ['EZ Bar Curl', 'Hammer Curl', 'Cable Curl', 'Rope Pushdown', 'Overhead Tricep Extension', 'Tricep Dip'] },
        { name: 'Shoulders & Abs', exercises: ['Dumbbell Shoulder Press', 'Cable Lateral Raise', 'Rear Delt Fly', 'Hanging Leg Raise', 'Cable Crunch'] },
      ],
    },
  ],
  6: [
    {
      id: 'nippard-ppl-6',
      name: 'Jeff Nippard — PPL (6-Day)',
      author: 'Jeff Nippard',
      blurb: 'Push/Pull/Legs run twice a week. High frequency for experienced lifters.',
      days: [
        { name: 'Push A', exercises: ['Flat Bench Press', 'Barbell Shoulder Press', 'Incline Dumbbell Bench Press', 'Lateral Raise', 'Tricep Pushdown'] },
        { name: 'Pull A', exercises: ['Pull-Up', 'Barbell Row', 'Lat Pulldown', 'Face Pull', 'Barbell Curl'] },
        { name: 'Legs A', exercises: ['Squat', 'Romanian Deadlift', 'Leg Press', 'Leg Extension', 'Standing Calf Raise'] },
        { name: 'Push B', exercises: ['Incline Bench Press', 'Machine Shoulder Press', 'Cable Fly', 'Cable Lateral Raise', 'Overhead Tricep Extension'] },
        { name: 'Pull B', exercises: ['Chin-Up', 'Seated Cable Row', 'Dumbbell Row', 'Rear Delt Fly', 'Hammer Curl'] },
        { name: 'Legs B', exercises: ['Front Squat', 'Hamstring Curl', 'Bulgarian Split Squat', 'Hip Thrust', 'Seated Calf Raise'] },
      ],
    },
  ],
}

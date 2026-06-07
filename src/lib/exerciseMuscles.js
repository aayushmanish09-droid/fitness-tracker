// Per-exercise muscle activation (primary movers + secondary/synergists).
// Region keys are shared with the MuscleMap SVG. Data follows standard
// exercise-anatomy references (e.g. ExRx / strength-training texts).

export const MUSCLE_LABELS = {
  chest: 'Chest',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  abs: 'Abs',
  obliques: 'Obliques',
  lats: 'Lats',
  traps: 'Traps / upper back',
  lowerBack: 'Lower back',
  glutes: 'Glutes',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  calves: 'Calves',
}

// id (slug) -> { p: [primary], s: [secondary] }
const MAP = {
  // ── Chest ──────────────────────────────────────────────────
  'flat-bench-press': { p: ['chest'], s: ['triceps', 'shoulders'] },
  'incline-bench-press': { p: ['chest', 'shoulders'], s: ['triceps'] },
  'decline-bench-press': { p: ['chest'], s: ['triceps', 'shoulders'] },
  'dumbbell-bench-press': { p: ['chest'], s: ['triceps', 'shoulders'] },
  'incline-dumbbell-bench-press': { p: ['chest', 'shoulders'], s: ['triceps'] },
  'decline-dumbbell-bench-press': { p: ['chest'], s: ['triceps', 'shoulders'] },
  'machine-chest-press': { p: ['chest'], s: ['triceps', 'shoulders'] },
  'pec-deck': { p: ['chest'], s: ['shoulders'] },
  'cable-fly': { p: ['chest'], s: ['shoulders'] },
  'low-cable-fly': { p: ['chest'], s: ['shoulders'] },
  'high-cable-fly': { p: ['chest'], s: ['shoulders'] },
  'dumbbell-fly': { p: ['chest'], s: ['shoulders'] },
  'push-up': { p: ['chest'], s: ['triceps', 'shoulders', 'abs'] },
  'weighted-push-up': { p: ['chest'], s: ['triceps', 'shoulders', 'abs'] },
  'chest-dip': { p: ['chest'], s: ['triceps', 'shoulders'] },

  // ── Back ───────────────────────────────────────────────────
  'pull-up': { p: ['lats'], s: ['biceps', 'traps', 'shoulders', 'forearms'] },
  'chin-up': { p: ['lats', 'biceps'], s: ['traps', 'forearms'] },
  'lat-pulldown': { p: ['lats'], s: ['biceps', 'traps', 'forearms'] },
  'wide-grip-lat-pulldown': { p: ['lats'], s: ['biceps', 'traps'] },
  'close-grip-lat-pulldown': { p: ['lats'], s: ['biceps', 'traps'] },
  'seated-cable-row': { p: ['lats', 'traps'], s: ['biceps', 'shoulders', 'lowerBack'] },
  'barbell-row': { p: ['lats', 'traps'], s: ['biceps', 'shoulders', 'lowerBack', 'forearms'] },
  'dumbbell-row': { p: ['lats'], s: ['traps', 'biceps', 'shoulders'] },
  't-bar-row': { p: ['lats', 'traps'], s: ['biceps', 'shoulders', 'lowerBack'] },
  'machine-row': { p: ['lats', 'traps'], s: ['biceps', 'shoulders'] },
  'chest-supported-row': { p: ['lats', 'traps'], s: ['biceps', 'shoulders'] },
  'straight-arm-pulldown': { p: ['lats'], s: ['triceps', 'abs'] },
  'face-pull': { p: ['shoulders', 'traps'], s: ['biceps'] },

  // ── Shoulders ──────────────────────────────────────────────
  'barbell-shoulder-press': { p: ['shoulders'], s: ['triceps', 'traps'] },
  'dumbbell-shoulder-press': { p: ['shoulders'], s: ['triceps', 'traps'] },
  'machine-shoulder-press': { p: ['shoulders'], s: ['triceps'] },
  'arnold-press': { p: ['shoulders'], s: ['triceps', 'traps'] },
  'lateral-raise': { p: ['shoulders'], s: ['traps'] },
  'cable-lateral-raise': { p: ['shoulders'], s: ['traps'] },
  'front-raise': { p: ['shoulders'], s: ['chest'] },
  'rear-delt-fly': { p: ['shoulders'], s: ['traps'] },
  'reverse-pec-deck': { p: ['shoulders'], s: ['traps'] },
  'upright-row': { p: ['shoulders', 'traps'], s: ['biceps'] },

  // ── Biceps ─────────────────────────────────────────────────
  'barbell-curl': { p: ['biceps'], s: ['forearms'] },
  'ez-bar-curl': { p: ['biceps'], s: ['forearms'] },
  'dumbbell-curl': { p: ['biceps'], s: ['forearms'] },
  'hammer-curl': { p: ['biceps', 'forearms'], s: [] },
  'preacher-curl': { p: ['biceps'], s: ['forearms'] },
  'cable-curl': { p: ['biceps'], s: ['forearms'] },
  'concentration-curl': { p: ['biceps'], s: ['forearms'] },
  'incline-dumbbell-curl': { p: ['biceps'], s: ['forearms'] },

  // ── Triceps ────────────────────────────────────────────────
  'tricep-pushdown': { p: ['triceps'], s: [] },
  'rope-pushdown': { p: ['triceps'], s: [] },
  'overhead-tricep-extension': { p: ['triceps'], s: [] },
  'skull-crusher': { p: ['triceps'], s: [] },
  'close-grip-bench-press': { p: ['triceps'], s: ['chest', 'shoulders'] },
  'cable-kickback': { p: ['triceps'], s: [] },
  'tricep-dip': { p: ['triceps'], s: ['chest', 'shoulders'] },

  // ── Legs ───────────────────────────────────────────────────
  squat: { p: ['quads', 'glutes'], s: ['hamstrings', 'lowerBack', 'abs', 'calves'] },
  'front-squat': { p: ['quads'], s: ['glutes', 'abs', 'lowerBack'] },
  'hack-squat': { p: ['quads'], s: ['glutes', 'hamstrings'] },
  'leg-press': { p: ['quads', 'glutes'], s: ['hamstrings'] },
  'bulgarian-split-squat': { p: ['quads', 'glutes'], s: ['hamstrings', 'calves'] },
  'walking-lunges': { p: ['quads', 'glutes'], s: ['hamstrings', 'calves'] },
  'leg-extension': { p: ['quads'], s: [] },
  'hamstring-curl': { p: ['hamstrings'], s: ['calves'] },
  'romanian-deadlift': { p: ['hamstrings', 'glutes'], s: ['lowerBack', 'traps'] },
  'hip-thrust': { p: ['glutes'], s: ['hamstrings'] },
  'glute-bridge': { p: ['glutes'], s: ['hamstrings'] },
  'standing-calf-raise': { p: ['calves'], s: [] },
  'seated-calf-raise': { p: ['calves'], s: [] },

  // ── Core ───────────────────────────────────────────────────
  plank: { p: ['abs'], s: ['obliques', 'shoulders'] },
  crunch: { p: ['abs'], s: [] },
  'cable-crunch': { p: ['abs'], s: [] },
  'hanging-leg-raise': { p: ['abs'], s: ['obliques', 'forearms'] },
  'leg-raise': { p: ['abs'], s: ['obliques'] },
  'russian-twist': { p: ['obliques'], s: ['abs'] },
  'ab-wheel-rollout': { p: ['abs'], s: ['obliques', 'shoulders', 'lats'] },

  // ── Cardio ─────────────────────────────────────────────────
  treadmill: { p: ['quads', 'calves'], s: ['hamstrings', 'glutes'] },
  stairmaster: { p: ['quads', 'glutes'], s: ['calves', 'hamstrings'] },
  cycling: { p: ['quads'], s: ['glutes', 'calves', 'hamstrings'] },
  'rowing-machine': { p: ['lats', 'quads'], s: ['biceps', 'traps', 'hamstrings'] },
  elliptical: { p: ['quads', 'glutes'], s: ['hamstrings', 'calves'] },
}

// Fallback by muscle_group so nothing is ever blank.
const GROUP_FALLBACK = {
  chest: { p: ['chest'], s: ['triceps', 'shoulders'] },
  back: { p: ['lats'], s: ['biceps', 'traps'] },
  shoulders: { p: ['shoulders'], s: ['triceps'] },
  biceps: { p: ['biceps'], s: ['forearms'] },
  triceps: { p: ['triceps'], s: [] },
  legs: { p: ['quads', 'glutes'], s: ['hamstrings'] },
  core: { p: ['abs'], s: ['obliques'] },
  cardio: { p: ['quads'], s: ['calves'] },
}

export function getExerciseMuscles(exercise) {
  if (!exercise) return { primary: [], secondary: [] }
  const m = MAP[exercise.id] || GROUP_FALLBACK[exercise.muscle_group] || { p: [], s: [] }
  return { primary: m.p || [], secondary: m.s || [] }
}

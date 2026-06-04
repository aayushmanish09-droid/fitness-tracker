// ── Workout / routine types ──────────────────────────────────────
export const ROUTINE_TYPES = ['Push', 'Pull', 'Legs', 'Upper', 'Lower']

// Includes Rest for logging/calendar purposes
export const WORKOUT_TYPES = [...ROUTINE_TYPES, 'Rest']

// Color coding per spec — used by calendar, badges, charts
export const WORKOUT_COLORS = {
  Push: { hex: '#3B82F6', tw: 'push', label: 'Push' }, // blue
  Pull: { hex: '#F0454B', tw: 'pull', label: 'Pull' }, // red
  Legs: { hex: '#22C55E', tw: 'legs', label: 'Legs' }, // green
  Upper: { hex: '#A855F7', tw: 'upper', label: 'Upper' }, // purple
  Lower: { hex: '#FB923C', tw: 'lower', label: 'Lower' }, // orange
  Rest: { hex: '#4B5563', tw: 'rest', label: 'Rest' }, // dark gray
}

// Muscle groups relevant to each routine type (drives builder filters)
export const ROUTINE_MUSCLE_GROUPS = {
  Push: ['chest', 'shoulders', 'triceps'],
  Pull: ['back', 'biceps'],
  Legs: ['legs', 'core'],
  Upper: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
  Lower: ['legs', 'core'],
}

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

export const UNITS = ['kg', 'lbs']
export const SEXES = ['Male', 'Female', 'Other']

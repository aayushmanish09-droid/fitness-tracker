import { WORKOUT_COLORS } from '../lib/constants.js'

export function WorkoutDot({ type, size = 10 }) {
  const c = WORKOUT_COLORS[type] || WORKOUT_COLORS.Rest
  return (
    <span
      className="inline-block rounded-full"
      style={{ width: size, height: size, backgroundColor: c.hex }}
      aria-hidden="true"
    />
  )
}

export function WorkoutBadge({ type }) {
  const c = WORKOUT_COLORS[type] || WORKOUT_COLORS.Rest
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ backgroundColor: c.hex + '22', color: c.hex }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c.hex }} />
      {c.label}
    </span>
  )
}

export function WorkoutLegend({ types, className = '' }) {
  const list = types || Object.keys(WORKOUT_COLORS)
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 ${className}`}>
      {list.map((t) => {
        const c = WORKOUT_COLORS[t]
        return (
          <span key={t} className="inline-flex items-center gap-2 text-xs font-medium text-mist">
            <span className="h-3 w-3 rounded-md" style={{ backgroundColor: c.hex }} />
            {c.label}
          </span>
        )
      })}
    </div>
  )
}

import { colorForLabel } from '../lib/constants.js'

export function WorkoutDot({ type, size = 10 }) {
  return (
    <span
      className="inline-block rounded-full"
      style={{ width: size, height: size, backgroundColor: colorForLabel(type) }}
      aria-hidden="true"
    />
  )
}

export function WorkoutBadge({ type }) {
  const hex = colorForLabel(type)
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ backgroundColor: hex + '22', color: hex }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: hex }} />
      {type}
    </span>
  )
}

// labels: array of day labels to show in the legend
export function WorkoutLegend({ labels = [], className = '' }) {
  if (labels.length === 0) return null
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 ${className}`}>
      {labels.map((label) => (
        <span key={label} className="inline-flex items-center gap-2 text-xs font-medium text-mist">
          <span className="h-3 w-3 rounded-md" style={{ backgroundColor: colorForLabel(label) }} />
          {label}
        </span>
      ))}
    </div>
  )
}

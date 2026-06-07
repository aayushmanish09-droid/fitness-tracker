import { useState } from 'react'
import { Info } from 'lucide-react'
import Modal from './Modal.jsx'
import MuscleMap from './MuscleMap.jsx'
import { getExerciseMuscles, MUSCLE_LABELS } from '../lib/exerciseMuscles.js'
import { MUSCLE_GROUP_LABELS } from '../lib/constants.js'

// Tiny ⓘ button that opens a modal showing the muscles an exercise works.
export default function ExerciseInfo({ exercise, size = 'sm', className = '' }) {
  const [open, setOpen] = useState(false)
  if (!exercise) return null
  const { primary, secondary } = getExerciseMuscles(exercise)
  const dim = size === 'md' ? 'h-7 w-7' : 'h-6 w-6'

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen(true)
        }}
        aria-label={`Muscles worked by ${exercise.name}`}
        title={`Muscles worked by ${exercise.name}`}
        className={`grid ${dim} shrink-0 place-items-center rounded-full border border-white/15 text-ash transition-colors duration-200 hover:border-lime-400/60 hover:text-lime-300 cursor-pointer ${className}`}
      >
        <Info className="h-3.5 w-3.5" />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={exercise.name} maxWidth="max-w-md">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-lime-400">
          {MUSCLE_GROUP_LABELS[exercise.muscle_group] || exercise.muscle_group}
        </p>
        <p className="mb-4 text-sm text-mist">Muscles this exercise works:</p>

        <div className="rounded-3xl bg-ink-800/60 py-4">
          <MuscleMap primary={primary} secondary={secondary} />
        </div>

        {/* legend */}
        <div className="mt-4 flex items-center justify-center gap-5 text-xs">
          <span className="inline-flex items-center gap-1.5 text-chalk">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#C7F716' }} />
            Primary
          </span>
          <span className="inline-flex items-center gap-1.5 text-chalk">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: 'rgba(199,247,22,0.30)' }} />
            Secondary
          </span>
        </div>

        {/* lists */}
        <div className="mt-4 space-y-2">
          <MuscleRow label="Primary" muscles={primary} strong />
          {secondary.length > 0 && <MuscleRow label="Secondary" muscles={secondary} />}
        </div>
      </Modal>
    </>
  )
}

function MuscleRow({ label, muscles, strong }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="w-20 shrink-0 font-semibold text-ash">{label}</span>
      <span className={strong ? 'font-medium text-chalk' : 'text-mist'}>
        {muscles.length ? muscles.map((m) => MUSCLE_LABELS[m] || m).join(', ') : '—'}
      </span>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { Search, Plus, Check, Trophy } from 'lucide-react'
import Modal from './Modal.jsx'
import { Button } from './ui.jsx'
import ExerciseInfo from './ExerciseInfo.jsx'
import { EXERCISE_LIBRARY } from '../lib/exerciseLibrary.js'
import { ALL_MUSCLE_GROUPS, MUSCLE_GROUP_LABELS } from '../lib/constants.js'

// Reusable searchable / muscle-filtered exercise picker.
// existingIds: Set of exercise ids already added (shown checked).
// onAdd(exercise): called when an exercise is tapped.
export default function ExercisePicker({
  open,
  onClose,
  existingIds,
  onAdd,
  title = 'Add exercises',
  subtitle,
}) {
  const [query, setQuery] = useState('')
  const [muscle, setMuscle] = useState('all')

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return EXERCISE_LIBRARY.filter((e) => {
      if (muscle !== 'all' && e.muscle_group !== muscle) return false
      if (q && !e.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [query, muscle])

  return (
    <Modal open={open} onClose={onClose} title={title}>
      {subtitle && <p className="mb-3 text-sm text-mist">{subtitle}</p>}

      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ash" />
        <input
          autoFocus
          className="input-field pl-11"
          placeholder="Search exercises…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        <Chip active={muscle === 'all'} onClick={() => setMuscle('all')}>
          All
        </Chip>
        {ALL_MUSCLE_GROUPS.map((g) => (
          <Chip key={g} active={muscle === g} onClick={() => setMuscle(g)}>
            {MUSCLE_GROUP_LABELS[g]}
          </Chip>
        ))}
      </div>

      <div className="max-h-[45vh] space-y-1.5 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-ash">No exercises match.</p>
        ) : (
          filtered.map((ex) => {
            const added = existingIds?.has(ex.id)
            return (
              <div key={ex.id} className="flex items-center gap-1.5">
                <button
                  onClick={() => onAdd(ex)}
                  className="group flex min-w-0 flex-1 items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-ink-800/60 px-4 py-3 text-left transition-colors duration-200 hover:border-white/15 cursor-pointer"
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 font-medium text-chalk">
                      <span className="truncate">{ex.name}</span>
                      {ex.leaderboard_enabled && <Trophy className="h-3.5 w-3.5 shrink-0 text-lime-400" />}
                    </span>
                    <span className="text-xs capitalize text-ash">{MUSCLE_GROUP_LABELS[ex.muscle_group]}</span>
                  </span>
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl transition-colors ${
                      added ? 'bg-lime-400 text-ink-900' : 'bg-ink-600 text-mist group-hover:text-chalk'
                    }`}
                  >
                    {added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </span>
                </button>
                <ExerciseInfo exercise={ex} />
              </div>
            )
          })
        )}
      </div>

      <div className="mt-4">
        <Button className="w-full" onClick={onClose}>
          Done
        </Button>
      </div>
    </Modal>
  )
}

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-200 cursor-pointer ${
        active ? 'border-lime-400/50 bg-lime-400/15 text-lime-300' : 'border-white/10 text-mist hover:text-chalk'
      }`}
    >
      {children}
    </button>
  )
}

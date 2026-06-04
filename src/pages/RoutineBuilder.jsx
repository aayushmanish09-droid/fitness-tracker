import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Search, Plus, Check, ArrowUp, ArrowDown, Trash2, Save, Trophy, Dumbbell } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import * as api from '../services/api.js'
import { EXERCISE_LIBRARY } from '../lib/exerciseLibrary.js'
import {
  ROUTINE_TYPES,
  ROUTINE_MUSCLE_GROUPS,
  MUSCLE_GROUP_LABELS,
  WORKOUT_COLORS,
} from '../lib/constants.js'
import { Button, EmptyState, SectionTitle } from '../components/ui.jsx'
import { toast } from '../components/toast.jsx'

export default function RoutineBuilder() {
  const { user } = useAuth()
  const { type: typeParam } = useParams()
  const navigate = useNavigate()

  const initialType = ROUTINE_TYPES.includes(typeParam) ? typeParam : 'Push'
  const [type, setType] = useState(initialType)
  const [selected, setSelected] = useState([]) // array of exercise objects
  const [search, setSearch] = useState('')
  const [muscle, setMuscle] = useState('all')
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // load existing routine when type changes
  useEffect(() => {
    setLoaded(false)
    api.getUserRoutine(user.id, type).then((routine) => {
      setSelected(routine ? routine.exercises : [])
      setMuscle('all')
      setLoaded(true)
    })
  }, [user.id, type])

  const selectedIds = useMemo(() => new Set(selected.map((e) => e.id)), [selected])
  const muscleGroups = ROUTINE_MUSCLE_GROUPS[type] || []

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return EXERCISE_LIBRARY.filter((e) => {
      if (muscle !== 'all' && e.muscle_group !== muscle) return false
      if (q && !e.name.toLowerCase().includes(q)) return false
      // bias the default (no search, no filter) toward this routine's muscle groups
      if (muscle === 'all' && !q && muscleGroups.length && !muscleGroups.includes(e.muscle_group))
        return false
      return true
    })
  }, [search, muscle, muscleGroups])

  const add = (ex) => setSelected((s) => (s.some((e) => e.id === ex.id) ? s : [...s, ex]))
  const remove = (id) => setSelected((s) => s.filter((e) => e.id !== id))
  const move = (idx, dir) =>
    setSelected((s) => {
      const ni = idx + dir
      if (ni < 0 || ni >= s.length) return s
      const copy = [...s]
      ;[copy[idx], copy[ni]] = [copy[ni], copy[idx]]
      return copy
    })

  const save = async () => {
    if (selected.length === 0) {
      toast.error('Add at least one exercise before saving.')
      return
    }
    setSaving(true)
    await api.saveUserRoutine(user.id, type, selected.map((e) => e.id))
    setSaving(false)
    toast.success(`${type} routine saved — ${selected.length} exercises.`)
  }

  const c = WORKOUT_COLORS[type]

  return (
    <div className="space-y-6">
      <SectionTitle eyebrow="Routine Builder" title="Build your split" />

      {/* Type selector */}
      <div className="flex flex-wrap gap-2">
        {ROUTINE_TYPES.map((t) => {
          const tc = WORKOUT_COLORS[t]
          const active = t === type
          return (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-bold transition-colors duration-200 cursor-pointer ${
                active ? 'border-transparent text-ink-900' : 'border-white/10 text-mist hover:text-chalk'
              }`}
              style={active ? { backgroundColor: tc.hex } : undefined}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: active ? '#08090B' : tc.hex }}
              />
              {t}
            </button>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Library */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ash" />
            <input
              className="input-field pl-11"
              placeholder="Search exercises…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <FilterChip active={muscle === 'all'} onClick={() => setMuscle('all')}>
              {search ? 'All' : 'Suggested'}
            </FilterChip>
            {muscleGroups.map((g) => (
              <FilterChip key={g} active={muscle === g} onClick={() => setMuscle(g)}>
                {MUSCLE_GROUP_LABELS[g]}
              </FilterChip>
            ))}
          </div>

          <div className="max-h-[420px] space-y-1.5 overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-ash">No exercises match.</p>
            ) : (
              filtered.map((ex) => {
                const added = selectedIds.has(ex.id)
                return (
                  <button
                    key={ex.id}
                    onClick={() => (added ? remove(ex.id) : add(ex))}
                    className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-ink-700/50 px-4 py-3 text-left transition-colors duration-200 hover:border-white/15 cursor-pointer"
                  >
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 font-medium text-chalk">
                        <span className="truncate">{ex.name}</span>
                        {ex.leaderboard_enabled && (
                          <Trophy className="h-3.5 w-3.5 shrink-0 text-lime-400" aria-label="Leaderboard exercise" />
                        )}
                      </span>
                      <span className="text-xs capitalize text-ash">
                        {MUSCLE_GROUP_LABELS[ex.muscle_group]}
                        {!ex.is_weighted && ' · bodyweight'}
                      </span>
                    </span>
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl transition-colors ${
                        added ? 'bg-lime-400 text-ink-900' : 'bg-ink-600 text-mist group-hover:text-chalk'
                      }`}
                    >
                      {added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Selected */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl font-bold text-chalk">
              {type} routine{' '}
              <span className="text-base font-sans font-normal text-ash">· {selected.length} exercises</span>
            </h3>
          </div>

          {!loaded ? null : selected.length === 0 ? (
            <EmptyState icon={Dumbbell} title="No exercises yet">
              Add exercises from the library — they'll load automatically next time you start a {type} workout.
            </EmptyState>
          ) : (
            <ul className="space-y-2">
              {selected.map((ex, i) => (
                <li
                  key={ex.id}
                  className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-ink-700/60 px-3 py-2.5"
                >
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg font-display text-base font-bold"
                    style={{ backgroundColor: c.hex + '22', color: c.hex }}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium text-chalk">{ex.name}</span>
                  <div className="flex items-center gap-0.5">
                    <IconBtn label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                      <ArrowUp className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn label="Move down" disabled={i === selected.length - 1} onClick={() => move(i, 1)}>
                      <ArrowDown className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn label="Remove" danger onClick={() => remove(ex.id)}>
                      <Trash2 className="h-4 w-4" />
                    </IconBtn>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={save} loading={saving} className="flex-1" size="lg">
              <Save className="h-5 w-5" />
              Save routine
            </Button>
            {selected.length > 0 && (
              <Button
                variant="outline"
                size="lg"
                onClick={async () => {
                  await api.saveUserRoutine(user.id, type, selected.map((e) => e.id))
                  navigate(`/workout/${type}`)
                }}
              >
                Save & start
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors duration-200 cursor-pointer ${
        active
          ? 'border-lime-400/50 bg-lime-400/15 text-lime-300'
          : 'border-white/10 text-mist hover:text-chalk'
      }`}
    >
      {children}
    </button>
  )
}

function IconBtn({ children, label, onClick, disabled, danger }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`grid h-8 w-8 place-items-center rounded-lg transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer ${
        danger ? 'text-ash hover:bg-pull/15 hover:text-pull' : 'text-ash hover:bg-white/5 hover:text-chalk'
      }`}
    >
      {children}
    </button>
  )
}

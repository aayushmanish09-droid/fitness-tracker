import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  Dumbbell,
  Sparkles,
  PencilLine,
  Trophy,
  RotateCcw,
  ChevronRight,
  Check,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import * as api from '../services/api.js'
import { EXERCISE_LIBRARY, EXERCISE_BY_ID } from '../lib/exerciseLibrary.js'
import { DAY_COUNT_OPTIONS, SUGGESTED_SPLITS, colorForLabel } from '../lib/constants.js'
import { Button, EmptyState, SectionTitle, PageLoader } from '../components/ui.jsx'
import ExercisePicker from '../components/ExercisePicker.jsx'
import ExerciseInfo from '../components/ExerciseInfo.jsx'
import { toast } from '../components/toast.jsx'

const NAME_TO_ID = Object.fromEntries(EXERCISE_LIBRARY.map((e) => [e.name, e.id]))
const resolveNames = (names) => names.map((n) => EXERCISE_BY_ID[NAME_TO_ID[n]]).filter(Boolean)

export default function RoutineBuilder() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [phase, setPhase] = useState('loading') // loading | days | method | editor
  const [dayCount, setDayCount] = useState(4)
  const [days, setDays] = useState([]) // [{ id?, name, exercises:[exObj] }]
  const [pickerFor, setPickerFor] = useState(null) // day index
  const [saving, setSaving] = useState(false)

  // load existing split
  useEffect(() => {
    api.getSplit(user.id).then((split) => {
      if (split.length > 0) {
        setDays(split.map((d) => ({ id: d.id, name: d.name, exercises: d.exercises })))
        setDayCount(split.length)
        setPhase('editor')
      } else {
        setPhase('days')
      }
    })
  }, [user.id])

  // ── builders ──────────────────────────────────────────────────
  const buildBlank = (n) => {
    setDays(Array.from({ length: n }, (_, i) => ({ name: `Day ${i + 1}`, exercises: [] })))
    setPhase('editor')
  }
  const applyTemplate = (tpl) => {
    setDays(tpl.days.map((d) => ({ name: d.name, exercises: resolveNames(d.exercises) })))
    setDayCount(tpl.days.length)
    setPhase('editor')
  }

  // ── editor ops ────────────────────────────────────────────────
  const setDayName = (i, name) => setDays((d) => d.map((x, j) => (j === i ? { ...x, name } : x)))
  const addExercise = (i, ex) =>
    setDays((d) =>
      d.map((x, j) =>
        j === i ? { ...x, exercises: x.exercises.some((e) => e.id === ex.id) ? x.exercises : [...x.exercises, ex] } : x,
      ),
    )
  const removeExercise = (i, exId) =>
    setDays((d) => d.map((x, j) => (j === i ? { ...x, exercises: x.exercises.filter((e) => e.id !== exId) } : x)))
  const moveExercise = (i, idx, dir) =>
    setDays((d) =>
      d.map((x, j) => {
        if (j !== i) return x
        const ni = idx + dir
        if (ni < 0 || ni >= x.exercises.length) return x
        const ex = [...x.exercises]
        ;[ex[idx], ex[ni]] = [ex[ni], ex[idx]]
        return { ...x, exercises: ex }
      }),
    )
  const moveDay = (i, dir) =>
    setDays((d) => {
      const ni = i + dir
      if (ni < 0 || ni >= d.length) return d
      const copy = [...d]
      ;[copy[i], copy[ni]] = [copy[ni], copy[i]]
      return copy
    })
  const removeDay = (i) => setDays((d) => d.filter((_, j) => j !== i))
  const addDay = () => setDays((d) => [...d, { name: `Day ${d.length + 1}`, exercises: [] }])

  const save = async () => {
    if (days.some((d) => !d.name.trim())) {
      toast.error('Give every day a name first.')
      return
    }
    if (days.every((d) => d.exercises.length === 0)) {
      toast.error('Add at least one exercise to a day.')
      return
    }
    setSaving(true)
    await api.saveSplit(
      user.id,
      days.map((d) => ({
        id: typeof d.id === 'string' ? d.id : undefined,
        name: d.name.trim(),
        exerciseIds: d.exercises.map((e) => e.id),
      })),
    )
    const fresh = await api.getSplit(user.id)
    setDays(fresh.map((d) => ({ id: d.id, name: d.name, exercises: d.exercises })))
    setSaving(false)
    toast.success(`${days.length}-day split saved 💪`)
  }

  if (phase === 'loading') return <PageLoader />

  // ── STEP 1: how many days ─────────────────────────────────────
  if (phase === 'days') {
    return (
      <div className="space-y-6">
        <SectionTitle eyebrow="Routine Builder" title="Let's build your split" />
        <div className="card p-6 sm:p-8">
          <h2 className="font-display text-2xl font-bold text-chalk">How many days a week do you train?</h2>
          <p className="mt-1 text-mist">Pick the number that fits your schedule — you can change it later.</p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {DAY_COUNT_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => {
                  setDayCount(n)
                  setPhase('method')
                }}
                className="group flex flex-col items-center rounded-3xl border border-white/[0.08] bg-ink-800/60 py-6 transition-all duration-200 hover:border-lime-400/50 hover:bg-ink-700 cursor-pointer"
              >
                <span className="font-display text-4xl font-extrabold text-chalk group-hover:text-lime-400">{n}</span>
                <span className="text-xs text-ash">days</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── STEP 2: build own vs suggested ────────────────────────────
  if (phase === 'method') {
    const templates = SUGGESTED_SPLITS[dayCount] || []
    return (
      <div className="space-y-6">
        <SectionTitle eyebrow="Routine Builder" title={`Your ${dayCount}-day split`} />
        <button onClick={() => setPhase('days')} className="text-sm text-mist hover:text-chalk cursor-pointer">
          ← Change day count
        </button>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Build your own */}
          <button
            onClick={() => buildBlank(dayCount)}
            className="group flex flex-col items-start rounded-3xl border border-lime-400/30 bg-gradient-to-br from-lime-400/[0.1] to-transparent p-6 text-left transition-all duration-200 hover:border-lime-400/60 cursor-pointer"
          >
            <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-lime-400/20 text-lime-400">
              <PencilLine className="h-6 w-6" />
            </span>
            <p className="font-display text-2xl font-bold text-chalk">Build my own</p>
            <p className="mt-1 text-sm text-mist">
              Start with {dayCount} blank days. Name each one (Push, Arms, Chest & Tris — your call) and add
              exercises filtered by muscle group.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-lime-400">
              Start from scratch <ChevronRight className="h-4 w-4" />
            </span>
          </button>

          {/* Suggested */}
          <div className="rounded-3xl border border-white/[0.07] bg-ink-700/60 p-6">
            <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-ink-600 text-lime-400">
              <Sparkles className="h-6 w-6" />
            </span>
            <p className="font-display text-2xl font-bold text-chalk">New here? Use a proven split</p>
            <p className="mt-1 text-sm text-mist">
              Popular {dayCount}-day routines inspired by well-known coaches. Pick one, then tweak it however you
              like.
            </p>
            <div className="mt-4 space-y-2">
              {templates.length === 0 ? (
                <p className="text-sm text-ash">No suggested template for {dayCount} days — build your own above.</p>
              ) : (
                templates.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => applyTemplate(tpl)}
                    className="group block w-full rounded-2xl border border-white/[0.08] bg-ink-800/70 p-3.5 text-left transition-colors duration-200 hover:border-lime-400/50 cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-chalk">{tpl.name}</span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-ash transition-transform group-hover:translate-x-0.5 group-hover:text-lime-400" />
                    </div>
                    <p className="mt-0.5 text-xs text-mist">{tpl.blurb}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {tpl.days.map((d, i) => (
                        <span
                          key={i}
                          className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                          style={{ backgroundColor: colorForLabel(d.name) + '22', color: colorForLabel(d.name) }}
                        >
                          {d.name}
                        </span>
                      ))}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
        <p className="text-center text-xs text-ash">
          Splits are inspired by publicly shared training styles — not official programs. Always train within your limits.
        </p>
      </div>
    )
  }

  // ── EDITOR ────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-4">
      <SectionTitle
        eyebrow="Routine Builder"
        title={`${days.length}-day split`}
        right={
          <button
            onClick={() => setPhase('days')}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-mist transition hover:bg-white/5 hover:text-chalk cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Start over
          </button>
        }
      />

      <div className="space-y-4">
        {days.map((day, i) => (
          <div key={day.id || `tmp-${i}`} className="card p-4 sm:p-5">
            {/* day header */}
            <div className="mb-3 flex items-center gap-2">
              <span className="h-9 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: colorForLabel(day.name) }} />
              <input
                value={day.name}
                onChange={(e) => setDayName(i, e.target.value)}
                placeholder={`Day ${i + 1} name`}
                className="input-field flex-1 py-2 font-display text-lg font-bold"
                aria-label={`Day ${i + 1} name`}
              />
              <div className="flex items-center gap-0.5">
                <IconBtn label="Move up" disabled={i === 0} onClick={() => moveDay(i, -1)}>
                  <ArrowUp className="h-4 w-4" />
                </IconBtn>
                <IconBtn label="Move down" disabled={i === days.length - 1} onClick={() => moveDay(i, 1)}>
                  <ArrowDown className="h-4 w-4" />
                </IconBtn>
                <IconBtn label="Delete day" danger disabled={days.length === 1} onClick={() => removeDay(i)}>
                  <Trash2 className="h-4 w-4" />
                </IconBtn>
              </div>
            </div>

            {/* exercises */}
            {day.exercises.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/10 px-4 py-4 text-center text-sm text-ash">
                No exercises yet — add some below.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {day.exercises.map((ex, idx) => (
                  <li
                    key={ex.id}
                    className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-ink-800/50 px-3 py-2"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-ink-700 font-display text-sm font-bold text-mist">
                      {idx + 1}
                    </span>
                    <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate font-medium text-chalk">
                      <span className="truncate">{ex.name}</span>
                      {ex.leaderboard_enabled && <Trophy className="h-3.5 w-3.5 shrink-0 text-lime-400" />}
                    </span>
                    <div className="flex items-center gap-0.5">
                      <ExerciseInfo exercise={ex} />
                      <IconBtn label="Move up" disabled={idx === 0} onClick={() => moveExercise(i, idx, -1)}>
                        <ArrowUp className="h-3.5 w-3.5" />
                      </IconBtn>
                      <IconBtn label="Move down" disabled={idx === day.exercises.length - 1} onClick={() => moveExercise(i, idx, 1)}>
                        <ArrowDown className="h-3.5 w-3.5" />
                      </IconBtn>
                      <IconBtn label="Remove" danger onClick={() => removeExercise(i, ex.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </IconBtn>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <button
              onClick={() => setPickerFor(i)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-lime-400 transition hover:bg-lime-400/10 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add exercise
            </button>
          </div>
        ))}

        <button
          onClick={addDay}
          className="flex w-full items-center justify-center gap-2 rounded-3xl border border-dashed border-white/15 py-4 text-sm font-semibold text-mist transition-colors duration-200 hover:border-lime-400/50 hover:text-lime-300 cursor-pointer"
        >
          <Plus className="h-5 w-5" />
          Add another day
        </button>
      </div>

      {/* sticky save */}
      <div className="sticky bottom-20 z-30 md:bottom-4">
        <div className="card flex items-center justify-between gap-3 border-lime-400/20 px-4 py-3">
          <span className="text-sm text-mist">
            {days.length} day{days.length === 1 ? '' : 's'} ·{' '}
            {days.reduce((n, d) => n + d.exercises.length, 0)} exercises
          </span>
          <Button onClick={save} loading={saving} size="lg">
            <Save className="h-5 w-5" />
            Save split
          </Button>
        </div>
      </div>

      <ExercisePicker
        open={pickerFor !== null}
        onClose={() => setPickerFor(null)}
        existingIds={new Set(pickerFor !== null ? days[pickerFor].exercises.map((e) => e.id) : [])}
        onAdd={(ex) => addExercise(pickerFor, ex)}
        title={pickerFor !== null ? `Add to “${days[pickerFor].name || `Day ${pickerFor + 1}`}”` : 'Add exercises'}
        subtitle="Filter by muscle group and tap to add. Tap Done when finished."
      />
    </div>
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

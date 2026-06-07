import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Trash2, Save, Trophy, ArrowLeft, ListPlus, Dumbbell, Moon } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import * as api from '../services/api.js'
import { colorForLabel } from '../lib/constants.js'
import { Button, EmptyState, PageLoader } from '../components/ui.jsx'
import { WorkoutBadge } from '../components/workoutVisuals.jsx'
import ExercisePicker from '../components/ExercisePicker.jsx'
import ExerciseInfo from '../components/ExerciseInfo.jsx'
import Modal from '../components/Modal.jsx'
import { toast } from '../components/toast.jsx'

const blankSet = () => ({ reps: '', weight: '' })

export default function WorkoutLogger() {
  const { routineId, workoutId } = useParams()
  const isEdit = !!workoutId
  const { user } = useAuth()
  const navigate = useNavigate()

  const [status, setStatus] = useState('loading') // loading | ready | no-routine | rest | not-found
  const [label, setLabel] = useState('')
  const [session, setSession] = useState([]) // [{ exercise, sets:[{reps,weight}] }]
  const [prMap, setPrMap] = useState({})
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [addOpen, setAddOpen] = useState(false)

  useEffect(() => {
    let active = true
    const prsP = api.getUserPRs(user.id)

    if (isEdit) {
      Promise.all([api.getWorkout(workoutId), prsP]).then(([w, prs]) => {
        if (!active) return
        if (!w) return setStatus('not-found')
        setLabel(w.workout_type)
        setDate(w.workout_date)
        setPrMap(Object.fromEntries(prs.map((p) => [p.exercise_id, p.best_weight])))
        if (w.is_rest_day) return setStatus('rest')
        setSession(
          w.exercises.map((ex) => ({ exercise: ex.exercise, sets: ex.sets.length ? ex.sets.map((s) => ({ ...s })) : [blankSet()] })),
        )
        setStatus('ready')
      })
      return () => {
        active = false
      }
    }

    // new workout from a chosen day
    Promise.all([api.getRoutineById(user.id, routineId), prsP]).then(([routine, prs]) => {
      if (!active) return
      if (!routine || routine.exercises.length === 0) return setStatus('no-routine')
      setLabel(routine.name)
      setSession(routine.exercises.map((ex) => ({ exercise: ex, sets: [blankSet(), blankSet(), blankSet()] })))
      setPrMap(Object.fromEntries(prs.map((p) => [p.exercise_id, p.best_weight])))
      setStatus('ready')
    })
    return () => {
      active = false
    }
  }, [user.id, routineId, workoutId, isEdit])

  const updateSet = (ei, si, field, value) =>
    setSession((s) => {
      const copy = s.map((row) => ({ ...row, sets: row.sets.map((x) => ({ ...x })) }))
      copy[ei].sets[si][field] = value
      return copy
    })
  const addSet = (ei) =>
    setSession((s) => s.map((row, i) => (i === ei ? { ...row, sets: [...row.sets, blankSet()] } : row)))
  const removeSet = (ei, si) =>
    setSession((s) => s.map((row, i) => (i === ei ? { ...row, sets: row.sets.filter((_, j) => j !== si) } : row)))
  const removeExercise = (ei) => setSession((s) => s.filter((_, i) => i !== ei))
  const addExercise = (ex) =>
    setSession((s) =>
      s.some((r) => r.exercise.id === ex.id) ? s : [...s, { exercise: ex, sets: [blankSet(), blankSet(), blankSet()] }],
    )

  const sessionIds = useMemo(() => new Set(session.map((r) => r.exercise.id)), [session])
  const totalSets = useMemo(
    () => session.reduce((n, row) => n + row.sets.filter((x) => x.reps || x.weight).length, 0),
    [session],
  )

  const save = async () => {
    if (totalSets === 0) {
      toast.error('Log at least one set before saving.')
      return
    }
    setSaving(true)
    const payload = session.map((row) => ({ exercise_id: row.exercise.id, sets: row.sets }))
    if (isEdit) {
      await api.updateWorkout(user.id, workoutId, payload, date)
      setSaving(false)
      toast.success('Workout updated.')
      navigate('/progress')
      return
    }
    const { newPRs } = await api.saveWorkout(user.id, label, payload, date)
    setSaving(false)
    if (newPRs.length > 0) {
      const unit = user.unit_preference
      const top = newPRs[0]
      toast.pr(
        newPRs.length === 1 ? `${top.exercise.name}: ${top.newWeight}${unit}` : `${newPRs.length} new personal records!`,
        { title: 'NEW PR!' },
      )
    } else {
      toast.success(`${label} workout saved. Nice work.`)
    }
    navigate('/progress')
  }

  const doDelete = async () => {
    await api.deleteWorkout(user.id, workoutId)
    toast.success('Workout deleted.')
    navigate('/progress')
  }

  if (status === 'loading') return <PageLoader />

  const backTo = isEdit ? '/progress' : '/'
  const backLabel = isEdit ? 'Back to Progress' : 'Back to Log'
  const hex = colorForLabel(label)

  if (status === 'not-found') {
    return (
      <div className="space-y-6">
        <BackBar onBack={() => navigate(backTo)} label={backLabel} />
        <EmptyState title="Workout not found">That workout no longer exists.</EmptyState>
      </div>
    )
  }

  if (status === 'no-routine') {
    return (
      <div className="space-y-6">
        <BackBar onBack={() => navigate('/')} label="Back to Log" />
        <EmptyState
          icon={ListPlus}
          title="This day isn't set up yet"
          action={
            <Button onClick={() => navigate('/routines')}>
              <Dumbbell className="h-5 w-5" />
              Open Routine Builder
            </Button>
          }
        >
          Add some exercises to this day in the Routine Builder and they'll load here automatically.
        </EmptyState>
      </div>
    )
  }

  if (status === 'rest') {
    return (
      <div className="space-y-6">
        <BackBar onBack={() => navigate(backTo)} label="Back to Progress" />
        <EmptyState
          icon={Moon}
          title="Rest day"
          action={
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4" />
              Delete rest day
            </Button>
          }
        >
          Logged as recovery on {new Date(date + 'T00:00:00').toLocaleDateString()}. Nothing to edit — you can remove
          it from your calendar here.
        </EmptyState>
        <DeleteConfirm open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={doDelete} rest />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-4">
      <BackBar onBack={() => navigate(backTo)} label={backLabel} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <span className="h-8 w-1.5 rounded-full" style={{ backgroundColor: hex }} />
            <h1 className="font-display text-4xl font-bold text-chalk">
              {label}
              {isEdit && <span className="ml-2 align-middle text-base font-sans font-medium text-lime-400">· editing</span>}
            </h1>
          </div>
          <p className="text-mist">Log your sets, reps, and weight ({user.unit_preference}).</p>
        </div>
        <div>
          <label className="label" htmlFor="wdate">Workout date</label>
          <input
            id="wdate"
            type="date"
            value={date}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)}
            className="input-field w-auto cursor-pointer"
          />
        </div>
      </div>

      <div className="space-y-4">
        {session.map((row, ei) => {
          const pr = prMap[row.exercise.id]
          const beatsPr = pr != null && row.sets.some((s) => Number(s.weight) > pr)
          return (
            <div key={row.exercise.id} className="card p-4 sm:p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="flex items-center gap-2 font-display text-2xl font-bold text-chalk">
                    {row.exercise.name}
                    {row.exercise.leaderboard_enabled && <Trophy className="h-4 w-4 text-lime-400" />}
                    <ExerciseInfo exercise={row.exercise} />
                  </h3>
                  <p className="mt-0.5 text-xs text-ash">
                    {pr != null ? (
                      <span className={beatsPr ? 'font-semibold text-lime-400' : ''}>
                        Current PR: {pr}
                        {user.unit_preference}
                        {beatsPr ? ' · on track to beat it!' : ''}
                      </span>
                    ) : (
                      'No PR yet — set the first one'
                    )}
                  </p>
                </div>
                <button
                  onClick={() => removeExercise(ei)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-ash transition hover:bg-pull/15 hover:text-pull cursor-pointer"
                  aria-label={`Remove ${row.exercise.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-[2.5rem_1fr_1fr_2.5rem] items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-ash">
                  <span>Set</span>
                  <span>Reps</span>
                  <span>Weight ({user.unit_preference})</span>
                  <span className="sr-only">Remove</span>
                </div>
                {row.sets.map((s, si) => {
                  const isPr = pr != null && Number(s.weight) > pr && Number(s.weight) > 0
                  return (
                    <div key={si} className="grid grid-cols-[2.5rem_1fr_1fr_2.5rem] items-center gap-2">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink-800 font-display text-lg font-bold text-mist">
                        {si + 1}
                      </span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        placeholder="0"
                        value={s.reps}
                        onChange={(e) => updateSet(ei, si, 'reps', e.target.value)}
                        className="input-field py-2.5 text-center"
                        aria-label={`Set ${si + 1} reps`}
                      />
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="2.5"
                        placeholder="0"
                        value={s.weight}
                        onChange={(e) => updateSet(ei, si, 'weight', e.target.value)}
                        className={`input-field py-2.5 text-center ${isPr ? 'border-lime-400/70 ring-2 ring-lime-400/20' : ''}`}
                        aria-label={`Set ${si + 1} weight`}
                      />
                      <button
                        onClick={() => removeSet(ei, si)}
                        disabled={row.sets.length === 1}
                        className="grid h-10 w-10 place-items-center rounded-xl text-ash transition hover:bg-white/5 hover:text-pull disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        aria-label={`Remove set ${si + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )
                })}
              </div>

              <button
                onClick={() => addSet(ei)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-lime-400 transition hover:bg-lime-400/10 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Add set
              </button>
            </div>
          )
        })}

        <button
          onClick={() => setAddOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-3xl border border-dashed border-white/15 py-4 text-sm font-semibold text-mist transition-colors duration-200 hover:border-lime-400/50 hover:text-lime-300 cursor-pointer"
        >
          <Plus className="h-5 w-5" />
          Add exercise
        </button>
      </div>

      <div className="sticky bottom-20 z-30 md:bottom-4">
        <div className="card flex items-center justify-between gap-3 border-lime-400/20 px-4 py-3">
          <div className="flex items-center gap-3">
            <WorkoutBadge type={label} />
            <span className="hidden text-sm text-mist sm:inline">
              {totalSets} set{totalSets === 1 ? '' : 's'} logged
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isEdit && (
              <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            )}
            <Button onClick={save} loading={saving} size="lg">
              <Save className="h-5 w-5" />
              {isEdit ? 'Save changes' : 'Save workout'}
            </Button>
          </div>
        </div>
      </div>

      <ExercisePicker
        open={addOpen}
        onClose={() => setAddOpen(false)}
        existingIds={sessionIds}
        onAdd={addExercise}
        title="Add exercise"
        subtitle="Adds to this session only — your saved routine stays the same."
      />
      <DeleteConfirm open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={doDelete} />
    </div>
  )
}

function BackBar({ onBack, label }) {
  return (
    <button
      onClick={onBack}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-mist transition hover:text-chalk cursor-pointer"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  )
}

function DeleteConfirm({ open, onClose, onConfirm, rest }) {
  const [busy, setBusy] = useState(false)
  const go = async () => {
    setBusy(true)
    await onConfirm()
  }
  return (
    <Modal open={open} onClose={onClose} title={rest ? 'Delete rest day?' : 'Delete workout?'} maxWidth="max-w-sm">
      <p className="text-sm text-mist">
        This permanently removes it from your calendar and history. Your PRs will recalculate from your remaining
        workouts.
      </p>
      <div className="mt-5 flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button variant="danger" className="flex-1" onClick={go} loading={busy}>
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>
    </Modal>
  )
}

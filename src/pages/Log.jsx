import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dumbbell,
  Moon,
  Apple,
  ChevronRight,
  ListChecks,
  Salad,
  Clock,
  ArrowRight,
  Flame,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import * as api from '../services/api.js'
import { formatCalories } from '../lib/foodScore.js'
import { ROUTINE_TYPES } from '../lib/constants.js'
import { Button, Card, EmptyState, Skeleton } from '../components/ui.jsx'
import { WorkoutBadge } from '../components/workoutVisuals.jsx'
import { WORKOUT_COLORS } from '../lib/constants.js'
import Modal from '../components/Modal.jsx'
import { toast } from '../components/toast.jsx'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

const prettyDate = (str) =>
  new Date(str + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

const sentimentColor = (s) =>
  s === 'good' ? '#22C55E' : s === 'bad' ? '#F0454B' : '#6B757C'

export default function Log() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [recent, setRecent] = useState(null)
  const [routineTypes, setRoutineTypes] = useState([])
  const [showWorkout, setShowWorkout] = useState(false)
  const [showFood, setShowFood] = useState(false)

  const load = useCallback(() => {
    api.getRecentLogs(user.id, 12).then(setRecent)
    api.getAllUserRoutines(user.id).then((rs) => setRoutineTypes(rs.map((r) => r.routine_type)))
  }, [user.id])

  useEffect(() => {
    load()
  }, [load])

  const logRest = async () => {
    await api.logRestDay(user.id)
    toast.success('Rest day logged. Recovery is part of the plan.')
    load()
  }

  return (
    <div className="space-y-7">
      {/* Greeting */}
      <div className="animate-fade-up">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-lime-400">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h1 className="mt-1 font-display text-4xl font-bold text-chalk sm:text-5xl">
          {greeting()}, <span className="text-lime-400">@{user.username}</span>
        </h1>
        <p className="mt-2 text-mist">What are we logging today?</p>
      </div>

      {/* Primary actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <ActionCard
          icon={Dumbbell}
          title="Start Workout"
          desc="Load a routine and log your sets"
          accent="#C7F716"
          onClick={() => setShowWorkout(true)}
          primary
        />
        <ActionCard
          icon={Moon}
          title="Log Rest Day"
          desc="Mark today as recovery"
          accent="#4B5563"
          onClick={logRest}
        />
        <ActionCard
          icon={Apple}
          title="Log Food"
          desc="Get a quick health score"
          accent="#22C55E"
          onClick={() => setShowFood(true)}
        />
      </div>

      {/* Build routine nudge */}
      <button
        onClick={() => navigate('/routines')}
        className="group flex w-full items-center justify-between gap-4 rounded-3xl border border-white/[0.07] bg-ink-800/60 px-5 py-4 text-left transition-colors duration-200 hover:border-lime-400/40 cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-lime-400/15 text-lime-400">
            <ListChecks className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold text-chalk">
              {routineTypes.length ? 'Manage your routines' : 'Build your first routine'}
            </p>
            <p className="text-sm text-mist">
              {routineTypes.length
                ? `${routineTypes.length} routine${routineTypes.length > 1 ? 's' : ''} ready — Push, Pull, Legs & more`
                : 'Pick exercises for Push, Pull, Legs, Upper & Lower'}
            </p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-ash transition-transform duration-200 group-hover:translate-x-1 group-hover:text-lime-400" />
      </button>

      {/* Recent logs */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-mist" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-mist">Recent activity</h2>
        </div>

        {recent === null ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <EmptyState icon={Dumbbell} title="No activity yet" >
            Start a workout or log some food and it'll show up here.
          </EmptyState>
        ) : (
          <ul className="space-y-2">
            {recent.map((item) => (
              <li key={item.kind + item.id}>
                {item.kind === 'workout' ? (
                  <WorkoutRow item={item} onClick={() => navigate(`/workout/edit/${item.id}`)} />
                ) : (
                  <FoodRow item={item} />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modals */}
      <StartWorkoutModal
        open={showWorkout}
        onClose={() => setShowWorkout(false)}
        routineTypes={routineTypes}
        onPick={(type) => navigate(`/workout/${type}`)}
      />
      <LogFoodModal
        open={showFood}
        onClose={() => setShowFood(false)}
        userId={user.id}
        onLogged={load}
      />
    </div>
  )
}

function ActionCard({ icon: Icon, title, desc, accent, onClick, primary }) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col items-start overflow-hidden rounded-3xl border p-5 text-left transition-all duration-200 cursor-pointer ${
        primary
          ? 'border-lime-400/30 bg-gradient-to-br from-lime-400/[0.12] to-transparent hover:border-lime-400/60'
          : 'border-white/[0.07] bg-ink-700/70 hover:border-white/20 hover:bg-ink-600/70'
      }`}
    >
      <span
        className="mb-4 grid h-12 w-12 place-items-center rounded-2xl transition-transform duration-200 group-hover:scale-105"
        style={{ backgroundColor: accent + '22', color: accent }}
      >
        <Icon className="h-6 w-6" />
      </span>
      <p className="font-display text-2xl font-bold text-chalk">{title}</p>
      <p className="mt-0.5 text-sm text-mist">{desc}</p>
      <ArrowRight className="absolute right-5 top-5 h-5 w-5 text-ash transition-all duration-200 group-hover:right-4 group-hover:text-chalk" />
    </button>
  )
}

function WorkoutRow({ item, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-ink-700/60 px-4 py-3 text-left transition-colors duration-200 hover:border-white/15 hover:bg-ink-600/60 cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <WorkoutBadge type={item.workout_type} />
        <span className="text-sm text-mist">
          {item.is_rest_day ? 'Recovery day' : `${item.exerciseCount} exercise${item.exerciseCount === 1 ? '' : 's'}`}
        </span>
      </div>
      <span className="flex items-center gap-1.5 text-sm text-ash">
        {prettyDate(item.date)}
        <ChevronRight className="h-4 w-4 opacity-0 transition group-hover:opacity-100" />
      </span>
    </button>
  )
}

function FoodRow({ item }) {
  const score = item.health_score
  const color = score >= 7 ? '#22C55E' : score >= 4 ? '#FB923C' : '#F0454B'
  const cals = formatCalories({
    low: item.calories_low,
    high: item.calories_high,
    partial: item.calories_partial,
  })
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-ink-700/60 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl font-display text-sm font-bold"
          style={{ backgroundColor: color + '22', color }}
        >
          {score}
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-medium text-chalk">
            <span className="flex items-center gap-1.5">
              <Salad className="h-3.5 w-3.5 text-ash" /> Food log
            </span>
            {cals && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-lime-400">
                <Flame className="h-3 w-3" />
                {cals}
              </span>
            )}
          </p>
          <p className="truncate text-sm text-mist">{item.raw_text}</p>
        </div>
      </div>
      <span className="shrink-0 text-sm text-ash">{prettyDate(item.date)}</span>
    </div>
  )
}

function StartWorkoutModal({ open, onClose, routineTypes, onPick }) {
  return (
    <Modal open={open} onClose={onClose} title="Start a workout">
      <p className="mb-4 text-sm text-mist">Choose the type — your saved routine loads automatically.</p>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {ROUTINE_TYPES.map((type) => {
          const c = WORKOUT_COLORS[type]
          const hasRoutine = routineTypes.includes(type)
          return (
            <button
              key={type}
              onClick={() => onPick(type)}
              className="group flex items-center justify-between rounded-2xl border border-white/[0.08] bg-ink-800 p-4 text-left transition-colors duration-200 hover:border-white/25 cursor-pointer"
            >
              <span className="flex items-center gap-3">
                <span className="h-9 w-1.5 rounded-full" style={{ backgroundColor: c.hex }} />
                <span>
                  <span className="block font-display text-xl font-bold text-chalk">{type}</span>
                  <span className="text-xs text-ash">
                    {hasRoutine ? 'Routine ready' : 'No routine yet — build one'}
                  </span>
                </span>
              </span>
              <ChevronRight className="h-5 w-5 text-ash transition-transform duration-200 group-hover:translate-x-1" style={{ color: c.hex }} />
            </button>
          )
        })}
      </div>
    </Modal>
  )
}

function LogFoodModal({ open, onClose, userId, onLogged }) {
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const reset = () => {
    setText('')
    setResult(null)
    setLoading(false)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    setLoading(true)
    const entry = await api.logFood(userId, text.trim())
    setResult(entry)
    setLoading(false)
    onLogged()
  }

  const close = () => {
    reset()
    onClose()
  }

  const scoreColor = (s) => (s >= 7 ? '#22C55E' : s >= 4 ? '#FB923C' : '#F0454B')

  return (
    <Modal open={open} onClose={close} title="Log food">
      {!result ? (
        <form onSubmit={submit} className="space-y-4">
          <p className="text-sm text-mist">
            Type what you ate — just words, no calories. We'll score the day out of 10.
          </p>
          <textarea
            autoFocus
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. eggs, grilled chicken, rice, banana"
            className="input-field resize-none"
          />
          <Button type="submit" size="lg" className="w-full" loading={loading} disabled={!text.trim()}>
            Get health score
          </Button>
        </form>
      ) : (
        <div className="space-y-5">
          {/* Score + calorie estimate */}
          <div className="flex items-center gap-4">
            <div
              className="grid h-24 w-24 shrink-0 place-items-center rounded-full border-4"
              style={{ borderColor: scoreColor(result.health_score), color: scoreColor(result.health_score) }}
            >
              <div className="text-center">
                <span className="font-display text-4xl font-extrabold leading-none">{result.health_score}</span>
                <span className="block text-xs text-ash">/ 10</span>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-lime-400">
                <Flame className="h-3.5 w-3.5" /> Est. calories
              </p>
              <p className="font-display text-3xl font-extrabold text-chalk">
                {formatCalories({
                  low: result.calories_low,
                  high: result.calories_high,
                  partial: result.calories_partial,
                }) || '—'}
              </p>
              <p className="mt-1 text-sm text-mist">{result.explanation}</p>
            </div>
          </div>

          {/* Per-item reasoning */}
          {result.items?.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-ash">
                Why this score
              </p>
              {result.items.map((it, i) => (
                <div key={i} className="flex items-start gap-3 rounded-2xl bg-ink-800/60 px-3 py-2.5">
                  <span
                    className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: sentimentColor(it.sentiment) }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-chalk">{it.label}</span>
                      {it.known && it.calHigh > 0 && (
                        <span className="shrink-0 text-xs font-semibold text-mist">
                          {it.calLow === it.calHigh ? `≈ ${it.calLow}` : `≈ ${it.calLow}–${it.calHigh}`} kcal
                        </span>
                      )}
                    </p>
                    <p className="text-xs leading-relaxed text-mist">{it.reason}</p>
                  </div>
                </div>
              ))}
              {result.calories_partial && (
                <p className="px-1 pt-1 text-xs text-ash">
                  Calorie estimate covers recognised items only.
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={reset}>
              Log more
            </Button>
            <Button className="flex-1" onClick={close}>
              Done
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy, ChevronRight, TrendingUp, CalendarDays, LineChart, Dumbbell } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import * as api from '../services/api.js'
import { Button, EmptyState, SectionTitle, Skeleton } from '../components/ui.jsx'
import WorkoutCalendar from '../components/WorkoutCalendar.jsx'
import ExerciseProgressChart from '../components/ExerciseProgressChart.jsx'

export default function Progress() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [prs, setPrs] = useState(null)
  const [selectedEx, setSelectedEx] = useState('')

  useEffect(() => {
    api.getUserPRs(user.id).then((rows) => {
      setPrs(rows)
      if (rows.length) setSelectedEx(rows[0].exercise_id)
    })
  }, [user.id])

  const unit = user.unit_preference

  return (
    <div className="space-y-10">
      <SectionTitle eyebrow="Progress" title="Your numbers, climbing" />

      {/* ── 1. Personal PR Summary ─────────────────────────── */}
      <section>
        <SubHeading icon={Trophy} title="Personal Records" />
        {prs === null ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-3xl" />
            ))}
          </div>
        ) : prs.length === 0 ? (
          <EmptyState
            icon={Dumbbell}
            title="No PRs yet"
            action={<Button onClick={() => navigate('/')}>Log your first workout</Button>}
          >
            Log a workout with some weight and your personal records will appear here automatically.
          </EmptyState>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {prs.map((pr) => (
              <button
                key={pr.id}
                onClick={() => navigate(`/progress/exercise/${pr.exercise_id}`)}
                className="group relative flex flex-col items-start overflow-hidden rounded-3xl border border-white/[0.07] bg-ink-700/70 p-4 text-left transition-all duration-200 hover:border-lime-400/40 cursor-pointer"
              >
                {pr.exercise.leaderboard_enabled && (
                  <Trophy className="absolute right-3 top-3 h-4 w-4 text-lime-400/70" />
                )}
                <p className="line-clamp-2 min-h-[2.5rem] text-sm font-medium text-mist">
                  {pr.exercise.name}
                </p>
                <p className="mt-1 font-display text-3xl font-extrabold text-chalk">
                  {pr.best_weight}
                  <span className="ml-1 text-base font-bold text-lime-400">{pr.unit}</span>
                </p>
                <ChevronRight className="absolute bottom-3 right-3 h-4 w-4 text-ash opacity-0 transition group-hover:opacity-100" />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ── 2. Workout Calendar ────────────────────────────── */}
      <section>
        <SubHeading icon={CalendarDays} title="Workout Calendar" />
        <WorkoutCalendar
          userId={user.id}
          onSelectWorkout={(entry) => navigate(`/workout/edit/${entry.id}`)}
        />
        <p className="mt-2 px-1 text-xs text-ash">Tap any logged day to edit or delete it.</p>
      </section>

      {/* ── 3. Exercise Progress Charts ────────────────────── */}
      <section>
        <SubHeading icon={LineChart} title="Exercise Progress" />
        {prs === null ? (
          <Skeleton className="h-72 w-full rounded-3xl" />
        ) : prs.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 p-8 text-center text-sm text-ash">
            Log workouts to chart your monthly weight progression.
          </div>
        ) : (
          <div className="card p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <select
                value={selectedEx}
                onChange={(e) => setSelectedEx(e.target.value)}
                className="input-field w-auto max-w-full cursor-pointer font-semibold"
                aria-label="Choose exercise"
              >
                {prs.map((pr) => (
                  <option key={pr.exercise_id} value={pr.exercise_id}>
                    {pr.exercise.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => navigate(`/progress/exercise/${selectedEx}`)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-lime-400 transition hover:text-lime-300 cursor-pointer"
              >
                Full history
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <ExerciseProgressChart userId={user.id} exerciseId={selectedEx} unit={unit} />
            <p className="mt-3 text-center text-xs text-ash">
              Monthly best weight — the highest you lifted each month.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}

function SubHeading({ icon: Icon, title }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-lime-400/15 text-lime-400">
        <Icon className="h-5 w-5" />
      </span>
      <h2 className="font-display text-2xl font-bold text-chalk">{title}</h2>
    </div>
  )
}

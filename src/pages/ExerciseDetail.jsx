import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trophy, Calendar } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import * as api from '../services/api.js'
import { EXERCISE_BY_ID } from '../lib/exerciseLibrary.js'
import { MUSCLE_GROUP_LABELS } from '../lib/constants.js'
import { Card, PageLoader, EmptyState } from '../components/ui.jsx'
import ExerciseProgressChart from '../components/ExerciseProgressChart.jsx'

const prettyDate = (str) =>
  new Date(str + 'T00:00:00').toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

export default function ExerciseDetail() {
  const { exerciseId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const exercise = EXERCISE_BY_ID[exerciseId]

  const [pr, setPr] = useState(null)
  const [history, setHistory] = useState(null)

  useEffect(() => {
    api.getUserPRs(user.id).then((rows) => setPr(rows.find((p) => p.exercise_id === exerciseId) || false))
    api.getExerciseHistory(user.id, exerciseId).then((rows) => setHistory([...rows].reverse()))
  }, [user.id, exerciseId])

  if (!exercise) {
    return (
      <div className="space-y-6">
        <BackBar onBack={() => navigate('/progress')} />
        <EmptyState title="Exercise not found">That exercise doesn't exist.</EmptyState>
      </div>
    )
  }

  if (pr === null || history === null) return <PageLoader />

  const unit = user.unit_preference

  return (
    <div className="space-y-6">
      <BackBar onBack={() => navigate('/progress')} />

      {/* Header + current PR */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-ink-700 px-2.5 py-1 text-xs font-semibold capitalize text-mist">
              {MUSCLE_GROUP_LABELS[exercise.muscle_group]}
            </span>
            {exercise.leaderboard_enabled && (
              <span className="inline-flex items-center gap-1 rounded-full bg-lime-400/15 px-2.5 py-1 text-xs font-semibold text-lime-300">
                <Trophy className="h-3 w-3" /> Leaderboard
              </span>
            )}
          </div>
          <h1 className="font-display text-4xl font-bold text-chalk sm:text-5xl">{exercise.name}</h1>
        </div>
        <div className="rounded-3xl border border-lime-400/20 bg-gradient-to-br from-lime-400/[0.12] to-transparent px-6 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-lime-400">Current PR</p>
          <p className="font-display text-4xl font-extrabold text-chalk">
            {pr ? pr.best_weight : '—'}
            {pr && <span className="ml-1 text-xl text-lime-400">{unit}</span>}
          </p>
        </div>
      </div>

      {/* Monthly chart */}
      <Card>
        <h2 className="mb-1 font-display text-xl font-bold text-chalk">Monthly weight progression</h2>
        <p className="mb-4 text-sm text-ash">Your best weight each month.</p>
        <ExerciseProgressChart userId={user.id} exerciseId={exerciseId} unit={unit} defaultRange="6m" />
      </Card>

      {/* History */}
      <Card>
        <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold text-chalk">
          <Calendar className="h-5 w-5 text-mist" />
          History
        </h2>
        {history.length === 0 ? (
          <p className="py-6 text-center text-sm text-ash">No sessions logged for this exercise yet.</p>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {history.map((h, i) => {
              const isPr = pr && h.weight === pr.best_weight && i === history.findIndex((x) => x.weight === pr.best_weight)
              return (
                <li key={h.date + i} className="flex items-center justify-between py-3">
                  <span className="text-sm text-mist">{prettyDate(h.date)}</span>
                  <span className="flex items-center gap-2">
                    {isPr && <Trophy className="h-3.5 w-3.5 text-lime-400" />}
                    <span className="font-display text-lg font-bold text-chalk">
                      {h.weight}
                      <span className="ml-0.5 text-sm text-mist">{unit}</span>
                    </span>
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}

function BackBar({ onBack }) {
  return (
    <button
      onClick={onBack}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-mist transition hover:text-chalk cursor-pointer"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to Progress
    </button>
  )
}

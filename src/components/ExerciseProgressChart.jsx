import { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  ComposedChart,
} from 'recharts'
import * as api from '../services/api.js'
import { Skeleton } from './ui.jsx'

const RANGES = [
  { key: '3m', label: '3M' },
  { key: '6m', label: '6M' },
  { key: '12m', label: '12M' },
  { key: 'all', label: 'All' },
]

function ChartTooltip({ active, payload, unit }) {
  if (!active || !payload || !payload.length) return null
  const p = payload[0].payload
  return (
    <div className="rounded-xl border border-white/10 bg-ink-800 px-3 py-2 shadow-card">
      <p className="text-xs text-ash">{p.label}</p>
      <p className="font-display text-lg font-bold text-lime-400">
        {p.weight}
        <span className="ml-0.5 text-sm text-mist">{unit}</span>
      </p>
    </div>
  )
}

export default function ExerciseProgressChart({ userId, exerciseId, unit = 'kg', defaultRange = '6m' }) {
  const [range, setRange] = useState(defaultRange)
  const [series, setSeries] = useState(null)

  useEffect(() => {
    setSeries(null)
    if (!exerciseId) return
    api.getMonthlyExerciseProgress(userId, exerciseId, range).then(setSeries)
  }, [userId, exerciseId, range])

  return (
    <div>
      <div className="mb-3 flex items-center justify-end gap-1 rounded-xl bg-ink-800/60 p-1">
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors duration-200 cursor-pointer ${
              range === r.key ? 'bg-lime-400 text-ink-900' : 'text-mist hover:text-chalk'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {series === null ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : series.length === 0 ? (
        <div className="grid h-64 place-items-center rounded-2xl border border-dashed border-white/10 text-sm text-ash">
          No data logged for this range yet.
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={series} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="prFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C7F716" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#C7F716" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#6B757C', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#6B757C', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={44}
                domain={['dataMin - 5', 'dataMax + 5']}
              />
              <Tooltip content={<ChartTooltip unit={unit} />} cursor={{ stroke: 'rgba(199,247,22,0.3)' }} />
              <Area
                type="monotone"
                dataKey="weight"
                stroke="none"
                fill="url(#prFill)"
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#C7F716"
                strokeWidth={3}
                dot={{ r: 4, fill: '#C7F716', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#C7F716', stroke: '#08090B', strokeWidth: 3 }}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import * as api from '../services/api.js'
import { WORKOUT_COLORS, WORKOUT_TYPES } from '../lib/constants.js'
import { WorkoutLegend } from './workoutVisuals.jsx'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const todayStr = () => new Date().toISOString().slice(0, 10)

export default function WorkoutCalendar({ userId, onSelectWorkout }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth()) // 0-11
  const [data, setData] = useState({ byDate: {}, summary: {} })

  useEffect(() => {
    api.getMonthWorkouts(userId, year, month).then(setData)
  }, [userId, year, month])

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11)
      setYear((y) => y - 1)
    } else setMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) {
      setMonth(0)
      setYear((y) => y + 1)
    } else setMonth((m) => m + 1)
  }
  const goToday = () => {
    setYear(now.getFullYear())
    setMonth(now.getMonth())
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  // build the grid
  const cells = useMemo(() => {
    const firstDow = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const arr = []
    for (let i = 0; i < firstDow; i++) arr.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      arr.push({ day: d, dateStr, entry: data.byDate[dateStr] })
    }
    return arr
  }, [year, month, data])

  const trainingDays = WORKOUT_TYPES.filter((t) => t !== 'Rest').reduce(
    (n, t) => n + (data.summary[t] || 0),
    0,
  )

  return (
    <div className="card p-5 sm:p-6">
      {/* Header / nav */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-2xl font-bold text-chalk">
          {MONTHS[month]} <span className="text-mist">{year}</span>
        </h3>
        <div className="flex items-center gap-1">
          {!isCurrentMonth && (
            <button
              onClick={goToday}
              className="mr-1 inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-lime-400 transition hover:bg-lime-400/10 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Today
            </button>
          )}
          <NavBtn onClick={prevMonth} label="Previous month">
            <ChevronLeft className="h-5 w-5" />
          </NavBtn>
          <NavBtn onClick={nextMonth} label="Next month">
            <ChevronRight className="h-5 w-5" />
          </NavBtn>
        </div>
      </div>

      {/* Monthly summary */}
      <div className="mb-4 flex flex-wrap gap-2">
        {WORKOUT_TYPES.map((t) => {
          const count = data.summary[t] || 0
          const c = WORKOUT_COLORS[t]
          return (
            <span
              key={t}
              className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold"
              style={{
                backgroundColor: count ? c.hex + '1f' : 'rgba(255,255,255,0.03)',
                color: count ? c.hex : '#6B757C',
              }}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: count ? c.hex : '#3a444d' }} />
              {c.label}: {count}
            </span>
          )
        })}
        <span className="inline-flex items-center gap-1.5 rounded-xl bg-lime-400/15 px-2.5 py-1.5 text-xs font-bold text-lime-300">
          Training days: {trainingDays}
        </span>
      </div>

      {/* Legend */}
      <WorkoutLegend className="mb-4 rounded-2xl bg-ink-800/60 px-3 py-2.5" />

      {/* Weekday header */}
      <div className="mb-1.5 grid grid-cols-7 gap-1.5">
        {DOW.map((d) => (
          <div key={d} className="text-center text-[11px] font-semibold uppercase tracking-wider text-ash">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((cell, i) => {
          if (!cell) return <div key={`b${i}`} />
          const isToday = cell.dateStr === todayStr()
          const entry = cell.entry
          const c = entry ? WORKOUT_COLORS[entry.type] : null
          const clickable = entry && onSelectWorkout
          const Tag = clickable ? 'button' : 'div'
          return (
            <Tag
              key={cell.dateStr}
              type={clickable ? 'button' : undefined}
              onClick={clickable ? () => onSelectWorkout(entry) : undefined}
              title={entry ? `${cell.dateStr} · ${entry.type}${clickable ? ' · edit' : ''}` : cell.dateStr}
              className={`relative grid aspect-square w-full place-items-center rounded-xl text-sm font-semibold transition-transform duration-150 ${
                clickable ? 'cursor-pointer hover:scale-[1.08]' : 'hover:scale-[1.04]'
              }`}
              style={
                entry
                  ? {
                      backgroundColor: c.hex,
                      color: entry.type === 'Lower' ? '#1a1206' : '#fff',
                      boxShadow: isToday ? '0 0 0 2px #C7F716' : 'none',
                    }
                  : {
                      backgroundColor: 'rgba(255,255,255,0.025)',
                      color: '#6B757C',
                      boxShadow: isToday ? 'inset 0 0 0 2px #C7F716' : 'none',
                    }
              }
            >
              {cell.day}
            </Tag>
          )
        })}
      </div>
    </div>
  )
}

function NavBtn({ onClick, label, children }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="grid h-9 w-9 place-items-center rounded-xl text-mist transition hover:bg-white/5 hover:text-chalk cursor-pointer"
    >
      {children}
    </button>
  )
}

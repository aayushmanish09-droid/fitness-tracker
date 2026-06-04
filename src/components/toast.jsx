import { useEffect, useState } from 'react'
import { CheckCircle2, AlertCircle, Trophy, X } from 'lucide-react'

// Minimal global toast — no provider needed. Call toast(...) anywhere.
let pushFn = null
let counter = 0

export function toast(message, { type = 'success', title } = {}) {
  if (pushFn) pushFn({ id: ++counter, message, type, title })
}
toast.success = (m, o) => toast(m, { ...o, type: 'success' })
toast.error = (m, o) => toast(m, { ...o, type: 'error' })
toast.pr = (m, o) => toast(m, { ...o, type: 'pr' })

const ICONS = { success: CheckCircle2, error: AlertCircle, pr: Trophy }
const STYLES = {
  success: 'border-lime-400/40 text-lime-300',
  error: 'border-pull/50 text-pull',
  pr: 'border-lime-400/60 text-lime-300',
}

export function Toaster() {
  const [items, setItems] = useState([])

  useEffect(() => {
    pushFn = (item) => {
      setItems((prev) => [...prev, item])
      const ms = item.type === 'pr' ? 5000 : 3200
      setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== item.id)), ms)
    }
    return () => {
      pushFn = null
    }
  }, [])

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6">
      {items.map((item) => {
        const Icon = ICONS[item.type] || CheckCircle2
        return (
          <div
            key={item.id}
            role="status"
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border bg-ink-700/95 px-4 py-3 shadow-card backdrop-blur animate-fade-up ${STYLES[item.type]}`}
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              {item.title && <p className="font-display text-lg font-bold leading-tight text-chalk">{item.title}</p>}
              <p className="text-sm text-mist">{item.message}</p>
            </div>
            <button
              onClick={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}
              className="text-ash transition hover:text-chalk cursor-pointer"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

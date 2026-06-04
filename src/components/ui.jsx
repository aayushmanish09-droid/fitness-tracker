import { Loader2 } from 'lucide-react'

// ── Button ──────────────────────────────────────────────────────
const VARIANTS = {
  primary:
    'bg-lime-400 text-ink-900 hover:bg-lime-300 active:bg-lime-500 font-semibold shadow-glow',
  secondary:
    'bg-ink-600 text-chalk hover:bg-ink-500 border border-white/10',
  ghost: 'bg-transparent text-mist hover:text-chalk hover:bg-white/5',
  danger: 'bg-pull/15 text-pull hover:bg-pull/25 border border-pull/30',
  outline:
    'bg-transparent text-chalk border border-white/15 hover:border-lime-400/60 hover:text-lime-300',
}
const SIZES = {
  sm: 'h-9 px-3.5 text-sm gap-1.5',
  md: 'h-11 px-5 text-[15px] gap-2',
  lg: 'h-14 px-7 text-base gap-2.5',
  icon: 'h-10 w-10',
}

export function Button({
  variant = 'primary',
  size = 'md',
  pill = false,
  loading = false,
  disabled = false,
  className = '',
  children,
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-sans transition-all duration-200
        ${pill ? 'rounded-full' : 'rounded-2xl'} ${VARIANTS[variant]} ${SIZES[size]}
        disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer
        focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900
        ${className}`}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}

// ── Card ────────────────────────────────────────────────────────
export function Card({ className = '', children, ...props }) {
  return (
    <div className={`card p-5 sm:p-6 ${className}`} {...props}>
      {children}
    </div>
  )
}

// ── Inputs ──────────────────────────────────────────────────────
export function Field({ label, htmlFor, hint, error, children }) {
  return (
    <div>
      {label && (
        <label htmlFor={htmlFor} className="label">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1 text-sm text-pull">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-ash">{hint}</p>
      ) : null}
    </div>
  )
}

export function Input({ className = '', ...props }) {
  return <input className={`input-field ${className}`} {...props} />
}

export function Select({ className = '', children, ...props }) {
  return (
    <select className={`input-field cursor-pointer ${className}`} {...props}>
      {children}
    </select>
  )
}

// ── Badge ───────────────────────────────────────────────────────
export function Badge({ className = '', children, color }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}
      style={color ? { backgroundColor: color + '22', color } : undefined}
    >
      {children}
    </span>
  )
}

// ── Avatar (initials) ───────────────────────────────────────────
const AVATAR_COLORS = ['#3B82F6', '#F0454B', '#22C55E', '#A855F7', '#FB923C', '#14B8A6', '#EAB308']
export function Avatar({ name = '?', src, size = 40, you = false }) {
  const initials = name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || '?'
  const color = AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length]
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{ width: size, height: size }}
        className="rounded-full object-cover ring-2 ring-white/10"
      />
    )
  }
  return (
    <div
      style={{ width: size, height: size, backgroundColor: you ? '#C7F716' : color + '33', color: you ? '#08090B' : color, fontSize: size * 0.4 }}
      className="grid place-items-center rounded-full font-display font-bold ring-2 ring-white/10 select-none"
      aria-hidden="true"
    >
      {initials}
    </div>
  )
}

// ── Spinner / Skeleton / Empty ──────────────────────────────────
export function Spinner({ className = '' }) {
  return <Loader2 className={`h-5 w-5 animate-spin text-lime-400 ${className}`} aria-label="Loading" />
}

export function PageLoader() {
  return (
    <div className="grid min-h-[40vh] place-items-center">
      <Spinner className="h-8 w-8" />
    </div>
  )
}

export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-ink-800/40 px-6 py-12 text-center">
      {Icon && (
        <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-ink-600 text-lime-400">
          <Icon className="h-7 w-7" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-xl font-semibold text-chalk">{title}</h3>
      {children && <p className="mt-1.5 max-w-sm text-sm text-mist">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

// ── Section heading ─────────────────────────────────────────────
export function SectionTitle({ eyebrow, title, right }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-lime-400">
            {eyebrow}
          </p>
        )}
        <h2 className="text-2xl font-bold leading-none text-chalk sm:text-3xl">{title}</h2>
      </div>
      {right}
    </div>
  )
}

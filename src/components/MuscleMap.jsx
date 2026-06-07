// Simple anatomical muscle map. Front + back stylized figures with the
// worked muscles highlighted (primary = solid lime + pulse, secondary = faded).

const PRIMARY = '#C7F716'
const SECONDARY = 'rgba(199,247,22,0.30)'
const BASE = '#2b333b'
const BASE_LINE = '#3a444d'

// muscle geometry per view. shapes: ['ellipse', cx, cy, rx, ry] | ['rect', x, y, w, h, r]
const FRONT = {
  shoulders: [['ellipse', 28, 39, 9, 7], ['ellipse', 72, 39, 9, 7]],
  chest: [['ellipse', 42, 48, 9.5, 7], ['ellipse', 58, 48, 9.5, 7]],
  abs: [['rect', 42, 57, 16, 28, 4]],
  obliques: [['rect', 35.5, 59, 5, 24, 2], ['rect', 59.5, 59, 5, 24, 2]],
  biceps: [['ellipse', 21, 55, 5, 10], ['ellipse', 79, 55, 5, 10]],
  forearms: [['ellipse', 18.5, 83, 5, 11], ['ellipse', 81.5, 83, 5, 11]],
  traps: [['rect', 43, 31, 14, 6, 2]],
  quads: [['ellipse', 41, 132, 7.5, 28], ['ellipse', 59, 132, 7.5, 28]],
  calves: [['ellipse', 41, 181, 6, 16], ['ellipse', 59, 181, 6, 16]],
}
const BACK = {
  traps: [['ellipse', 50, 41, 13, 9]],
  shoulders: [['ellipse', 28, 40, 9, 7], ['ellipse', 72, 40, 9, 7]],
  lats: [['ellipse', 41, 64, 9, 15], ['ellipse', 59, 64, 9, 15]],
  lowerBack: [['rect', 43, 80, 14, 14, 3]],
  triceps: [['ellipse', 21, 55, 5, 11], ['ellipse', 79, 55, 5, 11]],
  forearms: [['ellipse', 18.5, 83, 5, 11], ['ellipse', 81.5, 83, 5, 11]],
  glutes: [['ellipse', 42, 106, 9, 10], ['ellipse', 58, 106, 9, 10]],
  hamstrings: [['ellipse', 41, 136, 7.5, 24], ['ellipse', 59, 136, 7.5, 24]],
  calves: [['ellipse', 41, 181, 6, 16], ['ellipse', 59, 181, 6, 16]],
}

function Shape({ def, fill, pulse }) {
  const [type, ...a] = def
  const common = { fill, className: pulse ? 'mm-pulse' : undefined }
  if (type === 'ellipse') return <ellipse cx={a[0]} cy={a[1]} rx={a[2]} ry={a[3]} {...common} />
  return <rect x={a[0]} y={a[1]} width={a[2]} height={a[3]} rx={a[4]} {...common} />
}

function BodyBase() {
  // shared gray silhouette
  return (
    <g fill={BASE} stroke={BASE_LINE} strokeWidth="0.5">
      <circle cx="50" cy="15" r="11" />
      <rect x="45" y="23" width="10" height="9" rx="3" />
      <rect x="31" y="30" width="38" height="60" rx="13" />
      <rect x="34" y="84" width="32" height="20" rx="9" />
      <rect x="14" y="33" width="12" height="64" rx="6" />
      <rect x="74" y="33" width="12" height="64" rx="6" />
      <rect x="34" y="100" width="14" height="100" rx="7" />
      <rect x="52" y="100" width="14" height="100" rx="7" />
    </g>
  )
}

function Figure({ shapes, stateFor, label }) {
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 100 208" className="h-56 w-auto" role="img" aria-label={`${label} muscle view`}>
        <BodyBase />
        {Object.entries(shapes).map(([key, defs]) => {
          const state = stateFor(key)
          if (!state) return null
          const fill = state === 'primary' ? PRIMARY : SECONDARY
          return (
            <g key={key}>
              {defs.map((def, i) => (
                <Shape key={i} def={def} fill={fill} pulse={state === 'primary'} />
              ))}
            </g>
          )
        })}
      </svg>
      <span className="mt-1 text-xs font-semibold uppercase tracking-wider text-ash">{label}</span>
    </div>
  )
}

export default function MuscleMap({ primary = [], secondary = [] }) {
  const prim = new Set(primary)
  const sec = new Set(secondary)
  const stateFor = (key) => (prim.has(key) ? 'primary' : sec.has(key) ? 'secondary' : null)

  return (
    <div className="flex items-end justify-center gap-6">
      <Figure shapes={FRONT} stateFor={stateFor} label="Front" />
      <Figure shapes={BACK} stateFor={stateFor} label="Back" />
    </div>
  )
}

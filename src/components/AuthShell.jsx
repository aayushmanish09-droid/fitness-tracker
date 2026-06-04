import { Dumbbell, TrendingUp, Trophy, Flame } from 'lucide-react'

const HIGHLIGHTS = [
  { icon: TrendingUp, text: 'Track every PR automatically' },
  { icon: Trophy, text: 'Climb exercise leaderboards with friends' },
  { icon: Flame, text: 'See your training at a glance' },
]

export default function AuthShell({ children }) {
  return (
    <div className="grid min-h-full lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-ink-800 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            backgroundImage:
              'radial-gradient(600px 400px at 20% 10%, rgba(199,247,22,0.16), transparent 60%), radial-gradient(700px 500px at 90% 90%, rgba(59,130,246,0.12), transparent 55%)',
          }}
        />
        <div className="relative flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-lime-400 text-ink-900">
            <Dumbbell className="h-6 w-6" strokeWidth={2.6} />
          </div>
          <span className="font-display text-2xl font-bold tracking-wide">
            PR<span className="text-lime-400">TRACKER</span>
          </span>
        </div>

        <div className="relative">
          <h1 className="font-display text-6xl font-extrabold uppercase leading-[0.95] tracking-tight">
            Lift heavier.
            <br />
            <span className="text-lime-400">Track everything.</span>
          </h1>
          <p className="mt-5 max-w-md text-lg text-mist">
            Build your routines, log your sets, and watch the numbers climb. Then see who really
            owns the bench.
          </p>
          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-chalk">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-lime-400/15 text-lime-400">
                  <Icon className="h-5 w-5" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-ash">Am I lifting heavier over time? Now you'll know.</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md animate-fade-up">{children}</div>
      </div>
    </div>
  )
}

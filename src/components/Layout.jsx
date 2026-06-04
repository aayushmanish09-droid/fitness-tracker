import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ClipboardList, TrendingUp, Users, LogOut, Dumbbell } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { Avatar } from './ui.jsx'
import { Toaster } from './toast.jsx'

const TABS = [
  { to: '/', label: 'Log', icon: ClipboardList, end: true },
  { to: '/progress', label: 'Progress', icon: TrendingUp },
  { to: '/friends', label: 'Friends', icon: Users },
]

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-lime-400 text-ink-900">
        <Dumbbell className="h-5 w-5" strokeWidth={2.6} />
      </div>
      <span className="font-display text-xl font-bold tracking-wide text-chalk">
        PR<span className="text-lime-400">TRACKER</span>
      </span>
    </div>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-full pb-24 md:pb-0">
      <Toaster />

      {/* Floating top bar */}
      <header className="sticky top-0 z-40 px-3 pt-3 sm:px-4 sm:pt-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 rounded-2xl border border-white/[0.07] bg-ink-800/80 px-4 py-2.5 shadow-card backdrop-blur-xl">
          <Logo />

          {/* Desktop tabs */}
          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {TABS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-lime-400/15 text-lime-300'
                      : 'text-mist hover:bg-white/5 hover:text-chalk'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <NavLink
              to="/profile"
              aria-label="Profile & settings"
              title="Profile & settings"
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-xl p-1 pr-1.5 transition-colors duration-200 cursor-pointer ${
                  isActive ? 'bg-lime-400/15' : 'hover:bg-white/5'
                }`
              }
            >
              <div className="hidden pl-1.5 text-right sm:block">
                <p className="text-sm font-semibold leading-tight text-chalk">@{user?.username}</p>
                <p className="text-xs uppercase tracking-wider text-ash">{user?.unit_preference}</p>
              </div>
              <Avatar name={user?.username || '?'} src={user?.profile_picture_url} size={38} you />
            </NavLink>
            <button
              onClick={handleLogout}
              className="grid h-9 w-9 place-items-center rounded-xl text-ash transition-colors duration-200 hover:bg-white/5 hover:text-pull cursor-pointer"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="mx-auto w-full max-w-5xl px-3 py-6 sm:px-4 sm:py-8">
        <Outlet />
      </main>

      {/* Mobile bottom tab bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.07] bg-ink-800/90 backdrop-blur-xl md:hidden"
        aria-label="Primary mobile"
      >
        <div className="mx-auto flex max-w-md items-stretch justify-around px-2 py-1.5">
          {TABS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-semibold transition-colors duration-200 cursor-pointer ${
                  isActive ? 'text-lime-400' : 'text-ash hover:text-mist'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-xl transition-colors ${
                      isActive ? 'bg-lime-400/15' : ''
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

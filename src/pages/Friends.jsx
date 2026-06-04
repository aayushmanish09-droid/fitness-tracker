import { useEffect, useState, useCallback } from 'react'
import {
  Search,
  UserPlus,
  Check,
  X,
  Clock,
  Trophy,
  Users,
  Medal,
  UserMinus,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import * as api from '../services/api.js'
import { Avatar, Button, EmptyState, SectionTitle, Skeleton } from '../components/ui.jsx'
import { toast } from '../components/toast.jsx'

export default function Friends() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [incoming, setIncoming] = useState([])
  const [friends, setFriends] = useState([])

  const refresh = useCallback(() => {
    api.getIncomingFriendRequests(user.id).then(setIncoming)
    api.getFriends(user.id).then(setFriends)
  }, [user.id])

  useEffect(() => {
    refresh()
  }, [refresh])

  // live search
  useEffect(() => {
    if (!query.trim()) {
      setResults(null)
      return
    }
    let active = true
    api.searchUsersByUsername(query, user.id).then((r) => active && setResults(r))
    return () => {
      active = false
    }
  }, [query, user.id, friends])

  const sendReq = async (id, username) => {
    try {
      await api.sendFriendRequest(user.id, id)
      toast.success(`Friend request sent to @${username}.`)
      api.searchUsersByUsername(query, user.id).then(setResults)
    } catch (e) {
      toast.error(e.message)
    }
  }
  const accept = async (req) => {
    await api.acceptFriendRequest(req.id)
    toast.success(`You're now friends with @${req.sender.username}.`)
    refresh()
  }
  const reject = async (req) => {
    await api.rejectFriendRequest(req.id)
    refresh()
  }
  const remove = async (id, username) => {
    await api.removeFriend(user.id, id)
    toast.success(`Removed @${username}.`)
    refresh()
  }

  return (
    <div className="space-y-6">
      <SectionTitle eyebrow="Friends" title="Compete & compare" />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: social management */}
        <div className="space-y-6 lg:col-span-2">
          {/* Search */}
          <div className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold text-chalk">
              <UserPlus className="h-5 w-5 text-lime-400" /> Add friends
            </h2>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ash" />
              <input
                className="input-field pl-11"
                placeholder="Search by username…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {results !== null && (
              <div className="mt-3 space-y-2">
                {results.length === 0 ? (
                  <p className="py-3 text-center text-sm text-ash">No users found for “{query}”.</p>
                ) : (
                  results.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-ink-800/60 px-3 py-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar name={u.username} src={u.profile_picture_url} size={38} />
                        <span className="truncate font-semibold text-chalk">@{u.username}</span>
                      </div>
                      <RelAction u={u} onSend={() => sendReq(u.id, u.username)} />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Incoming requests */}
          <div className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold text-chalk">
              <Clock className="h-5 w-5 text-lime-400" /> Requests
              {incoming.length > 0 && (
                <span className="rounded-full bg-pull px-2 py-0.5 text-xs font-bold text-white">
                  {incoming.length}
                </span>
              )}
            </h2>
            {incoming.length === 0 ? (
              <p className="py-3 text-sm text-ash">No pending requests.</p>
            ) : (
              <div className="space-y-2">
                {incoming.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-ink-800/60 px-3 py-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={req.sender.username} src={req.sender.profile_picture_url} size={38} />
                      <span className="truncate font-semibold text-chalk">@{req.sender.username}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => accept(req)}
                        className="grid h-9 w-9 place-items-center rounded-xl bg-lime-400 text-ink-900 transition hover:bg-lime-300 cursor-pointer"
                        aria-label="Accept"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => reject(req)}
                        className="grid h-9 w-9 place-items-center rounded-xl bg-ink-600 text-mist transition hover:bg-pull/20 hover:text-pull cursor-pointer"
                        aria-label="Reject"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Friend list */}
          <div className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold text-chalk">
              <Users className="h-5 w-5 text-lime-400" /> Your friends
              <span className="text-base font-sans font-normal text-ash">· {friends.length}</span>
            </h2>
            {friends.length === 0 ? (
              <p className="py-3 text-sm text-ash">No friends yet — search above to add some.</p>
            ) : (
              <div className="space-y-2">
                {friends.map((f) => (
                  <div
                    key={f.id}
                    className="group flex items-center justify-between gap-3 rounded-2xl bg-ink-800/60 px-3 py-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={f.username} src={f.profile_picture_url} size={38} />
                      <span className="truncate font-semibold text-chalk">@{f.username}</span>
                    </div>
                    <button
                      onClick={() => remove(f.id, f.username)}
                      className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-ash transition hover:bg-pull/15 hover:text-pull cursor-pointer"
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: leaderboard */}
        <div className="lg:col-span-3">
          <Leaderboard user={user} friendsCount={friends.length} />
        </div>
      </div>
    </div>
  )
}

function RelAction({ u, onSend }) {
  if (u.relationship === 'friends')
    return <span className="text-xs font-semibold text-lime-400">Friends</span>
  if (u.relationship === 'pending_out')
    return <span className="text-xs font-semibold text-ash">Requested</span>
  if (u.relationship === 'pending_in')
    return <span className="text-xs font-semibold text-mist">Wants to add you</span>
  return (
    <Button size="sm" onClick={onSend}>
      <UserPlus className="h-4 w-4" />
      Add
    </Button>
  )
}

const RANK_COLORS = ['#FFD43B', '#C0C7CE', '#E8945A'] // gold, silver, bronze

function Leaderboard({ user, friendsCount }) {
  const [exercises, setExercises] = useState([])
  const [exerciseId, setExerciseId] = useState('')
  const [rows, setRows] = useState(null)

  useEffect(() => {
    api.getLeaderboardEnabledExercises().then((list) => {
      setExercises(list)
      if (list.length) setExerciseId(list[0].id)
    })
  }, [])

  useEffect(() => {
    if (!exerciseId) return
    setRows(null)
    api.getExerciseLeaderboard(user.id, exerciseId).then(setRows)
  }, [user.id, exerciseId, friendsCount])

  const exName = exercises.find((e) => e.id === exerciseId)?.name

  return (
    <div className="card p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-lime-400/15 text-lime-400">
          <Medal className="h-5 w-5" />
        </span>
        <h2 className="font-display text-2xl font-bold text-chalk">Leaderboard</h2>
      </div>

      <select
        value={exerciseId}
        onChange={(e) => setExerciseId(e.target.value)}
        className="input-field mb-4 cursor-pointer font-semibold"
        aria-label="Choose leaderboard exercise"
      >
        {exercises.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
          </option>
        ))}
      </select>

      {rows === null ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-2xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={Trophy} title="No PRs yet">
          Log {exName} (or add friends who have) to start the ranking.
        </EmptyState>
      ) : (
        <ol className="space-y-2">
          {rows.map((r) => (
            <li
              key={r.userId}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                r.isYou
                  ? 'border-lime-400/40 bg-lime-400/[0.08]'
                  : 'border-white/[0.06] bg-ink-800/50'
              }`}
            >
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl font-display text-lg font-extrabold"
                style={{
                  backgroundColor: (RANK_COLORS[r.rank - 1] || '#2a333b') + (r.rank <= 3 ? '' : ''),
                  color: r.rank <= 3 ? '#08090B' : '#A7B0B6',
                }}
              >
                {r.rank}
              </span>
              <Avatar name={r.username} size={36} you={r.isYou} />
              <span className="min-w-0 flex-1 truncate font-semibold text-chalk">
                @{r.username}
                {r.isYou && <span className="ml-2 text-xs font-bold text-lime-400">YOU</span>}
              </span>
              <span className="font-display text-xl font-bold text-chalk">
                {r.best_weight}
                <span className="ml-0.5 text-sm text-mist">{r.unit}</span>
              </span>
            </li>
          ))}
        </ol>
      )}

      {friendsCount === 0 && rows && rows.length > 0 && (
        <p className="mt-4 text-center text-xs text-ash">
          Add friends to see how you stack up against them.
        </p>
      )}
    </div>
  )
}

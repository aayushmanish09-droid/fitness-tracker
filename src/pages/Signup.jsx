import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Camera, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { Button, Field, Input, Select, Avatar } from '../components/ui.jsx'
import AuthShell from '../components/AuthShell.jsx'
import { SEXES, UNITS } from '../lib/constants.js'
import { toast } from '../components/toast.jsx'

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    email: '',
    password: '',
    username: '',
    age: '',
    sex: 'Male',
    unit_preference: 'kg',
    profile_picture_url: null,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const onPickPhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 1.5 * 1024 * 1024) {
      setError('Image too large — please pick one under 1.5MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setForm((f) => ({ ...f, profile_picture_url: reader.result }))
    reader.readAsDataURL(file)
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.email || !form.password || !form.username || !form.age) {
      setError('Please fill in all required fields.')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (Number(form.age) < 13 || Number(form.age) > 100) {
      setError('Please enter a valid age.')
      return
    }
    setLoading(true)
    try {
      await signup(form.email, form.password, {
        username: form.username.trim(),
        age: form.age,
        sex: form.sex,
        unit_preference: form.unit_preference,
        profile_picture_url: form.profile_picture_url,
      })
      toast.success('Account created — build your first routine!')
      navigate('/')
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <div className="mb-7">
        <h2 className="font-display text-4xl font-bold text-chalk">Create your account</h2>
        <p className="mt-2 text-mist">Takes 30 seconds. Then start logging.</p>
      </div>

      <form onSubmit={submit} className="space-y-4" noValidate>
        {/* Profile picture (optional) */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar name={form.username || '?'} src={form.profile_picture_url} size={64} />
            {form.profile_picture_url && (
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, profile_picture_url: null }))}
                className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-pull text-white cursor-pointer"
                aria-label="Remove photo"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-chalk transition hover:border-lime-400/60 hover:text-lime-300">
            <Camera className="h-4 w-4" />
            {form.profile_picture_url ? 'Change photo' : 'Add photo'}
            <span className="text-xs font-normal text-ash">(optional)</span>
            <input type="file" accept="image/*" className="hidden" onChange={onPickPhoto} />
          </label>
        </div>

        <Field label="Username" htmlFor="username" hint="Unique — shown on leaderboards.">
          <Input
            id="username"
            placeholder="e.g. aayushlifts"
            value={form.username}
            onChange={set('username')}
            required
          />
        </Field>

        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={set('email')}
            required
          />
        </Field>

        <Field label="Password" htmlFor="password" hint="At least 6 characters.">
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={form.password}
            onChange={set('password')}
            required
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Age" htmlFor="age">
            <Input
              id="age"
              type="number"
              min="13"
              max="100"
              placeholder="24"
              value={form.age}
              onChange={set('age')}
              required
            />
          </Field>
          <Field label="Sex" htmlFor="sex">
            <Select id="sex" value={form.sex} onChange={set('sex')}>
              {SEXES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Preferred unit">
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-ink-800 p-1">
            {UNITS.map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setForm((f) => ({ ...f, unit_preference: u }))}
                className={`rounded-xl py-2.5 text-sm font-semibold uppercase tracking-wide transition-colors duration-200 cursor-pointer ${
                  form.unit_preference === u
                    ? 'bg-lime-400 text-ink-900'
                    : 'text-mist hover:text-chalk'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </Field>

        {error && <p className="text-sm text-pull">{error}</p>}

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Create account
          <ArrowRight className="h-5 w-5" />
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-mist">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-lime-400 hover:text-lime-300 cursor-pointer">
          Log in
        </Link>
      </p>
    </AuthShell>
  )
}

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, ArrowRight, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { Button, Field, Input } from '../components/ui.jsx'
import AuthShell from '../components/AuthShell.jsx'
import { DEMO_CREDENTIALS } from '../lib/seed.js'
import { toast } from '../components/toast.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const useDemo = async () => {
    setError('')
    setLoading(true)
    try {
      await login(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password)
      toast.success('Welcome back, @aayushlifts — explore the demo data!')
      navigate('/')
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <div className="mb-8">
        <h2 className="font-display text-4xl font-bold text-chalk">Welcome back</h2>
        <p className="mt-2 text-mist">Log in to keep the streak going.</p>
      </div>

      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Email" htmlFor="email" error={error && !email ? error : ''}>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ash" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="pl-11"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </Field>

        <Field label="Password" htmlFor="password">
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ash" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className="pl-11"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </Field>

        {error && <p className="text-sm text-pull">{error}</p>}

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Log in
          <ArrowRight className="h-5 w-5" />
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-ash">
        <span className="h-px flex-1 bg-white/10" />
        or
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <Button variant="outline" size="lg" className="w-full" onClick={useDemo} disabled={loading}>
        <Sparkles className="h-5 w-5 text-lime-400" />
        Explore the demo account
      </Button>

      <p className="mt-8 text-center text-sm text-mist">
        New here?{' '}
        <Link to="/signup" className="font-semibold text-lime-400 hover:text-lime-300 cursor-pointer">
          Create an account
        </Link>
      </p>
    </AuthShell>
  )
}

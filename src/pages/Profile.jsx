import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ImageIcon,
  Camera,
  Trash2,
  AtSign,
  Lock,
  Save,
  Check,
  LogOut,
  Eye,
  EyeOff,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { Avatar, Button, Field, Input, SectionTitle } from '../components/ui.jsx'
import CameraCapture from '../components/CameraCapture.jsx'
import { readImageAsAvatar } from '../lib/image.js'
import { toast } from '../components/toast.jsx'

export default function Profile() {
  const { user, updateProfile, changePassword, logout } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [savingPhoto, setSavingPhoto] = useState(false)

  const setPhoto = async (dataUrl) => {
    setSavingPhoto(true)
    try {
      await updateProfile({ profile_picture_url: dataUrl })
      toast.success(dataUrl ? 'Profile photo updated.' : 'Profile photo removed.')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSavingPhoto(false)
    }
  }

  const onPickFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-picking the same file
    if (!file) return
    try {
      const url = await readImageAsAvatar(file)
      await setPhoto(url)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Account" title="Your profile" />

      {/* ── Profile picture ─────────────────────────────────── */}
      <section className="card p-5 sm:p-6">
        <h2 className="mb-4 font-display text-xl font-bold text-chalk">Profile picture</h2>
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
          <Avatar name={user.username} src={user.profile_picture_url} size={96} you />
          <div className="flex flex-1 flex-wrap justify-center gap-2 sm:justify-start">
            <Button variant="secondary" onClick={() => fileRef.current?.click()} loading={savingPhoto}>
              <ImageIcon className="h-4 w-4" />
              Choose from library
            </Button>
            <Button variant="secondary" onClick={() => setCameraOpen(true)}>
              <Camera className="h-4 w-4" />
              Take a photo
            </Button>
            {user.profile_picture_url && (
              <Button variant="ghost" onClick={() => setPhoto(null)}>
                <Trash2 className="h-4 w-4" />
                Remove
              </Button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPickFile}
            />
          </div>
        </div>
      </section>

      {/* ── Account details ─────────────────────────────────── */}
      <section className="card p-5 sm:p-6">
        <h2 className="mb-4 font-display text-xl font-bold text-chalk">Account details</h2>
        <UsernameForm currentUsername={user.username} onSave={updateProfile} />

        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-5 sm:grid-cols-4">
          <ReadOnly label="Email" value={user.email} />
          <ReadOnly label="Age" value={user.age} />
          <ReadOnly label="Sex" value={user.sex} />
          <ReadOnly label="Units" value={user.unit_preference?.toUpperCase()} />
        </div>
      </section>

      {/* ── Password ────────────────────────────────────────── */}
      <section className="card p-5 sm:p-6">
        <h2 className="mb-4 font-display text-xl font-bold text-chalk">Change password</h2>
        <PasswordForm onChange={changePassword} />
      </section>

      {/* ── Sign out ────────────────────────────────────────── */}
      <Button variant="danger" className="w-full sm:w-auto" onClick={handleLogout}>
        <LogOut className="h-4 w-4" />
        Log out
      </Button>

      <CameraCapture open={cameraOpen} onClose={() => setCameraOpen(false)} onCapture={setPhoto} />
    </div>
  )
}

function ReadOnly({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="label">{label}</p>
      <p className="truncate text-sm font-medium text-chalk">{value}</p>
    </div>
  )
}

function UsernameForm({ currentUsername, onSave }) {
  const [username, setUsername] = useState(currentUsername)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const dirty = username.trim() !== currentUsername

  const save = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await onSave({ username })
      toast.success('Username updated.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <Field label="Username" htmlFor="username" error={error} hint="Shown on leaderboards and to friends.">
          <div className="relative">
            <AtSign className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ash" />
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="pl-11"
              autoComplete="username"
            />
          </div>
        </Field>
      </div>
      <Button type="submit" loading={saving} disabled={!dirty || !username.trim()}>
        <Save className="h-4 w-4" />
        Save
      </Button>
    </form>
  )
}

function PasswordForm({ onChange }) {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const save = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.current || !form.next) return setError('Fill in all fields.')
    if (form.next !== form.confirm) return setError("New passwords don't match.")
    setSaving(true)
    try {
      await onChange(form.current, form.next)
      toast.success('Password changed.')
      setForm({ current: '', next: '', confirm: '' })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const type = show ? 'text' : 'password'

  return (
    <form onSubmit={save} className="space-y-4">
      <Field label="Current password" htmlFor="cur">
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ash" />
          <Input id="cur" type={type} value={form.current} onChange={set('current')} className="pl-11 pr-11" autoComplete="current-password" />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ash transition hover:text-chalk cursor-pointer"
            aria-label={show ? 'Hide passwords' : 'Show passwords'}
          >
            {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="New password" htmlFor="new" hint="At least 6 characters.">
          <Input id="new" type={type} value={form.next} onChange={set('next')} autoComplete="new-password" />
        </Field>
        <Field label="Confirm new password" htmlFor="confirm">
          <Input id="confirm" type={type} value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />
        </Field>
      </div>
      {error && <p className="text-sm text-pull">{error}</p>}
      <Button type="submit" loading={saving}>
        <Check className="h-4 w-4" />
        Update password
      </Button>
    </form>
  )
}

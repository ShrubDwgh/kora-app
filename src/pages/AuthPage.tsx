import { ChangeEvent, FormEvent, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { useAuth } from '../hooks/useAuth'
import * as auth from '../services/auth'

type Mode = 'login' | 'register' | 'forgot'
const TITLE: Record<Mode, string> = { login: 'Masuk ke Kora', register: 'Buat akun Kora', forgot: 'Reset password' }

export default function AuthPage() {
  const { session } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [f, setF] = useState({ email: '', password: '', username: '', name: '' })
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  if (session) return <Navigate to="/" replace />

  const set = (k: keyof typeof f) => (e: ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })
  const go = (m: Mode) => { setMode(m); setMsg(null) }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      if (mode === 'login') await auth.signIn(f.email, f.password)
      else if (mode === 'register') {
        await auth.signUp(f.email, f.password, f.username, f.name || f.username)
        setMsg({ ok: true, text: 'Akun dibuat. Jika diminta, buka email konfirmasi lalu masuk.' })
      } else {
        await auth.requestReset(f.email)
        setMsg({ ok: true, text: 'Jika email terdaftar, tautan reset sudah dikirim.' })
      }
    } catch (x) {
      setMsg({ ok: false, text: (x as Error).message })
    }
    setBusy(false)
  }

  return (
    <main className="center">
      <form className="card auth" onSubmit={submit}>
        <Logo size={44} />
        <h1>{TITLE[mode]}</h1>
        {mode === 'register' && (
          <>
            <label>Username
              <input required pattern="[a-zA-Z0-9_]{3,20}" title="3-20 huruf, angka, atau garis bawah" value={f.username} onChange={set('username')} autoComplete="username" />
            </label>
            <label>Nama tampilan
              <input required maxLength={50} value={f.name} onChange={set('name')} autoComplete="name" />
            </label>
          </>
        )}
        <label>Email
          <input type="email" required value={f.email} onChange={set('email')} autoComplete="email" />
        </label>
        {mode !== 'forgot' && (
          <label>Password
            <input type="password" required minLength={8} value={f.password} onChange={set('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          </label>
        )}
        {msg && <p role={msg.ok ? 'status' : 'alert'} className={msg.ok ? 'ok' : 'err'}>{msg.text}</p>}
        <button className="btn primary" disabled={busy}>{busy ? 'Memproses…' : mode === 'login' ? 'Masuk' : mode === 'register' ? 'Daftar' : 'Kirim tautan reset'}</button>
        <div className="row">
          {mode !== 'login' && <button type="button" className="btn sm" onClick={() => go('login')}>Sudah punya akun</button>}
          {mode !== 'register' && <button type="button" className="btn sm" onClick={() => go('register')}>Daftar</button>}
          {mode === 'login' && <button type="button" className="btn sm" onClick={() => go('forgot')}>Lupa password</button>}
        </div>
      </form>
    </main>
  )
}

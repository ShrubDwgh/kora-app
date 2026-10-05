import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { updatePassword } from '../services/auth'

export default function ResetPassword() {
  const nav = useNavigate()
  const [pw, setPw] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    try {
      await updatePassword(pw)
      setMsg({ ok: true, text: 'Password diperbarui.' })
      setTimeout(() => nav('/'), 1200)
    } catch (x) {
      setMsg({ ok: false, text: (x as Error).message })
    }
  }

  return (
    <section className="page">
      <h1>Password baru</h1>
      <form className="card" onSubmit={submit}>
        <label>Password baru
          <input type="password" required minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
        </label>
        {msg && <p role={msg.ok ? 'status' : 'alert'} className={msg.ok ? 'ok' : 'err'}>{msg.text}</p>}
        <button className="btn primary">Simpan password</button>
      </form>
    </section>
  )
}

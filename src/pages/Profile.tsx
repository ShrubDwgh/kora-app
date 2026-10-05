import { FormEvent, useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { signOut, updateProfile } from '../services/auth'
import { date, initial } from '../utils/format'

export default function Profile() {
  const { profile, reloadProfile } = useAuth()
  const [f, setF] = useState({ display_name: '', status: '', bio: '' })
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    if (profile) setF({ display_name: profile.display_name, status: profile.status ?? '', bio: profile.bio ?? '' })
  }, [profile])

  if (!profile) return <section className="page"><div className="skeleton" /></section>

  async function save(e: FormEvent) {
    e.preventDefault()
    try {
      await updateProfile(profile!.id, { display_name: f.display_name.trim(), status: f.status.trim() || null, bio: f.bio.trim() || null })
      reloadProfile()
      setMsg({ ok: true, text: 'Profil disimpan' })
    } catch (x) {
      setMsg({ ok: false, text: (x as Error).message })
    }
  }

  return (
    <section className="page">
      <header className="head">
        <div className="avatar lg">{initial(profile.display_name)}</div>
        <div>
          <h1>{profile.display_name}</h1>
          <p className="muted">@{profile.username} · bergabung {date(profile.created_at)}</p>
        </div>
      </header>
      <form className="card" onSubmit={save}>
        <label>Nama tampilan<input required maxLength={50} value={f.display_name} onChange={(e) => setF({ ...f, display_name: e.target.value })} /></label>
        <label>Status<input maxLength={60} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} /></label>
        <label>Bio<textarea rows={3} maxLength={200} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} /></label>
        {msg && <p role={msg.ok ? 'status' : 'alert'} className={msg.ok ? 'ok' : 'err'}>{msg.text}</p>}
        <button className="btn primary">Simpan profil</button>
      </form>
      <button className="btn danger" onClick={() => signOut()}>Keluar dari Kora</button>
    </section>
  )
}

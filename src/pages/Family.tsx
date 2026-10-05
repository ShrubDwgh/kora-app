import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Async } from '../components/Async'
import { useAsync } from '../hooks/useAsync'
import { useAuth } from '../hooks/useAuth'
import { acceptInvite, createFamily, familyConversation, inviteToFamily, leaveFamily, listFamilies } from '../services/family'

export default function Family() {
  const uid = useAuth().session!.user.id
  const nav = useNavigate()
  const s = useAsync(() => listFamilies(uid), [uid])
  const [name, setName] = useState('')
  const [inv, setInv] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function run(fn: () => Promise<unknown>, ok: string) {
    setMsg(null)
    try {
      await fn()
      setMsg({ ok: true, text: ok })
      s.reload()
    } catch (x) {
      setMsg({ ok: false, text: (x as Error).message })
    }
  }
  async function openChat(fid: string) {
    try {
      nav(`/chats/${await familyConversation(fid)}`)
    } catch (x) {
      setMsg({ ok: false, text: (x as Error).message })
    }
  }

  return (
    <section className="page">
      <h1>Family Space</h1>
      <form className="card" onSubmit={(e) => { e.preventDefault(); run(() => createFamily(name.trim()), 'Keluarga dibuat').then(() => setName('')) }}>
        <label>Nama keluarga
          <input required minLength={2} maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <button className="btn primary">Buat keluarga</button>
      </form>
      {msg && <p role={msg.ok ? 'status' : 'alert'} className={msg.ok ? 'ok' : 'err'}>{msg.text}</p>}
      <Async s={s} empty="Belum ada keluarga. Buat Family Space pertamamu di atas.">
        {(rows: any[]) => (
          <>
            {rows.filter((r) => r.status === 'invited' && r.family).map((r) => (
              <div className="item" key={r.family.id}>
                <div className="grow"><b>Undangan keluarga {r.family.name}</b></div>
                <button className="btn primary sm" onClick={() => run(() => acceptInvite(r.family.id), 'Kamu bergabung')}>Terima</button>
                <button className="btn sm" onClick={() => run(() => leaveFamily(r.family.id, uid), 'Undangan ditolak')}>Tolak</button>
              </div>
            ))}
            {rows.filter((r) => r.status === 'active' && r.family).map((r) => {
              const f = r.family
              const members: any[] = (f.members ?? []).filter((m: any) => m.status === 'active')
              return (
                <article className="card" key={f.id}>
                  <h3>{f.name}</h3>
                  <div className="row">
                    {members.map((m) => <span className="chip" key={m.user_id}>{m.profile?.display_name}{m.role === 'admin' ? ' (admin)' : ''}</span>)}
                  </div>
                  <div className="row">
                    <button className="btn primary sm" onClick={() => openChat(f.id)}>Buka chat keluarga</button>
                    <button className="btn sm danger" onClick={() => run(() => leaveFamily(f.id, uid), 'Kamu keluar dari keluarga')}>Keluar</button>
                  </div>
                  {r.role === 'admin' && (
                    <form className="row" onSubmit={(e) => { e.preventDefault(); run(() => inviteToFamily(f.id, inv[f.id] ?? ''), 'Undangan terkirim').then(() => setInv({ ...inv, [f.id]: '' })) }}>
                      <input className="grow" required aria-label={`Username untuk diundang ke ${f.name}`} placeholder="Username anggota" value={inv[f.id] ?? ''} onChange={(e) => setInv({ ...inv, [f.id]: e.target.value })} />
                      <button className="btn sm">Undang</button>
                    </form>
                  )}
                </article>
              )
            })}
          </>
        )}
      </Async>
    </section>
  )
}

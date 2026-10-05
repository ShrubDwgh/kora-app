import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Async } from '../components/Async'
import { useAsync } from '../hooks/useAsync'
import { useAuth } from '../hooks/useAuth'
import { createGroup, listConversations, startDm } from '../services/chat'
import { convLabel, initial } from '../utils/format'

const KIND: Record<string, string> = { dm: 'Pesan pribadi', group: 'Grup', family: 'Keluarga', channel: 'Channel komunitas' }

export default function Chats() {
  const uid = useAuth().session!.user.id
  const nav = useNavigate()
  const list = useAsync(listConversations, [])
  const [f, setF] = useState({ names: '', title: '' })
  const [err, setErr] = useState('')

  async function start(e: FormEvent) {
    e.preventDefault()
    setErr('')
    const names = f.names.split(',').map((s) => s.trim().replace(/^@/, '')).filter(Boolean)
    try {
      const id = names.length === 1 && !f.title.trim() ? await startDm(names[0]) : await createGroup(f.title.trim() || 'Grup baru', names)
      nav(`/chats/${id}`)
    } catch (x) {
      setErr((x as Error).message)
    }
  }

  return (
    <section className="page">
      <h1>Obrolan</h1>
      <form className="card" onSubmit={start}>
        <label>Username (pisahkan koma untuk grup)
          <input required value={f.names} onChange={(e) => setF({ ...f, names: e.target.value })} placeholder="andi, sari" />
        </label>
        <label>Nama grup (opsional)
          <input maxLength={80} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        </label>
        {err && <p className="err" role="alert">{err}</p>}
        <button className="btn primary">Mulai obrolan</button>
      </form>
      <Async s={list} empty="Belum ada obrolan. Mulai dengan username temanmu.">
        {(rows: any[]) =>
          rows.map((c) => {
            const label = convLabel(c, uid)
            return (
              <Link className="item" key={c.id} to={`/chats/${c.id}`}>
                <div className="avatar">{initial(label)}</div>
                <div className="grow"><b>{label}</b><br /><small>{KIND[c.kind]}</small></div>
              </Link>
            )
          })
        }
      </Async>
    </section>
  )
}

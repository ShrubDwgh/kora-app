import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Async } from '../components/Async'
import { useAsync } from '../hooks/useAsync'
import { useAuth } from '../hooks/useAuth'
import { createCommunity, joinCommunity, listCommunities, myMemberships } from '../services/communities'
import { initial } from '../utils/format'

const CATEGORIES = ['gaming', 'coding', 'sekolah', 'musik', 'anime', 'teknologi', 'hobi', 'lokal', 'lainnya']
const TABS: [string, string][] = [['popular', 'Populer'], ['new', 'Terbaru'], ['mine', 'Diikuti']]
const count = (c: any): number => c.community_members?.[0]?.count ?? 0

export default function Communities() {
  const uid = useAuth().session!.user.id
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [tab, setTab] = useState('popular')
  const [creating, setCreating] = useState(false)
  const [f, setF] = useState({ name: '', description: '', category: 'lainnya' })
  const [err, setErr] = useState('')

  const data = useAsync(async () => {
    const [all, mine] = await Promise.all([listCommunities(), myMemberships(uid)])
    return { all, mine: new Set<string>(mine.map((m: any) => m.community_id)) }
  }, [uid])

  async function create(e: FormEvent) {
    e.preventDefault()
    setErr('')
    try {
      nav(`/communities/${await createCommunity(f.name.trim(), f.description.trim(), f.category)}`)
    } catch (x) {
      setErr((x as Error).message)
    }
  }
  async function join(id: string) {
    setErr('')
    try {
      await joinCommunity(id)
      data.reload()
    } catch (x) {
      setErr((x as Error).message)
    }
  }

  return (
    <section className="page">
      <div className="row">
        <h1 className="grow">Komunitas</h1>
        <button className="btn primary" onClick={() => setCreating(!creating)} aria-expanded={creating}>Buat komunitas</button>
      </div>
      {creating && (
        <form className="card" onSubmit={create}>
          <label>Nama<input required minLength={2} maxLength={60} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
          <label>Deskripsi<textarea rows={3} maxLength={500} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></label>
          <label>Kategori
            <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <button className="btn primary">Buat</button>
        </form>
      )}
      <label className="search">Cari komunitas
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nama atau deskripsi" />
      </label>
      <div className="tabs" role="group" aria-label="Kategori">
        <button className="btn sm" aria-pressed={cat === ''} onClick={() => setCat('')}>Semua</button>
        {CATEGORIES.map((c) => <button key={c} className="btn sm" aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>)}
      </div>
      <div className="tabs" role="tablist">
        {TABS.map(([k, label]) => <button key={k} role="tab" className="btn sm" aria-selected={tab === k} onClick={() => setTab(k)}>{label}</button>)}
      </div>
      {err && <p className="err" role="alert">{err}</p>}
      <Async s={data}>
        {({ all, mine }) => {
          const term = q.trim().toLowerCase()
          const rows = all
            .filter((c: any) => (!cat || c.category === cat) && (tab !== 'mine' || mine.has(c.id)) && (!term || `${c.name} ${c.description ?? ''}`.toLowerCase().includes(term)))
            .sort((a: any, b: any) => (tab === 'new' ? b.created_at.localeCompare(a.created_at) : count(b) - count(a)))
          if (!rows.length) return <div className="state">Tidak ada komunitas yang cocok.</div>
          return rows.map((c: any) => (
            <div className="item" key={c.id}>
              <div className="avatar">{initial(c.name)}</div>
              <div className="grow">
                <b>{c.name}</b>
                <p className="muted clamp">{c.description}</p>
                <small>{count(c)} anggota · {c.category}</small>
              </div>
              {mine.has(c.id)
                ? <Link className="btn sm" to={`/communities/${c.id}`}>Buka</Link>
                : <><Link className="btn sm" to={`/communities/${c.id}`}>Lihat</Link><button className="btn primary sm" onClick={() => join(c.id)}>Gabung</button></>}
            </div>
          ))
        }}
      </Async>
    </section>
  )
}

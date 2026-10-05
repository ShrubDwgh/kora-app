import { FormEvent, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Async } from '../components/Async'
import { PostCard } from '../components/PostCard'
import { useAsync } from '../hooks/useAsync'
import { useAuth } from '../hooks/useAuth'
import { createPost, getCommunity, joinCommunity, kickMember, leaveCommunity, listChannels, listMembers, listPosts, setRole } from '../services/communities'
import { initial } from '../utils/format'

type Tab = 'posts' | 'channels' | 'members'
const TABS: [Tab, string][] = [['posts', 'Postingan'], ['channels', 'Channel'], ['members', 'Anggota']]

function Posts({ cid, uid, member, staff }: { cid: string; uid: string; member: boolean; staff: boolean }) {
  const posts = useAsync(() => listPosts(cid), [cid])
  const [f, setF] = useState({ title: '', body: '' })
  const [err, setErr] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setErr('')
    try {
      await createPost(cid, f.title.trim(), f.body.trim())
      setF({ title: '', body: '' })
      posts.reload()
    } catch (x) {
      setErr((x as Error).message)
    }
  }

  return (
    <>
      {member && (
        <form className="card" onSubmit={submit}>
          <label>Judul<input required maxLength={120} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></label>
          <label>Isi<textarea required rows={3} maxLength={5000} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></label>
          {err && <p className="err" role="alert">{err}</p>}
          <button className="btn primary">Posting</button>
        </form>
      )}
      <Async s={posts} empty="Belum ada postingan di komunitas ini.">
        {(rows: any[]) => rows.map((p) => <PostCard key={p.id} p={p} uid={uid} staff={staff} canComment={member} onChanged={posts.reload} />)}
      </Async>
    </>
  )
}

export default function CommunityPage() {
  const { id = '' } = useParams()
  const uid = useAuth().session!.user.id
  const [tab, setTab] = useState<Tab>('posts')
  const [err, setErr] = useState('')
  const s = useAsync(async () => {
    const [c, members, channels] = await Promise.all([getCommunity(id), listMembers(id), listChannels(id)])
    return { c, members, channels }
  }, [id])

  async function act(fn: () => Promise<unknown>) {
    setErr('')
    try {
      await fn()
      s.reload()
    } catch (x) {
      setErr((x as Error).message)
    }
  }

  return (
    <section className="page">
      <p><Link to="/communities">‹ Komunitas</Link></p>
      <Async s={s}>
        {({ c, members, channels }) => {
          const me: string | undefined = members.find((m: any) => m.user_id === uid)?.role
          const staff = me === 'owner' || me === 'admin' || me === 'moderator'
          const admin = me === 'owner' || me === 'admin'
          return (
            <>
              <header className="head">
                <div className="avatar lg">{initial(c.name)}</div>
                <div className="grow">
                  <h1>{c.name}</h1>
                  <p className="muted">{c.description}</p>
                  <small>{c.category} · {members.length} anggota</small>
                </div>
                {!me && <button className="btn primary" onClick={() => act(() => joinCommunity(id))}>Gabung</button>}
                {me && me !== 'owner' && <button className="btn" onClick={() => act(() => leaveCommunity(id))}>Keluar</button>}
              </header>
              {c.rules && <details className="card"><summary>Aturan komunitas</summary><p className="pre">{c.rules}</p></details>}
              {err && <p className="err" role="alert">{err}</p>}
              <div className="tabs" role="tablist">
                {TABS.map(([k, label]) => <button key={k} role="tab" className="btn sm" aria-selected={tab === k} onClick={() => setTab(k)}>{label}</button>)}
              </div>
              {tab === 'posts' && <Posts cid={id} uid={uid} member={!!me} staff={staff} />}
              {tab === 'channels' &&
                (channels.length
                  ? channels.map((ch: any) => <Link className="item" key={ch.id} to={`/chats/${ch.id}`}><b>#{ch.title}</b></Link>)
                  : <div className="state">Gabung komunitas untuk membuka channel.</div>)}
              {tab === 'members' && (
                <ul className="list">
                  {members.map((m: any) => (
                    <li key={m.user_id} className="item">
                      <div className="avatar">{initial(m.profile?.display_name)}</div>
                      <div className="grow"><b>{m.profile?.display_name}</b> <small>@{m.profile?.username}</small></div>
                      <span className="chip">{m.role}</span>
                      {admin && m.role !== 'owner' && m.user_id !== uid && (
                        <button className="btn sm" onClick={() => act(() => setRole(id, m.user_id, m.role === 'moderator' ? 'member' : 'moderator'))}>
                          {m.role === 'moderator' ? 'Cabut moderator' : 'Jadikan moderator'}
                        </button>
                      )}
                      {m.role !== 'owner' && m.user_id !== uid && (admin || (staff && m.role === 'member')) && (
                        <button className="btn sm danger" onClick={() => act(() => kickMember(id, m.user_id))}>Keluarkan</button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )
        }}
      </Async>
    </section>
  )
}

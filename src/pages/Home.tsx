import { Link } from 'react-router-dom'
import { Async } from '../components/Async'
import { useAsync } from '../hooks/useAsync'
import { useAuth } from '../hooks/useAuth'
import { listFeed } from '../services/communities'
import { date } from '../utils/format'

export default function Home() {
  const { session, profile } = useAuth()
  const uid = session!.user.id
  const feed = useAsync(() => listFeed(uid), [uid])
  return (
    <section className="page">
      <h1>Halo, {profile?.display_name ?? ''}</h1>
      <h2>Terbaru dari komunitasmu</h2>
      <Async s={feed} empty="Belum ada postingan. Gabung komunitas untuk mulai.">
        {(rows: any[]) =>
          rows.map((p) => (
            <article className="card" key={p.id}>
              <small>{p.community?.name} · {p.author?.display_name} · {date(p.created_at)}</small>
              <h3><Link to={`/communities/${p.community_id}`}>{p.title}</Link></h3>
              <p className="clamp">{p.body}</p>
            </article>
          ))
        }
      </Async>
      <p><Link to="/communities">Jelajahi komunitas</Link></p>
    </section>
  )
}

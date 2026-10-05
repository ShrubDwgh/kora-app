import { Link } from 'react-router-dom'
import { Async } from '../components/Async'
import { useAsync } from '../hooks/useAsync'
import { listNotifications, markAllRead } from '../services/notifications'
import { date, time } from '../utils/format'

const TEXT: Record<string, string> = {
  message: 'mengirim pesan',
  mention: 'menyebut kamu',
  reply: 'membalas pesanmu',
  reaction: 'memberi reaksi',
  community_invite: 'mengundangmu ke komunitas',
  family_invite: 'mengundangmu ke keluarga',
  announcement: 'membuat pengumuman',
  family_activity: 'ada aktivitas keluarga',
}

export default function Notifications() {
  const s = useAsync(async () => {
    const rows = await listNotifications()
    await markAllRead()
    return rows
  }, [])
  return (
    <section className="page">
      <h1>Notifikasi</h1>
      <Async s={s} empty="Belum ada notifikasi.">
        {(rows: any[]) =>
          rows.map((n) => (
            <Link key={n.id} className="item" to={n.conversation_id ? `/chats/${n.conversation_id}` : n.kind === 'family_invite' ? '/family' : '/'}>
              <div className="grow">
                <b>{n.actor?.display_name ?? 'Seseorang'}</b> {TEXT[n.kind]}
                {n.body && <p className="muted clamp">{n.body}</p>}
                <small>{date(n.created_at)} {time(n.created_at)}{n.read_at ? '' : ' · baru'}</small>
              </div>
            </Link>
          ))
        }
      </Async>
    </section>
  )
}

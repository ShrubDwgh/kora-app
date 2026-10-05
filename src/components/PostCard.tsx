import { FormEvent, useState } from 'react'
import { useAsync } from '../hooks/useAsync'
import { addComment, deleteComment, deletePost, listComments } from '../services/communities'
import { date } from '../utils/format'
import { Async } from './Async'

type Props = { p: any; uid: string; staff: boolean; canComment: boolean; onChanged: () => void }

export function PostCard({ p, uid, staff, canComment, onChanged }: Props) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [err, setErr] = useState('')
  const cs = useAsync(() => (open ? listComments(p.id) : Promise.resolve([] as any[])), [open, p.id])

  async function run(fn: () => Promise<unknown>) {
    setErr('')
    try {
      await fn()
      cs.reload()
      onChanged()
    } catch (e) {
      setErr((e as Error).message)
    }
  }

  return (
    <article className="card">
      <small>{p.author?.display_name} · {date(p.created_at)}</small>
      <h3>{p.title}</h3>
      <p className="pre">{p.body}</p>
      <div className="row">
        <button className="btn sm" aria-expanded={open} onClick={() => setOpen(!open)}>
          Komentar ({p.comments?.[0]?.count ?? 0})
        </button>
        {(p.author_id === uid || staff) && (
          <button className="btn sm danger" onClick={() => run(() => deletePost(p.id))}>Hapus postingan</button>
        )}
      </div>
      {err && <p className="err" role="alert">{err}</p>}
      {open && (
        <div className="stack">
          <Async s={cs} empty="Belum ada komentar.">
            {(rows: any[]) =>
              rows.map((c) => (
                <div key={c.id} className="comment">
                  <small>{c.author?.display_name} · {date(c.created_at)}</small>
                  <p className="pre">{c.body}</p>
                  {(c.author_id === uid || staff) && (
                    <button className="btn sm danger" onClick={() => run(() => deleteComment(c.id))}>Hapus</button>
                  )}
                </div>
              ))
            }
          </Async>
          {canComment && (
            <form
              className="row"
              onSubmit={(e: FormEvent) => {
                e.preventDefault()
                run(() => addComment(p.id, text.trim())).then(() => setText(''))
              }}
            >
              <input className="grow" aria-label="Tulis komentar" required maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} placeholder="Tulis komentar" />
              <button className="btn primary">Kirim</button>
            </form>
          )}
        </div>
      )}
    </article>
  )
}

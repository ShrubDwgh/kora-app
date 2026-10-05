import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAsync } from '../hooks/useAsync'
import { useAuth } from '../hooks/useAuth'
import { deleteMessage, editMessage, getConversation, getMessage, listMessages, sendMessage, subscribeMessages } from '../services/chat'
import { convLabel, time } from '../utils/format'

export default function ChatRoom() {
  const { id = '' } = useParams()
  const uid = useAuth().session!.user.id
  const conv = useAsync(() => getConversation(id), [id])
  const [msgs, setMsgs] = useState<any[]>([])
  const [loaded, setLoaded] = useState(false)
  const [text, setText] = useState('')
  const [reply, setReply] = useState<any>(null)
  const [edit, setEdit] = useState<any>(null)
  const [err, setErr] = useState('')
  const end = useRef<HTMLDivElement>(null)

  const upsert = (m: any) =>
    setMsgs((p) => (p.some((x) => x.id === m.id) ? p.map((x) => (x.id === m.id ? m : x)) : [...p, m]))

  useEffect(() => {
    let live = true
    setLoaded(false)
    setMsgs([])
    const off = subscribeMessages(id, (mid) => {
      getMessage(mid).then((m) => live && upsert(m)).catch(() => {})
    })
    listMessages(id)
      .then((rows) => {
        if (!live) return
        const ids = new Set(rows.map((r) => r.id))
        setMsgs((p) => [...rows, ...p.filter((x) => !ids.has(x.id))])
        setLoaded(true)
      })
      .catch((e) => live && setErr((e as Error).message))
    return () => {
      live = false
      off()
    }
  }, [id])

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' })
  }, [msgs.length])

  async function submit(e: FormEvent) {
    e.preventDefault()
    const body = text.trim()
    if (!body) return
    setErr('')
    setText('')
    try {
      if (edit) {
        upsert(await editMessage(edit.id, body))
        setEdit(null)
      } else {
        upsert(await sendMessage(id, body, reply?.id))
        setReply(null)
      }
    } catch (x) {
      setErr((x as Error).message)
      setText(body)
    }
  }
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      e.currentTarget.form?.requestSubmit()
    }
  }
  const remove = (mid: string) => deleteMessage(mid).then(upsert).catch((x) => setErr((x as Error).message))

  return (
    <section className="room">
      <header className="room-head">
        <Link to="/chats" aria-label="Kembali ke daftar obrolan">‹</Link>
        <h1>{conv.data ? convLabel(conv.data, uid) : 'Memuat…'}</h1>
      </header>
      <div className="msgs" role="log" aria-live="polite" aria-label="Pesan">
        {!loaded && !err && <div className="skeleton" />}
        {loaded && msgs.length === 0 && <div className="state">Belum ada pesan. Sapa duluan.</div>}
        {msgs.map((m) => {
          const mine = m.sender_id === uid
          const parent = msgs.find((x) => x.id === m.reply_to)
          return (
            <div key={m.id} className={`msg${mine ? ' mine' : ''}`}>
              {!mine && <b className="who">{m.sender?.display_name}</b>}
              {parent && <blockquote>{parent.deleted_at ? 'Pesan dihapus' : String(parent.body).slice(0, 80)}</blockquote>}
              <p className="pre">{m.deleted_at ? <i>Pesan dihapus</i> : m.body}</p>
              <small>{time(m.created_at)}{m.edited_at && !m.deleted_at ? ' · diedit' : ''}{mine ? ' · ✓ Terkirim' : ''}</small>
              {!m.deleted_at && (
                <span className="acts">
                  <button onClick={() => { setReply(m); setEdit(null) }}>Balas</button>
                  {mine && <button onClick={() => { setEdit(m); setReply(null); setText(m.body) }}>Edit</button>}
                  {mine && <button onClick={() => remove(m.id)}>Hapus</button>}
                </span>
              )}
            </div>
          )
        })}
        <div ref={end} />
      </div>
      <form className="composer" onSubmit={submit}>
        {(reply || edit) && (
          <div className="row">
            <small className="grow">{edit ? 'Mengedit pesan' : `Membalas ${reply.sender?.display_name ?? ''}`}</small>
            <button type="button" className="btn sm" onClick={() => { setReply(null); setEdit(null); setText('') }}>Batal</button>
          </div>
        )}
        {err && <p className="err" role="alert">{err}</p>}
        <div className="row">
          <textarea className="grow" rows={1} maxLength={4000} aria-label="Tulis pesan" placeholder="Tulis pesan" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKey} />
          <button className="btn primary" disabled={!text.trim()}>{edit ? 'Simpan' : 'Kirim'}</button>
        </div>
      </form>
    </section>
  )
}

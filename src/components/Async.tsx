import type { ReactNode } from 'react'

type State<T> = { data?: T; error?: string; loading: boolean; reload: () => void }

export function Async<T>({ s, children, empty }: { s: State<T>; children: (data: T) => ReactNode; empty?: string }) {
  if (s.error)
    return (
      <div className="state err" role="alert">
        <p>{s.error}</p>
        <button className="btn" onClick={s.reload}>Coba lagi</button>
      </div>
    )
  if (s.data === undefined)
    return (
      <div className="stack" aria-busy="true" aria-label="Memuat">
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
    )
  if (Array.isArray(s.data) && s.data.length === 0) return <div className="state">{empty ?? 'Belum ada data.'}</div>
  return <>{children(s.data)}</>
}

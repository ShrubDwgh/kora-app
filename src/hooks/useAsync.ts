import { DependencyList, useCallback, useEffect, useState } from 'react'

export function useAsync<T>(fn: () => Promise<T>, deps: DependencyList) {
  const [s, setS] = useState<{ data?: T; error?: string; loading: boolean }>({ loading: true })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const reload = useCallback(() => {
    setS((p) => ({ ...p, loading: true, error: undefined }))
    fn().then(
      (data) => setS({ data, loading: false }),
      (e) => setS((p) => ({ ...p, error: (e as Error).message, loading: false })),
    )
  }, deps)
  useEffect(() => {
    reload()
  }, [reload])
  return { ...s, reload }
}

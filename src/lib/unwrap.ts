export function unwrap<T = any>(r: { data: unknown; error: { message: string } | null }): T {
  if (r.error) throw new Error(r.error.message)
  return r.data as T
}

export const time = (iso: string) => new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
export const date = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
export const initial = (s?: string | null) => (s?.trim()[0] ?? '?').toUpperCase()

export function convLabel(c: any, uid: string): string {
  if (c.kind === 'dm') return c.conversation_members?.find((m: any) => m.user_id !== uid)?.profile?.display_name ?? 'Obrolan'
  if (c.kind === 'channel') return `${c.community?.name ?? 'Komunitas'} #${c.title ?? 'umum'}`
  return c.title ?? 'Obrolan'
}

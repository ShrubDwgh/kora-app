import { supabase } from '../lib/supabase'
import { unwrap } from '../lib/unwrap'

const MSG = 'id,body,sender_id,reply_to,created_at,edited_at,deleted_at,sender:profiles!sender_id(display_name,username)'
const CONV =
  'id,kind,title,last_message_at,community:communities!community_id(name),conversation_members(user_id,profile:profiles!user_id(display_name,username))'

export const listConversations = async () =>
  unwrap<any[]>(await supabase.from('conversations').select(CONV).order('last_message_at', { ascending: false }).limit(100))
export const getConversation = async (id: string) =>
  unwrap<any>(await supabase.from('conversations').select(CONV).eq('id', id).single())
export const startDm = async (username: string) => unwrap<string>(await supabase.rpc('start_dm', { p_username: username }))
export const createGroup = async (title: string, usernames: string[]) =>
  unwrap<string>(await supabase.rpc('create_group', { p_title: title, p_usernames: usernames }))

export async function listMessages(cid: string) {
  const rows = unwrap<any[]>(
    await supabase.from('messages').select(MSG).eq('conversation_id', cid).order('created_at', { ascending: false }).limit(100),
  )
  return rows.reverse()
}
export const getMessage = async (id: string) => unwrap<any>(await supabase.from('messages').select(MSG).eq('id', id).single())
export const sendMessage = async (cid: string, body: string, replyTo?: string) =>
  unwrap<any>(await supabase.from('messages').insert({ conversation_id: cid, body, reply_to: replyTo ?? null }).select(MSG).single())
export const editMessage = async (id: string, body: string) =>
  unwrap<any>(await supabase.from('messages').update({ body, edited_at: new Date().toISOString() }).eq('id', id).select(MSG).single())
export const deleteMessage = async (id: string) =>
  unwrap<any>(await supabase.from('messages').update({ deleted_at: new Date().toISOString() }).eq('id', id).select(MSG).single())

// Realtime mengikuti RLS: client hanya menerima perubahan pesan yang boleh ia baca.
export function subscribeMessages(cid: string, onChange: (messageId: string) => void) {
  const channel = supabase
    .channel(`room:${cid}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${cid}` }, (p: any) => {
      if (p.new?.id) onChange(p.new.id)
    })
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}

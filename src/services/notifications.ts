import { supabase } from '../lib/supabase'
import { unwrap } from '../lib/unwrap'

export const listNotifications = async () =>
  unwrap<any[]>(
    await supabase
      .from('notifications')
      .select('id,kind,body,read_at,created_at,conversation_id,actor:profiles!actor_id(display_name)')
      .order('created_at', { ascending: false })
      .limit(50),
  )
export const markAllRead = async () =>
  unwrap(await supabase.from('notifications').update({ read_at: new Date().toISOString() }).is('read_at', null))

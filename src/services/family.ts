import { supabase } from '../lib/supabase'
import { unwrap } from '../lib/unwrap'

export const listFamilies = async (uid: string) =>
  unwrap<any[]>(
    await supabase
      .from('family_members')
      .select('status,role,family:families!family_id(id,name,members:family_members(user_id,role,status,profile:profiles!user_id(display_name,username)))')
      .eq('user_id', uid),
  )
export const createFamily = async (name: string) => unwrap<string>(await supabase.rpc('create_family', { p_name: name }))
export const inviteToFamily = async (family: string, username: string) =>
  unwrap(await supabase.rpc('invite_to_family', { p_family: family, p_username: username.replace(/^@/, '') }))
export const acceptInvite = async (family: string) => unwrap(await supabase.rpc('accept_family_invite', { p_family: family }))
export const leaveFamily = async (family: string, uid: string) =>
  unwrap(await supabase.from('family_members').delete().eq('family_id', family).eq('user_id', uid))
export async function familyConversation(family: string) {
  const row = unwrap<{ id: string }>(await supabase.from('conversations').select('id').eq('family_id', family).single())
  return row.id
}

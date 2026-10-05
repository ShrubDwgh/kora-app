import { supabase } from '../lib/supabase'
import { unwrap } from '../lib/unwrap'

export const listCommunities = async () =>
  unwrap<any[]>(
    await supabase
      .from('communities')
      .select('id,name,description,category,created_at,community_members(count)')
      .order('created_at', { ascending: false })
      .limit(100),
  )
export const myMemberships = async (uid: string) =>
  unwrap<any[]>(await supabase.from('community_members').select('community_id,role').eq('user_id', uid))
export const getCommunity = async (id: string) => unwrap<any>(await supabase.from('communities').select('*').eq('id', id).single())
export const listMembers = async (id: string) =>
  unwrap<any[]>(
    await supabase
      .from('community_members')
      .select('user_id,role,profile:profiles!user_id(display_name,username)')
      .eq('community_id', id)
      .order('joined_at'),
  )
export const listChannels = async (id: string) =>
  unwrap<any[]>(await supabase.from('conversations').select('id,title').eq('community_id', id).eq('kind', 'channel'))

export const createCommunity = async (name: string, description: string, category: string) =>
  unwrap<string>(await supabase.rpc('create_community', { p_name: name, p_description: description, p_category: category }))
export const joinCommunity = async (id: string) => unwrap(await supabase.rpc('join_community', { p_id: id }))
export const leaveCommunity = async (id: string) => unwrap(await supabase.rpc('leave_community', { p_id: id }))
export const setRole = async (id: string, user: string, role: string) =>
  unwrap(await supabase.rpc('set_member_role', { p_id: id, p_user: user, p_role: role }))
export const kickMember = async (id: string, user: string) => unwrap(await supabase.rpc('kick_member', { p_id: id, p_user: user }))

export const listPosts = async (cid: string) =>
  unwrap<any[]>(
    await supabase
      .from('posts')
      .select('id,title,body,created_at,author_id,author:profiles!author_id(display_name),comments(count)')
      .eq('community_id', cid)
      .order('created_at', { ascending: false })
      .limit(50),
  )
export const createPost = async (cid: string, title: string, body: string) =>
  unwrap(await supabase.from('posts').insert({ community_id: cid, title, body }))
export const deletePost = async (id: string) => unwrap(await supabase.from('posts').delete().eq('id', id))
export const listComments = async (pid: string) =>
  unwrap<any[]>(
    await supabase
      .from('comments')
      .select('id,body,created_at,author_id,author:profiles!author_id(display_name)')
      .eq('post_id', pid)
      .order('created_at'),
  )
export const addComment = async (pid: string, body: string) => unwrap(await supabase.from('comments').insert({ post_id: pid, body }))
export const deleteComment = async (id: string) => unwrap(await supabase.from('comments').delete().eq('id', id))

export async function listFeed(uid: string) {
  const ids = (await myMemberships(uid)).map((m) => m.community_id)
  if (!ids.length) return []
  return unwrap<any[]>(
    await supabase
      .from('posts')
      .select('id,title,body,created_at,community_id,community:communities!community_id(name),author:profiles!author_id(display_name)')
      .in('community_id', ids)
      .order('created_at', { ascending: false })
      .limit(20),
  )
}

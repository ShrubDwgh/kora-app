import { supabase } from '../lib/supabase'
import { unwrap } from '../lib/unwrap'

export async function signUp(email: string, password: string, username: string, displayName: string) {
  const u = username.trim().toLowerCase()
  const free = unwrap<boolean>(await supabase.rpc('username_available', { p_username: u }))
  if (!free) throw new Error('Username sudah dipakai')
  unwrap(
    await supabase.auth.signUp({
      email,
      password,
      options: { data: { username: u, display_name: displayName.trim() }, emailRedirectTo: window.location.origin },
    }),
  )
}
export const signIn = async (email: string, password: string) =>
  unwrap(await supabase.auth.signInWithPassword({ email, password }))
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
export const requestReset = async (email: string) =>
  unwrap(await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` }))
export const updatePassword = async (password: string) => unwrap(await supabase.auth.updateUser({ password }))
export const updateProfile = async (id: string, patch: { display_name: string; status: string | null; bio: string | null }) =>
  unwrap(await supabase.from('profiles').update(patch).eq('id', id))

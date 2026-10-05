import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isConfigured = Boolean(url && key)

// Hanya anon key publik yang dipakai di browser; keamanan data dijaga oleh RLS di database.
export const supabase = createClient(url ?? 'https://not-configured.invalid', key ?? 'not-configured', {
  auth: { persistSession: true, autoRefreshToken: true },
})

import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'

type Ctx = { session: Session | null; profile: Profile | null; loading: boolean; reloadProfile: () => void }
const AuthCtx = createContext<Ctx>({ session: null, profile: null, loading: true, reloadProfile: () => {} })
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const uid = session?.user.id
  useEffect(() => {
    if (!uid) {
      setProfile(null)
      return
    }
    supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single()
      .then(({ data }) => setProfile(data as Profile | null))
  }, [uid, tick])

  return (
    <AuthCtx.Provider value={{ session, profile, loading, reloadProfile: () => setTick((t) => t + 1) }}>
      {children}
    </AuthCtx.Provider>
  )
}

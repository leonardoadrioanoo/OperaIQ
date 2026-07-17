"use client"

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setSession } = useAuthStore()

  useEffect(() => {
    // Busca a sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    // Escuta mudanças no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (event === 'SIGNED_IN' && session?.user) {
        // Atualiza último acesso
        await supabase.from('perfis').update({ ultimo_acesso: new Date().toISOString() }).eq('id', session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [setSession, setUser])

  return <>{children}</>
}

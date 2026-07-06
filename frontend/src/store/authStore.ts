import { create } from 'zustand'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export interface Profile {
  id: string
  nome_completo: string
  email: string
  cargo: string | null
  telefone_direto: string | null
  is_admin: boolean
  empresa_id: string | null
  foto_url: string | null
  permissoes?: Array<{
    modulo: string
    p_visualizar: boolean
    p_criar: boolean
    p_editar: boolean
    p_excluir: boolean
    p_aprovar: boolean
  }>
}

export interface Company {
  id: string
  nome_fantasia: string
  cnpj: string | null
  logo_url: string | null
}

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  company: Company | null
  isLoadingUserData: boolean
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  fetchUserData: (userId: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  profile: null,
  company: null,
  isLoadingUserData: false,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),

  fetchUserData: async (userId: string) => {
    set({ isLoadingUserData: true })
    try {
      // Tenta buscar o perfil e empresa na tabela relacional
      const { data, error } = await supabase
        .from('perfis')
        .select(`
          id,
          nome_completo,
          email,
          cargo,
          telefone_direto,
          is_admin,
          empresa_id,
          foto_url,
          perfil_permissoes (*),
          empresas (
            id,
            nome_fantasia,
            cnpj,
            logo_url
          )
        `)
        .eq('id', userId)
        .maybeSingle() // Não lança erro se não encontrar

      if (error) {
        console.error('Erro ao buscar perfil relacional:', error.message)
      }

      if (data) {
        // Sucesso: temos dados relacionais completos
        const profile: Profile = {
          id: data.id,
          nome_completo: data.nome_completo,
          email: data.email,
          cargo: data.cargo,
          telefone_direto: data.telefone_direto,
          is_admin: data.is_admin,
          empresa_id: data.empresa_id,
          foto_url: data.foto_url,
          permissoes: data.perfil_permissoes || []
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const empresaData = (data as any).empresas
        const company: Company | null = empresaData
          ? {
              id: empresaData.id,
              nome_fantasia: empresaData.nome_fantasia,
              cnpj: empresaData.cnpj,
              logo_url: empresaData.logo_url,
            }
          : null

        set({ profile, company })
      } else {
        // Fallback: conta existe no Auth mas não tem perfil relacional ainda
        // Lê o máximo possível do user_metadata do Supabase Auth
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const meta = user.user_metadata || {}
          const profile: Profile = {
            id: user.id,
            nome_completo: meta.nome_admin || meta.full_name || meta.name || user.email?.split('@')[0] || 'Usuário',
            email: user.email || '',
            cargo: meta.cargo_admin || meta.role || null,
            telefone_direto: meta.telefone_admin || null,
            is_admin: true,
            empresa_id: null,
            foto_url: null,
          }
          const company: Company | null = meta.empresa
            ? {
                id: 'temp',
                nome_fantasia: meta.empresa,
                cnpj: meta.cnpj || null,
                logo_url: null,
              }
            : null

          set({ profile, company })
        }
      }
    } finally {
      set({ isLoadingUserData: false })
    }
  },

  logout: () => set({ user: null, session: null, profile: null, company: null }),
}))

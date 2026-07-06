-- CORREÇÃO DE RLS: Adiciona política mais permissiva para leitura de empresa via join
-- Cole no SQL Editor do Supabase APÓS rodar o diagnóstico.

-- Remover policies antigas que podem estar conflitando
DROP POLICY IF EXISTS "Users can view own company" ON public.empresas;
DROP POLICY IF EXISTS "Users can view profiles in same company" ON public.perfis;
DROP POLICY IF EXISTS "Users can view own profile" ON public.perfis;
DROP POLICY IF EXISTS "Users can update own profile" ON public.perfis;

-- Recriar policies de Perfis
CREATE POLICY "perfis_select_own"
ON public.perfis FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "perfis_update_own"
ON public.perfis FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Recriar policy de Empresas (leitura baseada na empresa_id do perfil do usuário)
CREATE POLICY "empresas_select_by_member"
ON public.empresas FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT empresa_id FROM public.perfis
    WHERE id = auth.uid()
    AND empresa_id IS NOT NULL
  )
);

-- Garantir que service_role pode inserir sem restrição de RLS (já é default, mas explicitando)
CREATE POLICY "empresas_insert_service"
ON public.empresas FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "perfis_insert_service"
ON public.perfis FOR INSERT
TO service_role
WITH CHECK (true);

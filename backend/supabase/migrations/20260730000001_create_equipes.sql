-- =======================================================================================
-- Criação das tabelas do Módulo de Equipes
-- =======================================================================================

CREATE TABLE IF NOT EXISTS public.equipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    descricao TEXT,
    lider_id UUID REFERENCES public.perfis(id) ON DELETE SET NULL,
    departamento_id UUID REFERENCES public.departamentos(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'ativo',
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.equipe_integrantes (
    equipe_id UUID NOT NULL REFERENCES public.equipes(id) ON DELETE CASCADE,
    perfil_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
    papel VARCHAR(100) NOT NULL,
    data_entrada TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    data_saida TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (equipe_id, perfil_id)
);

-- Triggers de autoupdate
CREATE TRIGGER tg_equipes_atualizado_em BEFORE UPDATE ON public.equipes FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

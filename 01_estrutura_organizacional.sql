-- 1. DEPARTAMENTOS
CREATE TABLE public.departamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  sigla VARCHAR(50),
  descricao TEXT,
  gestor_id UUID REFERENCES public.perfis(id) ON DELETE SET NULL,
  centro_custo VARCHAR(100),
  departamento_superior_id UUID REFERENCES public.departamentos(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'ativo',
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CARGOS
CREATE TABLE public.cargos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  departamento_id UUID NOT NULL REFERENCES public.departamentos(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  nivel_hierarquico INTEGER DEFAULT 1,
  cargo_superior_id UUID REFERENCES public.cargos(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'ativo',
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. EQUIPES
CREATE TABLE public.equipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL, -- Time, Squad, Comite, etc
  descricao TEXT,
  lider_id UUID REFERENCES public.perfis(id) ON DELETE SET NULL,
  departamento_id UUID REFERENCES public.departamentos(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'ativo',
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. EQUIPE INTEGRANTES
CREATE TABLE public.equipe_integrantes (
  equipe_id UUID REFERENCES public.equipes(id) ON DELETE CASCADE,
  perfil_id UUID REFERENCES public.perfis(id) ON DELETE CASCADE,
  papel VARCHAR(100) NOT NULL,
  data_entrada DATE DEFAULT CURRENT_DATE,
  data_saida DATE,
  PRIMARY KEY (equipe_id, perfil_id)
);

-- RLS (Row Level Security) - Habilitar e Criar Políticas

ALTER TABLE public.departamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipe_integrantes ENABLE ROW LEVEL SECURITY;

-- Políticas: Apenas perfis da mesma empresa podem ver/editar
CREATE POLICY "Acesso por empresa_id - Departamentos" ON public.departamentos
  FOR ALL USING (
    empresa_id = (SELECT empresa_id FROM public.perfis WHERE id = auth.uid())
  );

CREATE POLICY "Acesso por empresa_id - Cargos" ON public.cargos
  FOR ALL USING (
    empresa_id = (SELECT empresa_id FROM public.perfis WHERE id = auth.uid())
  );

CREATE POLICY "Acesso por empresa_id - Equipes" ON public.equipes
  FOR ALL USING (
    empresa_id = (SELECT empresa_id FROM public.perfis WHERE id = auth.uid())
  );

CREATE POLICY "Acesso por equipe_id - Integrantes" ON public.equipe_integrantes
  FOR ALL USING (
    equipe_id IN (
      SELECT id FROM public.equipes 
      WHERE empresa_id = (SELECT empresa_id FROM public.perfis WHERE id = auth.uid())
    )
  );

-- Modificar a tabela Perfis para referenciar departamento e cargo em vez de texto livre
-- Adicionando as colunas relacionais. (Preservando as textuais antigas para evitar quebra imediata)
ALTER TABLE public.perfis 
ADD COLUMN IF NOT EXISTS departamento_id UUID REFERENCES public.departamentos(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS cargo_id UUID REFERENCES public.cargos(id) ON DELETE SET NULL;

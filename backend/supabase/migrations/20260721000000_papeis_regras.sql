-- Migration: Papéis (Hierarquia) e Regras Condicionais (ABAC)

-- 1. Tabela de Papéis (Hierarquia)
CREATE TABLE public.sys_papeis (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao text,
  nivel_hierarquia integer NOT NULL DEFAULT 50, -- Menor = mais poder (0 = Dono/Super Admin, 100 = Operacional)
  abrangencia text NOT NULL DEFAULT 'DEPARTAMENTO', -- Valores: GLOBAL, DEPARTAMENTO, EQUIPE, INDIVIDUAL
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Adicionar o relacionamento de papel em perfis (colaboradores)
ALTER TABLE public.perfis 
ADD COLUMN papel_id uuid REFERENCES public.sys_papeis(id) ON DELETE SET NULL;

-- 2. Tabela de Regras Condicionais (ABAC)
CREATE TABLE public.sys_regras_condicionais (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  modulo_alvo text NOT NULL, -- Ex: 'GLOBAL', 'Projetos', 'Usuários'
  tipo_condicao text NOT NULL, -- Ex: 'HORARIO', 'IP', 'PROPRIEDADE', 'CUSTOMIZADA'
  parametros jsonb NOT NULL DEFAULT '{}'::jsonb, -- Configurações da regra
  acao_bloqueio text NOT NULL DEFAULT 'Acesso negado por política de segurança.',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS (Segurança e Isolamento por Tenant)
ALTER TABLE public.sys_papeis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sys_regras_condicionais ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para Papéis
CREATE POLICY "sys_papeis_isolation" 
ON public.sys_papeis FOR ALL 
USING (empresa_id = (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()));

-- Políticas RLS para Regras Condicionais
CREATE POLICY "sys_regras_isolation" 
ON public.sys_regras_condicionais FOR ALL 
USING (empresa_id = (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()));

-- Função de autoupdate para updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers de Autoupdate (updated_at)
CREATE TRIGGER handle_updated_at_papeis BEFORE UPDATE ON public.sys_papeis
FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at_regras BEFORE UPDATE ON public.sys_regras_condicionais
FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

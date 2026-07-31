import { EmpresaRepository } from '../repositories/empresa.repository';
import { UpdateEmpresaDTO } from '../models/empresa.model';
import { z } from 'zod';

const updateEmpresaSchema = z.object({
  nome_fantasia: z.string().min(2).optional(),
  razao_social: z.string().nullable().optional().or(z.literal('')),
  setor: z.string().nullable().optional().or(z.literal('')),
  telefone: z.string().nullable().optional().or(z.literal('')),
  telefone_secundario: z.string().nullable().optional().or(z.literal('')),
  email_corporativo: z.union([z.string().email(), z.string().length(0)]).nullable().optional(),
  site: z.string().nullable().optional().or(z.literal('')),
  responsavel_legal: z.string().nullable().optional().or(z.literal('')),
  inscricao_estadual: z.string().nullable().optional().or(z.literal('')),
  inscricao_municipal: z.string().nullable().optional().or(z.literal('')),
  ramo_atividade: z.string().nullable().optional().or(z.literal('')),
  porte_empresa: z.string().nullable().optional().or(z.literal('')),
  cep: z.string().nullable().optional().or(z.literal('')),
  logradouro: z.string().nullable().optional().or(z.literal('')),
  numero: z.string().nullable().optional().or(z.literal('')),
  complemento: z.string().nullable().optional().or(z.literal('')),
  bairro: z.string().nullable().optional().or(z.literal('')),
  cidade: z.string().nullable().optional().or(z.literal('')),
  uf: z.string().max(2).nullable().optional().or(z.literal('')),
  pais: z.string().nullable().optional().or(z.literal('')),
  idioma: z.string().nullable().optional().or(z.literal('')),
  fuso_horario: z.string().nullable().optional().or(z.literal('')),
  moeda: z.string().nullable().optional().or(z.literal('')),
  logo_url: z.string().nullable().optional().or(z.literal('')),
  
  // Notificações Globais da Empresa
  notificacoes_email: z.boolean().nullable().optional(),
  notificacoes_push: z.boolean().nullable().optional(),
  resumo_diario: z.boolean().nullable().optional(),
  resumo_semanal: z.boolean().nullable().optional(),
  notificacao_tarefa_atribuida: z.boolean().nullable().optional(),
  notificacao_mencao_comentario: z.boolean().nullable().optional(),
  notificacao_alteracao_status: z.boolean().nullable().optional(),
  notificacao_registro_atividade: z.boolean().nullable().optional(),
  
  mfa_obrigatorio: z.boolean().nullable().optional(),
  mfa_dias_carencia: z.number().int().min(0).nullable().optional(),
  mfa_publico_alvo: z.enum(['TODOS', 'ADMINS']).nullable().optional(),
});

export class EmpresaService {
  private repo: EmpresaRepository;

  constructor() {
    this.repo = new EmpresaRepository();
  }

  async getByUserId(userId: string) {
    const empresa = await this.repo.findByUserId(userId);
    if (!empresa) throw new Error('Empresa não encontrada para este usuário.');

    const members = await this.repo.countMembers(empresa.id);
    return { ...empresa, membros: members };
  }

  async update(userId: string, payload: unknown) {
    const validated = updateEmpresaSchema.parse(payload);

    // Buscar empresa do usuário para garantir que ele só edita a sua
    const empresa = await this.repo.findByUserId(userId);
    if (!empresa) throw new Error('Empresa não encontrada.');

    return this.repo.update(empresa.id, validated as UpdateEmpresaDTO);
  }

  async configurarSSO(userId: string, payload: any) {
    const ssoSchema = z.object({
      samlEntityId: z.string().min(5),
      samlMetadataUrl: z.string().url(),
      samlDomains: z.string().min(3),
      samlAtivo: z.boolean().default(true)
    });

    const validated = ssoSchema.parse(payload);
    
    const empresa = await this.repo.findByUserId(userId);
    if (!empresa) throw new Error('Empresa não encontrada.');

    // 1. Aqui é onde registraríamos via API do Supabase Admin
    // const ssoProvider = await supabaseAdmin.auth.admin.createSSOProvider({
    //   type: 'saml',
    //   domains: validated.samlDomains.split(',').map(d => d.trim()),
    //   metadata_url: validated.samlMetadataUrl,
    //   entity_id: validated.samlEntityId
    // });
    
    // 2. Salva as configurações de forma persistente no banco de dados
    const updated = await this.repo.update(empresa.id, {
      saml_entity_id: validated.samlEntityId,
      saml_metadata_url: validated.samlMetadataUrl,
      saml_domains: validated.samlDomains,
      saml_ativo: validated.samlAtivo
    });

    return updated;
  }
}

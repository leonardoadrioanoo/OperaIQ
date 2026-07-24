import { EmpresaRepository } from '../repositories/empresa.repository';
import { UpdateEmpresaDTO } from '../models/empresa.model';
import { z } from 'zod';

const updateEmpresaSchema = z.object({
  nome_fantasia: z.string().min(2).optional(),
  razao_social: z.string().optional(),
  setor: z.string().optional(),
  telefone: z.string().optional(),
  telefone_secundario: z.string().optional().or(z.literal('')),
  email_corporativo: z.string().email().optional(),
  site: z.string().optional().or(z.literal('')),
  responsavel_legal: z.string().optional(),
  inscricao_estadual: z.string().optional().or(z.literal('')),
  inscricao_municipal: z.string().optional().or(z.literal('')),
  ramo_atividade: z.string().optional().or(z.literal('')),
  porte_empresa: z.string().optional().or(z.literal('')),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional().or(z.literal('')),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().max(2).optional(),
  pais: z.string().optional(),
  idioma: z.string().optional(),
  fuso_horario: z.string().optional(),
  moeda: z.string().optional(),
  
  // Notificações Globais da Empresa
  notificacoes_email: z.boolean().optional(),
  notificacoes_push: z.boolean().optional(),
  resumo_diario: z.boolean().optional(),
  resumo_semanal: z.boolean().optional(),
  notificacao_tarefa_atribuida: z.boolean().optional(),
  notificacao_mencao_comentario: z.boolean().optional(),
  notificacao_alteracao_status: z.boolean().optional(),
  notificacao_registro_atividade: z.boolean().optional(),
  
  mfa_obrigatorio: z.boolean().optional(),
  mfa_dias_carencia: z.number().int().min(0).optional(),
  mfa_publico_alvo: z.enum(['TODOS', 'ADMINS']).optional(),
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

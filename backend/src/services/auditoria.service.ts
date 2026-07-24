import { supabaseAdmin } from '../config/supabase';

export class AuditoriaService {
  /**
   * Registra uma ação no Audit Trail
   */
  static async log(payload: {
    empresa_id: string;
    ator_id: string;
    acao: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'OTHER';
    entidade: string;
    entidade_id?: string;
    detalhes?: any;
    nivel?: 'INFO' | 'WARNING' | 'CRITICAL';
  }) {
    try {
      const { error } = await supabaseAdmin
        .from('sys_auditoria')
        .insert([{
          ...payload,
          detalhes: payload.detalhes || {},
          nivel: payload.nivel || 'INFO'
        }]);
      
      if (error) {
        console.error('[AuditoriaService] Erro ao registrar log:', error.message);
      }
    } catch (err) {
      console.error('[AuditoriaService] Falha crítica:', err);
    }
  }
}

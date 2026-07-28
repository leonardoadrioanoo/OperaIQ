import { Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthRequest } from '../middlewares/authMiddleware';

export class ObjetivoController {
  static async listar(req: AuthRequest, res: Response) {
    try {
      const empresa_id = req.userProfile?.empresa_id;
      if (!empresa_id) return res.status(403).json({ error: 'Empresa não encontrada no perfil' });

      const { data, error } = await supabaseAdmin
        .from('sys_objetivos')
        .select(`
          *,
          owner:perfis(id, nome_completo, cargo),
          krs:sys_key_results(*)
        `)
        .eq('empresa_id', empresa_id)
        .order('criado_em', { ascending: false });

      if (error) throw error;

      return res.status(200).json({ objetivos: data });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async criarObjetivo(req: AuthRequest, res: Response) {
    try {
      const empresa_id = req.userProfile?.empresa_id;
      if (!empresa_id) return res.status(403).json({ error: 'Empresa não encontrada no perfil' });

      const owner_id = req.body.owner_id || req.userProfile?.id;
      const { titulo, categoria, prazo, portfolio_id } = req.body;

      const { data, error } = await supabaseAdmin
        .from('sys_objetivos')
        .insert([{ empresa_id, titulo, categoria, owner_id, prazo, portfolio_id }])
        .select(`
          *,
          owner:perfis(id, nome_completo, cargo),
          krs:sys_key_results(*)
        `)
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async criarKeyResult(req: AuthRequest, res: Response) {
    try {
      // Add standard checks if needed, but for simplicity assuming the user has access
      const { objetivo_id, titulo, alvo, unidade } = req.body;

      const { data, error } = await supabaseAdmin
        .from('sys_key_results')
        .insert([{ objetivo_id, titulo, alvo, unidade }])
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async atualizarProgressKR(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { progresso } = req.body;

      const { data, error } = await supabaseAdmin
        .from('sys_key_results')
        .update({ progresso })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json(data);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}

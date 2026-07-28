import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { supabaseAdmin } from '../config/supabase';

export class NotificacaoController {
  
  // Lista notificações do usuário logado
  listar = async (req: AuthRequest, res: Response) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('sys_notificacoes')
        .select('*')
        .eq('usuario_id', req.userId)
        .order('criado_em', { ascending: false })
        .limit(50); // Pega as últimas 50

      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  // Marca uma notificação como lida
  marcarLida = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      const { data, error } = await supabaseAdmin
        .from('sys_notificacoes')
        .update({ lida: true })
        .eq('id', id)
        .eq('usuario_id', req.userId) // Garantir que só ele pode marcar a própria notificação
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  };

  // Marcar todas como lidas
  marcarTodasLidas = async (req: AuthRequest, res: Response) => {
    try {
      const { error } = await supabaseAdmin
        .from('sys_notificacoes')
        .update({ lida: true })
        .eq('usuario_id', req.userId)
        .eq('lida', false);

      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  };
}

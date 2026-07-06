import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';

export interface AuthRequest extends Request {
  userId?: string;
  userProfile?: {
    id: string;
    is_admin: boolean;
    empresa_id: string;
    permissoes: Array<{
      modulo: string;
      p_visualizar: boolean;
      p_criar: boolean;
      p_editar: boolean;
      p_excluir: boolean;
      p_aprovar: boolean;
    }>;
  };
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  const token = authHeader.split(' ')[1];

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }

  req.userId = data.user.id;

  // Busca o perfil relacional e as permissões
  const { data: perfil } = await supabaseAdmin
    .from('perfis')
    .select('id, is_admin, empresa_id, perfil_permissoes(*)')
    .eq('id', req.userId)
    .single();

  if (perfil) {
    req.userProfile = {
      id: perfil.id,
      is_admin: perfil.is_admin,
      empresa_id: perfil.empresa_id,
      permissoes: perfil.perfil_permissoes || []
    };
  }

  next();
}

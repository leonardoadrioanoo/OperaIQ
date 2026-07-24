import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { logSecurityEvent } from './security.middleware';

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
    logSecurityEvent('MISSING_TOKEN', req);
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  const token = authHeader.split(' ')[1];

  // Tokens JWT válidos têm entre 100 e 4000 caracteres
  if (token.length < 100 || token.length > 4000) {
    logSecurityEvent('MALFORMED_TOKEN', req, { tokenLength: token.length });
    return res.status(401).json({ error: 'Token inválido.' });
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    logSecurityEvent('INVALID_TOKEN', req, { error: error?.message });
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }

  req.userId = data.user.id;

  // Busca o perfil relacional e as permissões (em paralelo com a validação do token)
  try {
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
  } catch (profileError) {
    // Não bloqueia a request se o perfil não for encontrado
    // O controller vai lidar com a ausência de perfil se necessário
  }

  next();
}

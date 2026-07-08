import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.userProfile) {
    return res.status(403).json({ error: 'Perfil não encontrado ou acesso negado.' });
  }

  if (req.userProfile.is_admin) {
    return next();
  }

  return res.status(403).json({ error: 'Acesso negado: Requer privilégios de administrador.' });
}

type Acao = 'p_visualizar' | 'p_criar' | 'p_editar' | 'p_excluir' | 'p_aprovar' | 'p_exportar' | 'p_importar' | 'p_gerenciar';

export function requirePermission(modulo: string, acao: Acao) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userProfile) {
      return res.status(403).json({ error: 'Perfil não encontrado ou acesso negado.' });
    }

    // Administradores têm acesso a tudo
    if (req.userProfile.is_admin) {
      return next();
    }

    // Procura a permissão específica no módulo requisitado
    const permissao = req.userProfile.permissoes.find(p => p.modulo === modulo);

    if (permissao && permissao[acao] === true) {
      return next();
    }

    return res.status(403).json({ error: `Acesso negado: Sem permissão para ${acao} no módulo ${modulo}.` });
  };
}

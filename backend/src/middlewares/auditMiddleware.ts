import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';
import { AuditoriaService } from '../services/auditoria.service';

/**
 * Middleware global que intercepta requisições de mutação (POST, PUT, DELETE, PATCH)
 * e registra no log de auditoria automaticamente.
 */
export const auditMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Apenas registrar requisições que alteram estado
  if (['GET', 'OPTIONS', 'HEAD'].includes(req.method)) {
    return next();
  }

  // Interceptar a resposta para pegar o status code
  const originalSend = res.send;
  let responseBody: any;

  res.send = function (body) {
    responseBody = body;
    return originalSend.call(this, body);
  };

  res.on('finish', () => {
    // Apenas logar se houver usuário autenticado e a requisição for um sucesso
    if (res.statusCode >= 200 && res.statusCode < 300 && req.userProfile && req.userProfile.empresa_id) {
      
      let acao: 'CREATE' | 'UPDATE' | 'DELETE' | 'OTHER' = 'OTHER';
      if (req.method === 'POST') acao = 'CREATE';
      if (req.method === 'PUT' || req.method === 'PATCH') acao = 'UPDATE';
      if (req.method === 'DELETE') acao = 'DELETE';

      // Determinar a entidade baseada na URL. Ex: /api/departamentos/123 -> DEPARTAMENTOS
      const pathParts = req.originalUrl.split('?')[0].split('/').filter(Boolean);
      // ex: ['api', 'departamentos', '123']
      let entidade = 'SISTEMA';
      let entidade_id = undefined;

      if (pathParts.length >= 2 && pathParts[0] === 'api') {
        entidade = pathParts[1].toUpperCase(); // ex: DEPARTAMENTOS
        if (pathParts[2] && pathParts[2] !== 'me') {
          entidade_id = pathParts[2];
        }
      }

      // Payload seguro (sem senhas)
      const safeBody = { ...req.body };
      if (safeBody.senha) delete safeBody.senha;
      if (safeBody.password) delete safeBody.password;

      AuditoriaService.log({
        empresa_id: req.userProfile!.empresa_id,
        ator_id: req.userProfile!.id,
        acao,
        entidade,
        entidade_id,
        detalhes: {
          endpoint: req.originalUrl,
          method: req.method,
          payload: safeBody,
          ip: req.ip || req.headers['x-forwarded-for'],
          user_agent: req.headers['user-agent']
        }
      });
    }
  });

  next();
};

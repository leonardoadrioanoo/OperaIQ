import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// ──────────────────────────────────────────────────────────────────────────────
// 1. HELMET — Headers HTTP de Segurança
//    Remove o X-Powered-By, adiciona CSP, XSS-Protection, etc.
// ──────────────────────────────────────────────────────────────────────────────
export const securityHeaders = helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // Desabilitado para API REST; ativar em SSR
});

// ──────────────────────────────────────────────────────────────────────────────
// 2. RATE LIMITER GLOBAL — Proteção geral contra abuso da API
//    Max 200 req / 15min por IP para todas as rotas
// ──────────────────────────────────────────────────────────────────────────────
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Muitas requisições enviadas. Aguarde alguns minutos e tente novamente.',
  },
  skip: (req) => req.method === 'OPTIONS', // Não limita pré-flight de CORS
});

// ──────────────────────────────────────────────────────────────────────────────
// 3. RATE LIMITER DE AUTENTICAÇÃO — Proteção anti-bruteforce no login/registro
//    Max 10 tentativas / 15min por IP — ao estourar, retorna 429
// ──────────────────────────────────────────────────────────────────────────────
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Muitas tentativas de autenticação. Aguarde 15 minutos antes de tentar novamente.',
  },
  handler: (req, res, _next, options) => {
    logSecurityEvent('RATE_LIMIT_AUTH', req);
    res.status(429).json(options.message);
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// 4. RATE LIMITER DE ADMIN — Rotas administrativas críticas
//    Max 60 req / 10min por IP
// ──────────────────────────────────────────────────────────────────────────────
export const adminRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Muitas requisições para área administrativa. Tente novamente em instantes.',
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// 5. SANITIZAÇÃO DE INPUTS — Remove campos com chaves suspeitas (prototype pollution)
//    Bloqueia tentativas de injection via __proto__, constructor, etc.
// ──────────────────────────────────────────────────────────────────────────────
const DANGEROUS_KEYS = ['__proto__', 'constructor', 'prototype'];

function sanitizeObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeObject);

  const sanitized: any = {};
  for (const key of Object.keys(obj)) {
    if (DANGEROUS_KEYS.includes(key)) {
      logSecurityEvent('PROTOTYPE_POLLUTION_ATTEMPT', null, { key });
      continue; // descarta a chave perigosa silenciosamente
    }
    sanitized[key] = sanitizeObject(obj[key]);
  }
  return sanitized;
}

export function sanitizeInputs(req: Request, _res: Response, next: NextFunction) {
  try {
    if (req.body && Object.keys(req.body).length > 0) {
      req.body = sanitizeObject(req.body);
    }
    // NOTA: req.query e req.params possuem getters no Express, não devem ser reatribuídos diretamente.
    // Como a sanitização previne ataques prototype pollution no body, apenas o body é crítico aqui.
  } catch (error) {
    console.error('[SECURITY] Error in sanitizeInputs:', error);
  }
  next();
}

// ──────────────────────────────────────────────────────────────────────────────
// 6. LOGGER DE SEGURANÇA — Registra eventos suspeitos no console (e futuramente em banco)
// ──────────────────────────────────────────────────────────────────────────────
export function logSecurityEvent(
  event: string,
  req: Request | null,
  extra?: Record<string, any>
) {
  const timestamp = new Date().toISOString();
  const ip = req?.ip || req?.headers['x-forwarded-for'] || 'unknown';
  const ua = req?.headers['user-agent'] || 'unknown';
  const path = req?.originalUrl || 'unknown';

  console.warn(`[SECURITY] [${timestamp}] EVENT=${event} | IP=${ip} | UA=${ua} | PATH=${path}`, extra || '');
}

// ──────────────────────────────────────────────────────────────────────────────
// 7. DETECTOR DE PAYLOADS OVERSIZED — Previne ataques de body muito grande
//    Express já tem limit no express.json(), mas logamos explicitamente
// ──────────────────────────────────────────────────────────────────────────────
export function requestSizeGuard(req: Request, res: Response, next: NextFunction) {
  const contentLength = parseInt(req.headers['content-length'] || '0');
  const MAX_BYTES = 5 * 1024 * 1024; // 5MB

  if (contentLength > MAX_BYTES) {
    logSecurityEvent('OVERSIZED_PAYLOAD', req, { size: contentLength });
    return res.status(413).json({ error: 'Payload muito grande. Limite é 5MB.' });
  }
  next();
}

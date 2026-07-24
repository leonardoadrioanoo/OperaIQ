import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import empresaRoutes from './routes/empresa.routes';
import perfilRoutes from './routes/perfil.routes';
import colaboradorRoutes from './routes/colaborador.routes';
import departamentoRoutes from './routes/departamento.routes';
import cargoRoutes from './routes/cargo.routes';
import equipeRoutes from './routes/equipe.routes';
import rbacRoutes from './routes/rbac.routes';
import documentosRoutes from './routes/documentos.routes';
import auditoriaRoutes from './routes/auditoria.routes';
import infraestruturaRoutes from './routes/infraestrutura.routes';
import dashboardsRoutes from './routes/dashboards.routes';
import projetosRoutes from './routes/projetos.routes';
import { auditMiddleware } from './middlewares/auditMiddleware';
import {
  securityHeaders,
  globalRateLimiter,
  authRateLimiter,
  adminRateLimiter,
  sanitizeInputs,
  requestSizeGuard,
} from './middlewares/security.middleware';

const app = express();

// ── SEGURANÇA: Headers HTTP, ocultação de X-Powered-By ────────────────────────
app.use(securityHeaders);
app.disable('x-powered-by'); // Garante remoção mesmo sem Helmet

// ── CORS: Origens explicitamente permitidas ───────────────────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://192.168.11.210:3000',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Permite requests sem origin (Postman, mobile apps, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin '${origin}' não permitida.`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// ── RATE LIMITER GLOBAL ────────────────────────────────────────────────────────
app.use(globalRateLimiter);

// ── BODY PARSER com limite de tamanho ─────────────────────────────────────────
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// ── GUARD de payload oversized + sanitização de inputs ──────────────────────
app.use(requestSizeGuard);
app.use(sanitizeInputs);

// ── ROTAS: Limiter de auth aplicado nas rotas de login/registro ───────────────
app.use('/api/auth', authRateLimiter, authRoutes);

// Applica o interceptador de auditoria para todas as rotas dali pra baixo
app.use(auditMiddleware);

app.use('/api/empresa', empresaRoutes);
app.use('/api/perfil', perfilRoutes);
app.use('/api/colaboradores', adminRateLimiter, colaboradorRoutes);
app.use('/api/departamentos', departamentoRoutes);
app.use('/api/cargos', cargoRoutes);
app.use('/api/equipes', equipeRoutes);
app.use('/api/rbac', adminRateLimiter, rbacRoutes);
app.use('/api/empresa/documentos', documentosRoutes);
app.use('/api/auditoria', auditoriaRoutes);
app.use('/api/infraestrutura', infraestruturaRoutes);
app.use('/api/dashboards', dashboardsRoutes);
app.use('/api/projetos', projetosRoutes);

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

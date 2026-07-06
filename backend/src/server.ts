import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import empresaRoutes from './routes/empresa.routes';
import perfilRoutes from './routes/perfil.routes';
import colaboradorRoutes from './routes/colaborador.routes';
import departamentoRoutes from './routes/departamento.routes';
import cargoRoutes from './routes/cargo.routes';
import equipeRoutes from './routes/equipe.routes';

const app = express();

// Permite requisições vindas do frontend (Next.js)
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://192.168.11.210:3000'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/empresa', empresaRoutes);
app.use('/api/perfil', perfilRoutes);
app.use('/api/colaboradores', colaboradorRoutes);
app.use('/api/departamentos', departamentoRoutes);
app.use('/api/cargos', cargoRoutes);
app.use('/api/equipes', equipeRoutes);

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

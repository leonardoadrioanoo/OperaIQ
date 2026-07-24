import { Router } from 'express';
import os from 'os';
import { supabaseAdmin } from '../config/supabase';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireAdmin } from '../middlewares/rbacMiddleware';

const router = Router();

router.get('/status', authMiddleware, requireAdmin, async (req, res) => {
  try {
    // 1. Calcular Uso de CPU
    const cpus = os.cpus();
    const cpuModel = cpus[0].model;
    const cpuCores = cpus.length;
    const loadAvg = os.loadavg(); // Array com média de load (1, 5, 15 min)

    // 2. Calcular Uso de Memória do Servidor
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memPercentage = (usedMem / totalMem) * 100;

    // Uso de Memória do Processo Node (V8)
    const processMem = process.memoryUsage();
    
    // 3. Tempo de Atividade (Uptime)
    const systemUptime = os.uptime(); // em segundos
    const processUptime = process.uptime(); // em segundos

    // 4. Latência do Banco de Dados (Supabase PostgreSQL)
    const startDb = performance.now();
    let dbStatus = 'ONLINE';
    let dbError = null;
    try {
      // Faz uma query real ultra-leve apenas para medir a resposta da rede/banco
      await supabaseAdmin.from('empresas').select('id').limit(1);
    } catch (err: any) {
      dbStatus = 'OFFLINE';
      dbError = err.message;
    }
    const endDb = performance.now();
    const dbLatencyMs = endDb - startDb;

    res.json({
      timestamp: new Date().toISOString(),
      servidor: {
        plataforma: os.platform(),
        arquitetura: os.arch(),
        node_version: process.version,
        uptime_segundos: systemUptime,
        process_uptime_segundos: processUptime,
      },
      cpu: {
        modelo: cpuModel,
        nucleos: cpuCores,
        uso_1m: loadAvg[0],
        uso_5m: loadAvg[1],
        uso_15m: loadAvg[2],
      },
      memoria: {
        total_gb: (totalMem / 1024 / 1024 / 1024).toFixed(2),
        usada_gb: (usedMem / 1024 / 1024 / 1024).toFixed(2),
        livre_gb: (freeMem / 1024 / 1024 / 1024).toFixed(2),
        porcentagem_uso: memPercentage.toFixed(1),
        processo_mb: (processMem.heapUsed / 1024 / 1024).toFixed(2),
      },
      banco_dados: {
        provedor: 'Supabase / PostgreSQL',
        status: dbStatus,
        latencia_ms: Math.round(dbLatencyMs),
        erro: dbError
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

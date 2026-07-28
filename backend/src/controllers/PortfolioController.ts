import { Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthRequest } from '../middlewares/authMiddleware';

export class PortfolioController {
  static async listar(req: AuthRequest, res: Response) {
    try {
      const empresa_id = req.userProfile?.empresa_id;
      if (!empresa_id) return res.status(403).json({ error: 'Empresa não encontrada no perfil' });

      const { data: portfolios, error } = await supabaseAdmin
        .from('sys_portfolios')
        .select(`
          *,
          sponsor:perfis(id, nome_completo, cargo)
        `)
        .eq('empresa_id', empresa_id)
        .order('criado_em', { ascending: false });

      if (error) throw error;

      // Buscar todos os projetos da empresa que estão atrelados a algum portfólio
      const { data: projetos } = await supabaseAdmin
        .from('sys_projetos')
        .select('id, portfolio_id, status, orcamento_previsto')
        .eq('empresa_id', empresa_id)
        .not('portfolio_id', 'is', null);

      const enrichedPortfolios = portfolios.map(port => {
        const portProjetos = projetos?.filter(p => p.portfolio_id === port.id) || [];
        
        const activeProjects = portProjetos.length;
        
        // Summing the budgets of all linked projects to see how much of the portfolio's budget is committed/consumed
        const consumed = portProjetos.reduce((acc, p) => acc + (Number(p.orcamento_previsto) || 0), 0);
        
        // Calculating progress: % of projects that are 'Concluído'
        const concluido = portProjetos.filter(p => p.status === 'Concluído').length;
        const progress = activeProjects > 0 ? Math.round((concluido / activeProjects) * 100) : 0;

        return {
          ...port,
          activeProjects,
          consumed,
          progress,
          sparkline: [0, 0, 0, 0, 0, 0, 0] // Will be implemented in Phase 3 (Time-series data)
        };
      });

      return res.status(200).json({ portfolios: enrichedPortfolios });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async criar(req: AuthRequest, res: Response) {
    try {
      const empresa_id = req.userProfile?.empresa_id;
      if (!empresa_id) return res.status(403).json({ error: 'Empresa não encontrada no perfil' });

      // O criador do portfólio será o sponsor por padrão se não for enviado
      const sponsor_id = req.body.sponsor_id || req.userProfile?.id;
      const { titulo, descricao, orcamento_alocado } = req.body;

      const { data, error } = await supabaseAdmin
        .from('sys_portfolios')
        .insert([{ empresa_id, titulo, descricao, orcamento_alocado, sponsor_id }])
        .select()
        .single();

      if (error) {
        console.error('SUPABASE DB ERROR:', error);
        throw error;
      }
      return res.status(201).json(data);
    } catch (err: any) {
      console.error('CATCH ERRO PORTFOLIO CREATE:', err);
      return res.status(500).json({ error: err.message || JSON.stringify(err) });
    }
  }

  static async buscarPorId(req: AuthRequest, res: Response) {
    try {
      const empresa_id = req.userProfile?.empresa_id;
      if (!empresa_id) return res.status(403).json({ error: 'Empresa não encontrada no perfil' });
      
      const { id } = req.params;

      const { data: portfolio, error } = await supabaseAdmin
        .from('sys_portfolios')
        .select(`
          *,
          sponsor:perfis(id, nome_completo, cargo)
        `)
        .eq('id', id)
        .eq('empresa_id', empresa_id)
        .single();

      if (error) throw error;
      if (!portfolio) return res.status(404).json({ error: 'Portfólio não encontrado' });

      // Buscar Projetos vinculados
      const { data: projetos } = await supabaseAdmin
        .from('sys_projetos')
        .select('id, titulo, status, orcamento_previsto, prioridade')
        .eq('portfolio_id', id);

      // Buscar OKRs vinculados
      const { data: objetivos } = await supabaseAdmin
        .from('sys_objetivos')
        .select(`
          *,
          krs:sys_key_results(id, titulo, progresso, alvo, unidade, status)
        `)
        .eq('portfolio_id', id);

      // Calcular KPIs para o detalhe
      const activeProjects = projetos?.length || 0;
      const consumed = projetos?.reduce((acc, p) => acc + (Number(p.orcamento_previsto) || 0), 0) || 0;
      const concluido = projetos?.filter(p => p.status === 'Concluído').length || 0;
      const progress = activeProjects > 0 ? Math.round((concluido / activeProjects) * 100) : 0;

      const fullData = {
        ...portfolio,
        projetos: projetos || [],
        objetivos: objetivos || [],
        kpis: { activeProjects, consumed, progress }
      };

      return res.status(200).json(fullData);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async atualizar(req: AuthRequest, res: Response) {
    try {
      const empresa_id = req.userProfile?.empresa_id;
      if (!empresa_id) return res.status(403).json({ error: 'Empresa não encontrada no perfil' });
      
      const { id } = req.params;
      const { titulo, descricao, orcamento_alocado, sponsor_id, status } = req.body;

      const { data, error } = await supabaseAdmin
        .from('sys_portfolios')
        .update({ titulo, descricao, orcamento_alocado, sponsor_id, status })
        .eq('id', id)
        .eq('empresa_id', empresa_id)
        .select(`
          *,
          sponsor:perfis(id, nome_completo, cargo)
        `)
        .single();

      if (error) throw error;
      if (!data) return res.status(404).json({ error: 'Portfólio não encontrado' });

      return res.status(200).json(data);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async deletar(req: AuthRequest, res: Response) {
    try {
      const empresa_id = req.userProfile?.empresa_id;
      if (!empresa_id) return res.status(403).json({ error: 'Empresa não encontrada no perfil' });
      
      const { id } = req.params;

      // The database has ON DELETE SET NULL for projects, so it's safe to delete.
      const { error } = await supabaseAdmin
        .from('sys_portfolios')
        .delete()
        .eq('id', id)
        .eq('empresa_id', empresa_id);

      if (error) throw error;

      return res.status(204).send();
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}

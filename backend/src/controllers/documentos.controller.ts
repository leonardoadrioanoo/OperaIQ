import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { supabaseAdmin } from '../config/supabase';

const BUCKET = 'empresa-documentos';

// Categorias permitidas
const CATEGORIAS_VALIDAS = [
  'contrato_social',
  'alvara',
  'certidao',
  'procuracao',
  'outros',
];

export const documentosController = {
  // GET /api/empresa/documentos — Lista todos documentos da empresa
  listar: async (req: AuthRequest, res: Response) => {
    try {
      const empresaId = req.userProfile?.empresa_id;
      if (!empresaId) return res.status(403).json({ error: 'Empresa não identificada.' });

      const { data, error } = await supabaseAdmin
        .from('empresa_documentos')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('criado_em', { ascending: false });

      if (error) throw error;
      return res.json(data);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  // POST /api/empresa/documentos/upload — Faz upload de um documento
  upload: async (req: AuthRequest, res: Response) => {
    try {
      const empresaId = req.userProfile?.empresa_id;
      if (!empresaId) return res.status(403).json({ error: 'Empresa não identificada.' });

      const { nome, categoria, descricao, validade } = req.body;
      const file = (req as any).file;

      if (!file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
      if (!nome) return res.status(400).json({ error: 'Nome do documento é obrigatório.' });
      if (!categoria || !CATEGORIAS_VALIDAS.includes(categoria)) {
        return res.status(400).json({ error: 'Categoria inválida.' });
      }

      const ext = file.originalname.split('.').pop();
      const storagePath = `${empresaId}/${categoria}/${Date.now()}_${file.originalname}`;

      // Faz upload para o Supabase Storage
      const { error: storageError } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (storageError) throw storageError;

      // Gera URL pública (ou assinada se bucket for privado)
      const { data: urlData } = supabaseAdmin.storage
        .from(BUCKET)
        .getPublicUrl(storagePath);

      // Salva referência no banco
      const { data, error } = await supabaseAdmin
        .from('empresa_documentos')
        .insert({
          empresa_id: empresaId,
          nome,
          categoria,
          descricao: descricao || null,
          validade: validade || null,
          storage_path: storagePath,
          url: urlData.publicUrl,
          tamanho_bytes: file.size,
          mime_type: file.mimetype,
          enviado_por: req.userId,
        })
        .select()
        .single();

      if (error) {
        // Rollback do storage se falhou no banco
        await supabaseAdmin.storage.from(BUCKET).remove([storagePath]);
        throw error;
      }

      return res.status(201).json(data);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  // DELETE /api/empresa/documentos/:id — Remove documento
  remover: async (req: AuthRequest, res: Response) => {
    try {
      const empresaId = req.userProfile?.empresa_id;
      if (!empresaId) return res.status(403).json({ error: 'Empresa não identificada.' });

      const { id } = req.params;

      // Busca o documento para pegar o path
      const { data: doc, error: fetchError } = await supabaseAdmin
        .from('empresa_documentos')
        .select('storage_path, empresa_id')
        .eq('id', id)
        .single();

      if (fetchError || !doc) return res.status(404).json({ error: 'Documento não encontrado.' });
      if (doc.empresa_id !== empresaId) return res.status(403).json({ error: 'Sem permissão.' });

      // Remove do storage
      await supabaseAdmin.storage.from(BUCKET).remove([doc.storage_path]);

      // Remove do banco
      const { error: deleteError } = await supabaseAdmin
        .from('empresa_documentos')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      return res.json({ message: 'Documento removido com sucesso.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  // GET /api/empresa/documentos/:id/download — Gera URL temporária de download
  download: async (req: AuthRequest, res: Response) => {
    try {
      const empresaId = req.userProfile?.empresa_id;
      if (!empresaId) return res.status(403).json({ error: 'Empresa não identificada.' });

      const { id } = req.params;

      const { data: doc, error } = await supabaseAdmin
        .from('empresa_documentos')
        .select('storage_path, empresa_id, nome')
        .eq('id', id)
        .single();

      if (error || !doc) return res.status(404).json({ error: 'Documento não encontrado.' });
      if (doc.empresa_id !== empresaId) return res.status(403).json({ error: 'Sem permissão.' });

      // Gera URL assinada com 60 minutos de validade
      const { data: signedData, error: signedError } = await supabaseAdmin.storage
        .from(BUCKET)
        .createSignedUrl(doc.storage_path, 3600);

      if (signedError) throw signedError;

      return res.json({ url: signedData.signedUrl, nome: doc.nome });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },
};

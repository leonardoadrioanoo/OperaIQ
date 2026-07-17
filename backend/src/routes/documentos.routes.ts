import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireAdmin } from '../middlewares/rbacMiddleware';
import { documentosController } from '../controllers/documentos.controller';

const router = Router();

// Multer em memória — não grava em disco, envia direto ao Supabase Storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Use PDF, imagem ou Word.'));
    }
  },
});

router.use(authMiddleware, requireAdmin);

router.get('/',               documentosController.listar);
router.post('/upload',        upload.single('arquivo'), documentosController.upload);
router.get('/:id/download',   documentosController.download);
router.delete('/:id',         documentosController.remover);

export default router;

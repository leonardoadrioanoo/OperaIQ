-- Criação do Bucket "empresa-documentos"
INSERT INTO storage.buckets (id, name, public) 
VALUES ('empresa-documentos', 'empresa-documentos', false)
ON CONFLICT (id) DO NOTHING;

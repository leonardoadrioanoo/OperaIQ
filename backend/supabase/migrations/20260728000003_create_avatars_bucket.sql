-- =======================================================================================
-- Criação do Bucket "avatars" para as fotos de perfil dos colaboradores
-- =======================================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas do Storage (permitir acesso aos usuários)
-- Leitura pública para quem tem acesso ao link
CREATE POLICY "Permitir leitura pública de avatars" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

-- Inserção permitida para usuários autenticados
CREATE POLICY "Permitir upload de avatars" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'avatars');

-- Atualização permitida para usuários autenticados (eles mesmos)
CREATE POLICY "Permitir atualização de avatars" 
ON storage.objects FOR UPDATE
TO authenticated 
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Permitir delete de avatars" 
ON storage.objects FOR DELETE
TO authenticated 
USING (bucket_id = 'avatars');

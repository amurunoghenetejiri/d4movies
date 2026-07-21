
-- Movies-media: signed-in users can read; only admins can write
CREATE POLICY "movies_media read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'movies-media');
CREATE POLICY "movies_media admin insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'movies-media' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "movies_media admin update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'movies-media' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "movies_media admin delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'movies-media' AND public.has_role(auth.uid(),'admin'));

-- Avatars: signed-in users can read all; users manage their own avatar (folder = user id)
CREATE POLICY "avatars read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'avatars');
CREATE POLICY "avatars own insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatars own update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatars own delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

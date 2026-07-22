
-- 1. Extend movies table
ALTER TABLE public.movies
  ADD COLUMN IF NOT EXISTS original_title text,
  ADD COLUMN IF NOT EXISTS producer text,
  ADD COLUMN IF NOT EXISTS age_rating text,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS subtitle_url text,
  ADD COLUMN IF NOT EXISTS thumbnail text,
  ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false;

-- 2. Replace movies policies to allow user uploads
DROP POLICY IF EXISTS "Movies public read" ON public.movies;
DROP POLICY IF EXISTS "Admins insert movies" ON public.movies;
DROP POLICY IF EXISTS "Admins update movies" ON public.movies;
DROP POLICY IF EXISTS "Admins delete movies" ON public.movies;

CREATE POLICY "Movies public read visible" ON public.movies
  FOR SELECT USING (is_hidden = false);
CREATE POLICY "Owners and admins read hidden" ON public.movies
  FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can insert own movies" ON public.movies
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "Owners update own; admins update any" ON public.movies
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners delete own; admins delete any" ON public.movies
  FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 3. Media files tracking table
CREATE TABLE IF NOT EXISTS public.media_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id uuid REFERENCES public.movies(id) ON DELETE CASCADE,
  bucket text NOT NULL,
  path text NOT NULL,
  url text,
  file_name text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  file_type text,
  kind text NOT NULL DEFAULT 'other',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_media_files_user ON public.media_files(user_id);
CREATE INDEX IF NOT EXISTS idx_media_files_movie ON public.media_files(movie_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_files TO authenticated;
GRANT ALL ON public.media_files TO service_role;
ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own media" ON public.media_files
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid());

-- 4. Storage policies for new buckets
-- Path convention: <user_id>/<...>
DO $$
DECLARE b text;
DECLARE bucket_list text[] := ARRAY['movies','trailers','posters','backdrops','subtitles','thumbnails','profile-images'];
BEGIN
  FOREACH b IN ARRAY bucket_list LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', b || '_insert_own');
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', b || '_update_own');
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', b || '_delete_own');
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', b || '_select_own');
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', b || '_admin_all');
  END LOOP;
END $$;

-- Insert: signed-in users can upload into their own folder in any of the new buckets
CREATE POLICY "new_buckets_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('movies','trailers','posters','backdrops','subtitles','thumbnails','profile-images')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Update/Delete: owners or admins
CREATE POLICY "new_buckets_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('movies','trailers','posters','backdrops','subtitles','thumbnails','profile-images')
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin'))
  );
CREATE POLICY "new_buckets_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id IN ('movies','trailers','posters','backdrops','subtitles','thumbnails','profile-images')
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin'))
  );

-- Read: authenticated users can read from the "public-intent" buckets; movies file only owner/admin
CREATE POLICY "new_buckets_read_public" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id IN ('trailers','posters','backdrops','subtitles','thumbnails','profile-images'));

CREATE POLICY "movies_read_owner_admin" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'movies'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin'))
  );

-- Anon can read posters/backdrops/thumbnails/trailers/subtitles/profile-images too via signed URLs;
-- allow anon SELECT so public signed URLs work without a session on shareable pages.
CREATE POLICY "new_buckets_read_anon" ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id IN ('trailers','posters','backdrops','subtitles','thumbnails','profile-images'));

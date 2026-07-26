
ALTER TABLE public.movies
  ADD COLUMN IF NOT EXISTS tmdb_id INTEGER,
  ADD COLUMN IF NOT EXISTS writers TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS movies_tmdb_id_idx ON public.movies (tmdb_id) WHERE tmdb_id IS NOT NULL;

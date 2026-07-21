
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.movie_category AS ENUM ('Hollywood','Nollywood','Bollywood','Korean Drama','Chinese Drama','Anime','TV Series');
CREATE TYPE public.movie_quality AS ENUM ('HD','FHD','4K');

-- ============ UTILITY: updated_at trigger fn ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  username TEXT UNIQUE,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  subscription_status TEXT NOT NULL DEFAULT 'free',
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles public read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- Admins can view all roles (via has_role, safe)
CREATE POLICY "Admins read all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ Handle new user trigger ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email,'@',1)),
    NEW.email,
    NEW.raw_user_meta_data ->> 'avatar_url',
    COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email,'@',1) || '_' || substr(NEW.id::text,1,4))
  )
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ MOVIES ============
CREATE TABLE public.movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  poster TEXT,
  backdrop TEXT,
  trailer_url TEXT,
  movie_url TEXT,
  genres TEXT[] NOT NULL DEFAULT '{}',
  actors TEXT[] NOT NULL DEFAULT '{}',
  director TEXT,
  language TEXT,
  country TEXT,
  release_year INT NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  category public.movie_category NOT NULL DEFAULT 'Hollywood',
  quality public.movie_quality NOT NULL DEFAULT 'HD',
  runtime_minutes INT NOT NULL DEFAULT 100,
  rating NUMERIC(3,1) NOT NULL DEFAULT 0,
  trending BOOLEAN NOT NULL DEFAULT false,
  featured BOOLEAN NOT NULL DEFAULT false,
  top_rated BOOLEAN NOT NULL DEFAULT false,
  coming_soon BOOLEAN NOT NULL DEFAULT false,
  views BIGINT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.movies TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.movies TO authenticated;
GRANT ALL ON public.movies TO service_role;
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Movies public read" ON public.movies FOR SELECT USING (true);
CREATE POLICY "Admins insert movies" ON public.movies FOR INSERT WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update movies" ON public.movies FOR UPDATE USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete movies" ON public.movies FOR DELETE USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_movies_updated BEFORE UPDATE ON public.movies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_movies_category ON public.movies(category);
CREATE INDEX idx_movies_trending ON public.movies(trending) WHERE trending = true;
CREATE INDEX idx_movies_featured ON public.movies(featured) WHERE featured = true;

-- ============ WATCHLIST ============
CREATE TABLE public.watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id UUID NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, movie_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.watchlist TO authenticated;
GRANT ALL ON public.watchlist TO service_role;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own watchlist" ON public.watchlist FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ FAVORITES ============
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id UUID NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, movie_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own favorites" ON public.favorites FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ WATCH HISTORY ============
CREATE TABLE public.watch_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id UUID NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  progress NUMERIC(5,2) NOT NULL DEFAULT 0,
  last_watched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, movie_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.watch_history TO authenticated;
GRANT ALL ON public.watch_history TO service_role;
ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own history" ON public.watch_history FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ DOWNLOADS ============
CREATE TABLE public.downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id UUID NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued',
  progress NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, movie_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.downloads TO authenticated;
GRANT ALL ON public.downloads TO service_role;
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own downloads" ON public.downloads FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ COMMENTS ============
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id UUID NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments public read" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users create own comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins moderate comments" ON public.comments FOR DELETE USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_comments_updated BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ COMMENT LIKES ============
CREATE TABLE public.comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  value SMALLINT NOT NULL CHECK (value IN (-1,1)),
  UNIQUE (user_id, comment_id)
);
GRANT SELECT ON public.comment_likes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comment_likes TO authenticated;
GRANT ALL ON public.comment_likes TO service_role;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comment likes public read" ON public.comment_likes FOR SELECT USING (true);
CREATE POLICY "Own comment likes" ON public.comment_likes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ MOVIE LIKES ============
CREATE TABLE public.movie_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id UUID NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  value SMALLINT NOT NULL CHECK (value IN (-1,1)),
  UNIQUE (user_id, movie_id)
);
GRANT SELECT ON public.movie_likes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.movie_likes TO authenticated;
GRANT ALL ON public.movie_likes TO service_role;
ALTER TABLE public.movie_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Movie likes public read" ON public.movie_likes FOR SELECT USING (true);
CREATE POLICY "Own movie likes" ON public.movie_likes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ REPORTS ============
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users create own reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read own reports" ON public.reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage reports" ON public.reports FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins insert notifications" ON public.notifications FOR INSERT WITH CHECK (public.has_role(auth.uid(),'admin'));

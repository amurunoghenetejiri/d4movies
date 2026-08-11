-- Moderator powers: content, reports, comments, limited user moderation + action log

-- 1) Mod action audit log
CREATE TABLE IF NOT EXISTS public.mod_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  target_type text,
  target_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mod_actions_mod ON public.mod_actions(moderator_id, created_at DESC);
GRANT SELECT, INSERT ON public.mod_actions TO authenticated;
GRANT ALL ON public.mod_actions TO service_role;
ALTER TABLE public.mod_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Mods insert own actions" ON public.mod_actions;
CREATE POLICY "Mods insert own actions" ON public.mod_actions
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = moderator_id
    AND (public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'admin'))
  );

DROP POLICY IF EXISTS "Mods read own actions; admins read all" ON public.mod_actions;
CREATE POLICY "Mods read own actions; admins read all" ON public.mod_actions
  FOR SELECT TO authenticated
  USING (
    moderator_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

-- Helper: staff = admin OR moderator
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin') OR public.has_role(_user_id, 'moderator');
$$;

-- 2) Movies: moderators can read hidden + update moderation fields (not hard-delete required)
DROP POLICY IF EXISTS "Owners and admins read hidden" ON public.movies;
CREATE POLICY "Owners and staff read hidden" ON public.movies
  FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR public.is_staff(auth.uid())
  );

DROP POLICY IF EXISTS "Owners update own; admins update any" ON public.movies;
CREATE POLICY "Owners update own; staff update any" ON public.movies
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.is_staff(auth.uid()))
  WITH CHECK (created_by = auth.uid() OR public.is_staff(auth.uid()));

-- Moderators may delete content; admins already could
DROP POLICY IF EXISTS "Owners delete own; admins delete any" ON public.movies;
CREATE POLICY "Owners delete own; staff delete any" ON public.movies
  FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.is_staff(auth.uid()));

-- 3) Reports: moderators manage queue
DROP POLICY IF EXISTS "Admins manage reports" ON public.reports;
CREATE POLICY "Staff manage reports" ON public.reports
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- 4) Comments: moderators can delete any
DROP POLICY IF EXISTS "Admins moderate comments" ON public.comments;
CREATE POLICY "Staff moderate comments" ON public.comments
  FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()));

-- 5) Profiles: staff can suspend/reinstate (limited update)
DROP POLICY IF EXISTS "Staff update user status" ON public.profiles;
CREATE POLICY "Staff update user status" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- 6) Media: staff can manage for cleanup when moderating movies
DROP POLICY IF EXISTS "Users manage own media" ON public.media_files;
CREATE POLICY "Users manage own media; staff manage any" ON public.media_files
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_staff(auth.uid()));

-- 7) Allow staff to read all roles (for mod user list badges) without managing roles
DROP POLICY IF EXISTS "Staff read all roles" ON public.user_roles;
CREATE POLICY "Staff read all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

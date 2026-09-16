-- MJMS Internal Product Catalogue
-- Row Level Security

-- Role helpers (defined after profiles table exists)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_catalogue_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('staff', 'admin')
  );
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_own
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY profiles_select_admin
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY profiles_update_own
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT p.role FROM public.profiles AS p WHERE p.id = auth.uid())
  );

CREATE POLICY profiles_admin_all
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- articles
-- ---------------------------------------------------------------------------
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY articles_select_catalogue_users
  ON public.articles
  FOR SELECT
  TO authenticated
  USING (public.is_catalogue_user());

CREATE POLICY articles_insert_admin
  ON public.articles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY articles_update_admin
  ON public.articles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY articles_delete_admin
  ON public.articles
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- article_images
-- ---------------------------------------------------------------------------
ALTER TABLE public.article_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY article_images_select_catalogue_users
  ON public.article_images
  FOR SELECT
  TO authenticated
  USING (public.is_catalogue_user());

CREATE POLICY article_images_insert_admin
  ON public.article_images
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY article_images_update_admin
  ON public.article_images
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY article_images_delete_admin
  ON public.article_images
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

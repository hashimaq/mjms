-- Activity audit trail + staff catalogue write access (employees) + admin read-all

-- ---------------------------------------------------------------------------
-- activity_logs
-- ---------------------------------------------------------------------------
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT activity_logs_action_check CHECK (
    action IN (
      'CREATE_PRODUCT',
      'UPDATE_PRODUCT',
      'DELETE_PRODUCT',
      'UPLOAD_PHOTO',
      'DELETE_PHOTO',
      'SET_PRIMARY_PHOTO',
      'UPDATE_PROJECT',
      'LOGIN',
      'LOGOUT'
    )
  )
);

CREATE INDEX activity_logs_user_id_idx ON public.activity_logs (user_id);
CREATE INDEX activity_logs_created_at_idx ON public.activity_logs (created_at DESC);
CREATE INDEX activity_logs_entity_idx ON public.activity_logs (entity_type, entity_id);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY activity_logs_select_admin
  ON public.activity_logs
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY activity_logs_select_own
  ON public.activity_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Append-only via SECURITY DEFINER function (no direct INSERT for clients)

CREATE OR REPLACE FUNCTION public.append_activity_log(
  p_action text,
  p_entity_type text,
  p_entity_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_uid uuid;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL OR NOT public.is_catalogue_user() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, metadata)
  VALUES (v_uid, p_action, p_entity_type, p_entity_id, COALESCE(p_metadata, '{}'::jsonb))
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON public.activity_logs FROM authenticated;
GRANT SELECT ON public.activity_logs TO authenticated;
GRANT EXECUTE ON FUNCTION public.append_activity_log(text, text, uuid, jsonb) TO authenticated;

-- ---------------------------------------------------------------------------
-- Staff (employee) write access — articles & images (no delete for staff)
-- ---------------------------------------------------------------------------
CREATE POLICY articles_insert_staff
  ON public.articles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_catalogue_user());

CREATE POLICY articles_update_staff
  ON public.articles
  FOR UPDATE
  TO authenticated
  USING (public.is_catalogue_user())
  WITH CHECK (public.is_catalogue_user());

CREATE POLICY article_images_insert_staff
  ON public.article_images
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_catalogue_user());

CREATE POLICY article_images_update_staff
  ON public.article_images
  FOR UPDATE
  TO authenticated
  USING (public.is_catalogue_user())
  WITH CHECK (public.is_catalogue_user());

-- Storage: catalogue users may upload product images (path convention enforced)
CREATE POLICY product_images_insert_catalogue_users
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND public.is_catalogue_user()
    AND public.storage_path_is_product_image(name)
  );

CREATE POLICY product_images_update_catalogue_users
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND public.is_catalogue_user()
  )
  WITH CHECK (
    bucket_id = 'product-images'
    AND public.is_catalogue_user()
    AND public.storage_path_is_product_image(name)
  );

-- Atomic article create + audit
CREATE OR REPLACE FUNCTION public.create_article_with_activity(
  p_project_raw text,
  p_source_sheet text,
  p_source_row integer,
  p_source_key text,
  p_source_no text DEFAULT NULL,
  p_season_raw text DEFAULT NULL,
  p_making_raw text DEFAULT NULL,
  p_type_raw text DEFAULT NULL,
  p_material_raw text DEFAULT NULL,
  p_colour_raw text DEFAULT NULL,
  p_size_range_raw text DEFAULT NULL,
  p_qty_raw text DEFAULT NULL,
  p_remarks_raw text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_norm text;
BEGIN
  IF NOT public.is_catalogue_user() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  v_norm := upper(trim(p_project_raw));

  INSERT INTO public.articles (
    project_raw,
    project_normalized,
    source_sheet,
    source_row,
    source_key,
    source_no,
    season_raw,
    making_raw,
    type_raw,
    material_raw,
    colour_raw,
    size_range_raw,
    qty_raw,
    remarks_raw,
    making_normalized,
    type_normalized
  )
  VALUES (
    trim(p_project_raw),
    v_norm,
    p_source_sheet,
    p_source_row,
    p_source_key,
    NULLIF(trim(p_source_no), ''),
    NULLIF(trim(p_season_raw), ''),
    NULLIF(trim(p_making_raw), ''),
    NULLIF(trim(p_type_raw), ''),
    NULLIF(trim(p_material_raw), ''),
    NULLIF(trim(p_colour_raw), ''),
    NULLIF(trim(p_size_range_raw), ''),
    NULLIF(trim(p_qty_raw), ''),
    NULLIF(trim(p_remarks_raw), ''),
    NULLIF(trim(p_making_raw), ''),
    NULLIF(trim(p_type_raw), '')
  )
  RETURNING id INTO v_id;

  PERFORM public.append_activity_log(
    'CREATE_PRODUCT',
    'article',
    v_id,
    COALESCE(p_metadata, '{}'::jsonb) || jsonb_build_object('project_name', trim(p_project_raw))
  );

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_article_with_activity(
  text, text, integer, text, text, text, text, text, text, text, text, text, text, jsonb
) TO authenticated;

COMMENT ON TABLE public.activity_logs IS
  'Append-only audit trail for catalogue and auth events. Inserts via append_activity_log only.';

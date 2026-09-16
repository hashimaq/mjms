-- MJMS Internal Product Catalogue
-- Private Storage bucket and policies for product images

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  false,
  52428800,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Path convention: products/{article_id}/{image_order}.{ext}
-- Example: products/550e8400-e29b-41d4-a716-446655440000/01.jpeg

CREATE OR REPLACE FUNCTION public.storage_path_is_product_image(object_name text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT object_name ~ '^products/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9]{2}\.[A-Za-z0-9]+$';
$$;

-- Authenticated catalogue users may read product images
CREATE POLICY product_images_select_catalogue_users
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND public.is_catalogue_user()
  );

-- Admins may upload product images (path must follow convention)
CREATE POLICY product_images_insert_admin
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND public.is_admin()
    AND public.storage_path_is_product_image(name)
  );

CREATE POLICY product_images_update_admin
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND public.is_admin()
  )
  WITH CHECK (
    bucket_id = 'product-images'
    AND public.is_admin()
    AND public.storage_path_is_product_image(name)
  );

CREATE POLICY product_images_delete_admin
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND public.is_admin()
  );

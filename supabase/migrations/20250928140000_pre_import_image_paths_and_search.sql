-- Pre-import: allow product image paths beyond two-digit order (100+, etc.)

CREATE OR REPLACE FUNCTION public.storage_path_is_product_image(object_name text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT object_name ~ '^products/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9]+\.[A-Za-z0-9]+$';
$$;

COMMENT ON FUNCTION public.storage_path_is_product_image IS
  'Validates product-images object names: products/{uuid}/{positive_integer}.{ext}';

-- Article/source number search (ilike in catalogue search)
CREATE INDEX IF NOT EXISTS articles_source_no_trgm_idx
  ON public.articles
  USING gin (source_no extensions.gin_trgm_ops);

-- Optional duplicate guard: same binary twice on one article (sha256 set at upload/register)
CREATE UNIQUE INDEX IF NOT EXISTS article_images_article_sha256_unique_idx
  ON public.article_images (article_id, sha256)
  WHERE sha256 IS NOT NULL;

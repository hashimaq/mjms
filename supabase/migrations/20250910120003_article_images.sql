-- MJMS Internal Product Catalogue
-- Article images (storage path references; same sha256 may appear on multiple rows)

CREATE TABLE public.article_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.articles (id) ON DELETE CASCADE,

  storage_path text NOT NULL,
  original_filename text,
  mime_type text,
  file_size bigint,
  width integer,
  height integer,
  sha256 text,
  image_order integer NOT NULL DEFAULT 1,
  is_primary boolean NOT NULL DEFAULT false,

  -- Import / audit traceability (from image-manifest.csv)
  import_ref text,
  source_sheet text,
  source_row integer,
  manifest_confidence text,
  verification_status text,
  notes text,

  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),

  CONSTRAINT article_images_order_positive CHECK (image_order > 0),
  CONSTRAINT article_images_storage_path_unique UNIQUE (storage_path),
  CONSTRAINT article_images_verification_status_check CHECK (
    verification_status IS NULL
    OR verification_status IN ('VERIFIED', 'NEEDS_REVIEW', 'UNMATCHED')
  ),
  CONSTRAINT article_images_confidence_check CHECK (
    manifest_confidence IS NULL
    OR manifest_confidence IN ('HIGH', 'MEDIUM', 'LOW')
  )
);

-- sha256 is indexed for duplicate analysis but NOT unique (intentional reuse allowed)
CREATE INDEX article_images_article_id_idx
  ON public.article_images (article_id);

CREATE INDEX article_images_article_order_idx
  ON public.article_images (article_id, image_order);

CREATE INDEX article_images_sha256_idx
  ON public.article_images (sha256);

CREATE INDEX article_images_verification_status_idx
  ON public.article_images (verification_status);

-- At most one primary image per article
CREATE UNIQUE INDEX article_images_one_primary_per_article_idx
  ON public.article_images (article_id)
  WHERE is_primary = true;

CREATE TRIGGER article_images_set_updated_at
  BEFORE UPDATE ON public.article_images
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.article_images IS
  'Catalogue images stored in Supabase Storage. URLs are generated at read time from storage_path.';

COMMENT ON COLUMN public.article_images.storage_path IS
  'Private bucket path, e.g. products/{article_id}/01.jpeg — not a public URL.';

COMMENT ON COLUMN public.article_images.sha256 IS
  'Content hash for duplicate detection. Not unique — same binary may belong to multiple articles.';

COMMENT ON COLUMN public.article_images.import_ref IS
  'Deterministic image_id from extraction manifest, e.g. WINTER_HEEL__row_21__image23.png__a24.';

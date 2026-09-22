-- Indexes aligned with MJMS catalogue query patterns (category pages, ordering, activity).

CREATE INDEX IF NOT EXISTS articles_source_sheet_idx
  ON public.articles (source_sheet);

CREATE INDEX IF NOT EXISTS articles_source_sheet_project_raw_idx
  ON public.articles (source_sheet, project_raw);

CREATE INDEX IF NOT EXISTS articles_created_at_idx
  ON public.articles (created_at DESC);

CREATE INDEX IF NOT EXISTS articles_updated_at_idx
  ON public.articles (updated_at DESC);

CREATE INDEX IF NOT EXISTS activity_logs_user_created_idx
  ON public.activity_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS article_images_article_primary_idx
  ON public.article_images (article_id, is_primary DESC, image_order ASC);

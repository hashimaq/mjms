-- Admin-selected "hit" articles for public decorative showcases (e.g. homepage marquee).

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS is_hit boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS articles_is_hit_true_idx
  ON public.articles (is_hit, updated_at DESC)
  WHERE is_hit = true;

COMMENT ON COLUMN public.articles.is_hit IS
  'When true, article may appear in public hit-article showcases (homepage background marquee). Admin-controlled.';

-- MJMS Internal Product Catalogue
-- Articles (Excel source rows). Project is NOT globally unique.

CREATE TABLE public.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Raw Excel values (preserved exactly as imported)
  project_raw text NOT NULL,
  season_raw text,
  making_raw text,
  type_raw text,
  size_range_raw text,
  qty_raw text,
  material_raw text,
  colour_raw text,
  remarks_raw text,

  -- Normalized search/filter helpers (from extraction rules; raw always preserved)
  project_normalized text,
  season_normalized text,
  making_normalized text,
  type_normalized text,

  -- Excel traceability (stable source identity: sheet + row)
  source_sheet text NOT NULL,
  source_row integer NOT NULL,
  source_no text,
  source_key text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),

  CONSTRAINT articles_source_row_positive CHECK (source_row > 0),
  CONSTRAINT articles_source_key_unique UNIQUE (source_key)
);

-- Traceability: one row per Excel sheet+row; Project may repeat across rows
CREATE UNIQUE INDEX articles_source_sheet_row_idx
  ON public.articles (source_sheet, source_row);

COMMENT ON TABLE public.articles IS
  'Product/article rows imported from Excel. UUID primary key; project names may duplicate.';

COMMENT ON COLUMN public.articles.source_key IS
  'Stable import key matching extraction source_id format: "<sheet>::<row>".';

COMMENT ON COLUMN public.articles.season_raw IS
  'Preserves composite values such as "WINTER / SUMMER" as a single source cell value.';

COMMENT ON COLUMN public.articles.qty_raw IS
  'Text field — source contains values like "Proto", "1pair PROTO", ".", not only integers.';

-- Search indexes (252 rows — PostgreSQL is sufficient; no external search engine)
CREATE INDEX articles_project_normalized_idx
  ON public.articles (project_normalized);

CREATE INDEX articles_project_normalized_trgm_idx
  ON public.articles
  USING gin (project_normalized extensions.gin_trgm_ops);

CREATE INDEX articles_project_raw_trgm_idx
  ON public.articles
  USING gin (project_raw extensions.gin_trgm_ops);

CREATE INDEX articles_season_normalized_idx
  ON public.articles (season_normalized);

CREATE INDEX articles_making_normalized_idx
  ON public.articles (making_normalized);

CREATE INDEX articles_type_normalized_idx
  ON public.articles (type_normalized);

CREATE INDEX articles_material_raw_idx
  ON public.articles (material_raw);

CREATE INDEX articles_colour_raw_idx
  ON public.articles (colour_raw);

CREATE TRIGGER articles_set_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

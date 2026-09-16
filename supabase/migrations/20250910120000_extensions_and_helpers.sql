-- MJMS Internal Product Catalogue
-- Extensions and shared helper functions

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- Reusable updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

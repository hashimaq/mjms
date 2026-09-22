-- Allow `employee` as DB alias for catalogue operators; keep `staff` for compatibility.
-- Correct canonical MJMS bootstrap identities by auth email (one-time data fix).

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('staff', 'admin', 'employee'));

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
      AND role IN ('staff', 'admin', 'employee')
  );
$$;

CREATE OR REPLACE FUNCTION public.fix_mjms_canonical_profile_roles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  UPDATE public.profiles p
  SET
    role = 'admin',
    full_name = COALESCE(NULLIF(trim(p.full_name), ''), 'Saad Manzoor')
  FROM auth.users u
  WHERE p.id = u.id
    AND lower(u.email) = 'saad.manzoor@mjms.pk';

  UPDATE public.profiles p
  SET
    role = 'employee',
    full_name = COALESCE(NULLIF(trim(p.full_name), ''), 'Taimoor')
  FROM auth.users u
  WHERE p.id = u.id
    AND lower(u.email) = 'planner@mjms.pk';
END;
$$;

SELECT public.fix_mjms_canonical_profile_roles();

COMMENT ON COLUMN public.profiles.role IS
  'admin = boss; staff or employee = catalogue operator (employee is preferred alias).';

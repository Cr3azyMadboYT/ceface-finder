-- =============================================
-- CeFaci v3.1 — Business moderation (approved/rejected/pending), safe role/updated_at
-- Rulează în Supabase SQL Editor. Idempotent.
-- =============================================

-- 1. profiles: updated_at + role check safe
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='role'
      AND data_type IN ('text','character varying')
  ) THEN
    EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check';
    EXECUTE $upd$ UPDATE public.profiles SET role='client' WHERE role IS NULL OR role NOT IN ('client','business','admin') $upd$;
    EXECUTE 'ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT ''client''';
    EXECUTE 'ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN (''client'',''business'',''admin''))';
  END IF;
END $$;

-- 2. businesses: moderation columns
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS moderation_status text DEFAULT 'pending';

ALTER TABLE public.businesses
  DROP CONSTRAINT IF EXISTS businesses_moderation_status_check;
ALTER TABLE public.businesses
  ADD CONSTRAINT businesses_moderation_status_check
  CHECK (moderation_status IN ('pending','approved','rejected'));

-- Sync existing rows
UPDATE public.businesses SET moderation_status = 'approved' WHERE is_approved = true AND moderation_status IS DISTINCT FROM 'approved';
UPDATE public.businesses SET moderation_status = COALESCE(moderation_status,'pending') WHERE moderation_status IS NULL;

-- 3. Block business from creating active offers if not approved
CREATE OR REPLACE FUNCTION public.enforce_offer_business_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_approved boolean;
BEGIN
  IF NEW.business_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;
  SELECT (is_approved = true AND COALESCE(moderation_status,'pending') = 'approved')
    INTO v_approved
  FROM public.businesses WHERE id = NEW.business_id;
  IF NOT v_approved THEN
    IF NEW.status = 'active' THEN
      NEW.status := 'pending';
    END IF;
    NEW.is_active := false;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_enforce_offer_business_approval ON public.offers;
CREATE TRIGGER trg_enforce_offer_business_approval
  BEFORE INSERT OR UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.enforce_offer_business_approval();

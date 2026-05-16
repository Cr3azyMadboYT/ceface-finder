-- =============================================
-- CeFaci v3 — Business Accounts, Subscriptions, Notifications, Stats
-- Rulează în Supabase SQL Editor.
-- Sigur la re-rulare (IF NOT EXISTS / OR REPLACE).
-- =============================================

-- 1. PROFILES: extra fields + account_type_chosen + role 'business'
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS zone text,
  ADD COLUMN IF NOT EXISTS fcm_token text,
  ADD COLUMN IF NOT EXISTS account_type_chosen boolean DEFAULT false;

-- Permitem rolul 'business'. Dacă există enum app_role, adăugăm valoarea.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    BEGIN
      ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'business';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- Dacă profiles.role e text, OK. Dacă e enum app_role, valoarea 'business' există acum.

-- 2. BUSINESSES
CREATE TABLE IF NOT EXISTS public.businesses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  category text,
  description text,
  phone text,
  email text,
  city text,
  zone text,
  address text,
  latitude double precision,
  longitude double precision,
  logo_url text,
  cover_image_url text,
  opening_hours jsonb,
  website text,
  social_links jsonb,
  is_approved boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  subscription_plan text DEFAULT 'free' CHECK (subscription_plan IN ('free','basic','pro','premium')),
  subscription_status text DEFAULT 'active' CHECK (subscription_status IN ('active','expired','cancelled','pending')),
  subscription_expires_at timestamptz,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_businesses_owner ON public.businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_businesses_approved ON public.businesses(is_approved);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read approved businesses" ON public.businesses;
CREATE POLICY "Public can read approved businesses" ON public.businesses
  FOR SELECT USING (is_approved = true OR owner_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Owner can insert business" ON public.businesses;
CREATE POLICY "Owner can insert business" ON public.businesses
  FOR INSERT WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Owner or admin can update business" ON public.businesses;
CREATE POLICY "Owner or admin can update business" ON public.businesses
  FOR UPDATE USING (owner_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin can delete business" ON public.businesses;
CREATE POLICY "Admin can delete business" ON public.businesses
  FOR DELETE USING (public.is_admin(auth.uid()));

-- 3. OFFERS extensions for business flow
ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS old_price numeric,
  ADD COLUMN IF NOT EXISTS new_price numeric,
  ADD COLUMN IF NOT EXISTS discount_percent integer,
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS target_type text DEFAULT 'all' CHECK (target_type IN ('all','city','zone','followers','category')),
  ADD COLUMN IF NOT EXISTS target_city text,
  ADD COLUMN IF NOT EXISTS target_zone text,
  ADD COLUMN IF NOT EXISTS target_radius_km numeric,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('draft','pending','active','rejected','expired')),
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS terms text;

CREATE INDEX IF NOT EXISTS idx_offers_business ON public.offers(business_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON public.offers(status);

-- Allow business owner to manage own offers
DROP POLICY IF EXISTS "Business owner manages offers" ON public.offers;
CREATE POLICY "Business owner manages offers" ON public.offers
  FOR ALL USING (
    business_id IS NULL
    OR public.is_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = offers.business_id AND b.owner_id = auth.uid())
  )
  WITH CHECK (
    business_id IS NULL
    OR public.is_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = offers.business_id AND b.owner_id = auth.uid())
  );

-- 4. BUSINESS FOLLOWERS
CREATE TABLE IF NOT EXISTS public.business_followers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, business_id)
);
ALTER TABLE public.business_followers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User reads own follows" ON public.business_followers;
CREATE POLICY "User reads own follows" ON public.business_followers
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_followers.business_id AND b.owner_id = auth.uid()));

DROP POLICY IF EXISTS "User manages own follows" ON public.business_followers;
CREATE POLICY "User manages own follows" ON public.business_followers
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 5. NOTIFICATIONS (in-app)
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
  offer_id uuid REFERENCES public.offers(id) ON DELETE SET NULL,
  title text NOT NULL,
  body text,
  image_url text,
  type text DEFAULT 'new_offer' CHECK (type IN ('new_offer','offer_expiring','business_update')),
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User reads own notifications" ON public.notifications;
CREATE POLICY "User reads own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "User updates own notifications" ON public.notifications;
CREATE POLICY "User updates own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Owner business or admin inserts notifications" ON public.notifications;
CREATE POLICY "Owner business or admin inserts notifications" ON public.notifications
  FOR INSERT WITH CHECK (
    public.is_admin(auth.uid())
    OR business_id IS NULL
    OR EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = notifications.business_id AND b.owner_id = auth.uid())
  );

-- 6. OFFER STATS aggregate table
CREATE TABLE IF NOT EXISTS public.offer_stats (
  offer_id uuid PRIMARY KEY REFERENCES public.offers(id) ON DELETE CASCADE,
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
  views integer DEFAULT 0,
  clicks integer DEFAULT 0,
  saves integer DEFAULT 0,
  calls integer DEFAULT 0,
  directions integer DEFAULT 0,
  notifications_sent integer DEFAULT 0,
  unique_users integer DEFAULT 0,
  conversion_rate numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.offer_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner business or admin reads stats" ON public.offer_stats;
CREATE POLICY "Owner business or admin reads stats" ON public.offer_stats
  FOR SELECT USING (
    public.is_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = offer_stats.business_id AND b.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "System upserts stats" ON public.offer_stats;
CREATE POLICY "System upserts stats" ON public.offer_stats
  FOR ALL USING (true) WITH CHECK (true);

-- Helper RPC: increment stat field (creează rândul dacă lipsește)
CREATE OR REPLACE FUNCTION public.increment_offer_stat(p_offer_id uuid, p_field text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_id uuid;
BEGIN
  SELECT business_id INTO v_business_id FROM public.offers WHERE id = p_offer_id;

  INSERT INTO public.offer_stats (offer_id, business_id)
  VALUES (p_offer_id, v_business_id)
  ON CONFLICT (offer_id) DO NOTHING;

  IF p_field = 'views' THEN
    UPDATE public.offer_stats SET views = views + 1, updated_at = now() WHERE offer_id = p_offer_id;
  ELSIF p_field = 'clicks' THEN
    UPDATE public.offer_stats SET clicks = clicks + 1, updated_at = now() WHERE offer_id = p_offer_id;
  ELSIF p_field = 'saves' THEN
    UPDATE public.offer_stats SET saves = saves + 1, updated_at = now() WHERE offer_id = p_offer_id;
  ELSIF p_field = 'calls' THEN
    UPDATE public.offer_stats SET calls = calls + 1, updated_at = now() WHERE offer_id = p_offer_id;
  ELSIF p_field = 'directions' THEN
    UPDATE public.offer_stats SET directions = directions + 1, updated_at = now() WHERE offer_id = p_offer_id;
  ELSIF p_field = 'notifications_sent' THEN
    UPDATE public.offer_stats SET notifications_sent = notifications_sent + 1, updated_at = now() WHERE offer_id = p_offer_id;
  END IF;
END $$;

GRANT EXECUTE ON FUNCTION public.increment_offer_stat(uuid, text) TO anon, authenticated;

-- 7. SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('free','basic','pro','premium')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('active','expired','cancelled','pending')),
  price numeric DEFAULT 0,
  started_at timestamptz,
  expires_at timestamptz,
  payment_provider text,
  payment_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner or admin reads subscriptions" ON public.subscriptions;
CREATE POLICY "Owner or admin reads subscriptions" ON public.subscriptions
  FOR SELECT USING (
    public.is_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = subscriptions.business_id AND b.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Owner inserts pending subscription" ON public.subscriptions;
CREATE POLICY "Owner inserts pending subscription" ON public.subscriptions
  FOR INSERT WITH CHECK (
    public.is_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = subscriptions.business_id AND b.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admin updates subscriptions" ON public.subscriptions;
CREATE POLICY "Admin updates subscriptions" ON public.subscriptions
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- 8. AUTO-EXPIRE helper (apelat din UI sau cron)
CREATE OR REPLACE FUNCTION public.expire_offers()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.offers
    SET status = 'expired'
    WHERE status = 'active'
      AND end_date IS NOT NULL
      AND end_date < CURRENT_DATE;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END $$;

GRANT EXECUTE ON FUNCTION public.expire_offers() TO authenticated;

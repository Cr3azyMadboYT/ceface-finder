-- =============================================
-- CeFaci v2 - Monetization & Analytics Migration
-- Run this SQL in your Supabase SQL Editor
-- =============================================

-- 1. ADD PROMOTION COLUMNS TO OFFERS
ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS is_promoted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS promotion_starts_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS promotion_expires_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS promotion_priority integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS promotion_push_sent boolean DEFAULT false;

-- 2. OFFER EVENTS TABLE (Analytics)
CREATE TABLE IF NOT EXISTS public.offer_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('view', 'click', 'open_map', 'favorite')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.offer_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert events (even anonymous for views)
CREATE POLICY "Anyone can insert events" ON public.offer_events
  FOR INSERT WITH CHECK (true);

-- Only admin can read events
CREATE POLICY "Admin can read events" ON public.offer_events
  FOR SELECT USING (public.is_admin(auth.uid()));

-- 3. PUSH LOGS TABLE
CREATE TABLE IF NOT EXISTS public.push_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id uuid NULL REFERENCES public.offers(id) ON DELETE SET NULL,
  title text NOT NULL,
  body text NOT NULL,
  sent_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.push_logs ENABLE ROW LEVEL SECURITY;

-- Only admin can manage push logs
CREATE POLICY "Admin can read push_logs" ON public.push_logs
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin can insert push_logs" ON public.push_logs
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

-- 4. INDEX for faster analytics queries
CREATE INDEX IF NOT EXISTS idx_offer_events_offer_id ON public.offer_events(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_events_created_at ON public.offer_events(created_at);
CREATE INDEX IF NOT EXISTS idx_offer_events_type ON public.offer_events(event_type);
CREATE INDEX IF NOT EXISTS idx_offers_promoted ON public.offers(is_promoted, promotion_priority DESC);

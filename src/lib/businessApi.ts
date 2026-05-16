import { supabase } from './supabase';
import type { Business, Offer, OfferStats, Subscription } from '@/types';

export const getMyBusiness = async (userId: string): Promise<Business | null> => {
  const { data } = await supabase.from('businesses').select('*').eq('owner_id', userId).maybeSingle();
  return (data as Business) || null;
};

export const upsertMyBusiness = async (userId: string, payload: Partial<Business>): Promise<Business | null> => {
  const existing = await getMyBusiness(userId);
  if (existing) {
    const { data, error } = await supabase.from('businesses').update(payload).eq('id', existing.id).select('*').maybeSingle();
    if (error) throw error;
    return data as Business;
  }
  const { data, error } = await supabase.from('businesses').insert({ ...payload, owner_id: userId }).select('*').maybeSingle();
  if (error) throw error;
  return data as Business;
};

export const getMyOffers = async (businessId: string): Promise<Offer[]> => {
  const { data } = await supabase.from('offers').select('*').eq('business_id', businessId).order('created_at', { ascending: false });
  return (data as Offer[]) || [];
};

export const getOfferStats = async (offerId: string): Promise<OfferStats | null> => {
  const { data } = await supabase.from('offer_stats').select('*').eq('offer_id', offerId).maybeSingle();
  return (data as OfferStats) || null;
};

export const getBusinessAggregateStats = async (businessId: string) => {
  const { data } = await supabase.from('offer_stats').select('*').eq('business_id', businessId);
  const rows = (data as OfferStats[]) || [];
  return rows.reduce((acc, r) => ({
    views: acc.views + (r.views || 0),
    clicks: acc.clicks + (r.clicks || 0),
    saves: acc.saves + (r.saves || 0),
    calls: acc.calls + (r.calls || 0),
    directions: acc.directions + (r.directions || 0),
    notifications_sent: acc.notifications_sent + (r.notifications_sent || 0),
    unique_users: acc.unique_users + (r.unique_users || 0),
  }), { views: 0, clicks: 0, saves: 0, calls: 0, directions: 0, notifications_sent: 0, unique_users: 0 });
};

export const countActiveOffers = async (businessId: string): Promise<number> => {
  const { count } = await supabase
    .from('offers')
    .select('id', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .eq('status', 'active');
  return count || 0;
};

export const requestPlanChange = async (businessId: string, plan: string, price: number): Promise<Subscription | null> => {
  const { data, error } = await supabase.from('subscriptions').insert({
    business_id: businessId,
    plan, price,
    status: plan === 'free' ? 'active' : 'pending',
    started_at: plan === 'free' ? new Date().toISOString() : null,
  }).select('*').maybeSingle();
  if (error) throw error;
  if (plan === 'free') {
    await supabase.from('businesses').update({ subscription_plan: 'free', subscription_status: 'active' }).eq('id', businessId);
  }
  return data as Subscription;
};

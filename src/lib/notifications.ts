import { supabase } from './supabase';
import type { Offer, Business } from '@/types';

/**
 * Dispatch in-app notifications for an activated offer based on target_type.
 * Real push (FCM) handled by existing push infra; here we persist notifications and bump stats.
 */
export const dispatchOfferNotifications = async (offer: Offer, business?: Business | null) => {
  if (!offer.business_id) return { count: 0 };

  const target = offer.target_type || 'all';
  let query = supabase.from('profiles').select('id');

  if (target === 'city' && (offer.target_city || offer.city)) {
    query = query.eq('city', offer.target_city || offer.city);
  } else if (target === 'zone' && (offer.target_zone || offer.area)) {
    query = query.eq('zone', offer.target_zone || offer.area);
  } else if (target === 'category') {
    // no user-side category yet — fallback to all
  }

  let userIds: string[] = [];

  if (target === 'followers') {
    const { data } = await supabase.from('business_followers').select('user_id').eq('business_id', offer.business_id);
    userIds = (data || []).map(d => d.user_id as string);
  } else {
    const { data } = await query;
    userIds = (data || []).map(d => (d as { id: string }).id);
  }

  if (userIds.length === 0) return { count: 0 };

  const bizName = business?.business_name || 'Business';
  const discount = offer.discount_percent ? ` ${offer.discount_percent}%` : '';
  const rows = userIds.map(uid => ({
    user_id: uid,
    business_id: offer.business_id,
    offer_id: offer.id,
    title: `Ofertă nouă de la ${bizName}`,
    body: `${offer.title}${discount ? ` – Economisești${discount}` : ''}${offer.end_date ? ` până la ${offer.end_date}` : ''}.`,
    image_url: offer.image_url || null,
    type: 'new_offer' as const,
  }));

  await supabase.from('notifications').insert(rows);

  // bump notifications_sent via RPC (one per send batch)
  for (let i = 0; i < userIds.length; i++) {
    await supabase.rpc('increment_offer_stat', { p_offer_id: offer.id, p_field: 'notifications_sent' });
    if (i >= 0) break; // single increment representing the batch
  }

  return { count: userIds.length };
};

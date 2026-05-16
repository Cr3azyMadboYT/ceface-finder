import { supabase } from './supabase';

type EventType = 'view' | 'click' | 'open_map' | 'favorite';

const trackedViews = new Set<string>();

const STAT_FIELD: Record<EventType, string> = {
  view: 'views',
  click: 'clicks',
  open_map: 'directions',
  favorite: 'saves',
};

export const trackEvent = async (
  offerId: string,
  eventType: EventType,
  userId?: string
) => {
  if (eventType === 'view') {
    const key = `${offerId}_view`;
    if (trackedViews.has(key)) return;
    trackedViews.add(key);
  }

  try {
    await supabase.from('offer_events').insert({
      offer_id: offerId,
      user_id: userId || null,
      event_type: eventType,
    });
    // Aggregate stats (no-op if RPC missing in older DBs)
    await supabase.rpc('increment_offer_stat', { p_offer_id: offerId, p_field: STAT_FIELD[eventType] });
  } catch {
    // Silent — analytics must not break UX
  }
};

export const trackCall = async (offerId: string) => {
  try { await supabase.rpc('increment_offer_stat', { p_offer_id: offerId, p_field: 'calls' }); } catch { /* noop */ }
};

import { supabase } from './supabase';

type EventType = 'view' | 'click' | 'open_map' | 'favorite';

const trackedViews = new Set<string>();

export const trackEvent = async (
  offerId: string,
  eventType: EventType,
  userId?: string
) => {
  // Deduplicate views per session
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
  } catch (e) {
    console.error('Analytics tracking failed:', e);
  }
};

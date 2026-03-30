import { Offer } from '@/types';

/**
 * Build a Date from offer's date + time fields.
 * Returns null if date is missing.
 */
const buildOfferEnd = (offer: Offer): Date | null => {
  if (!offer.date) return null;
  const timePart = offer.time || '23:59';
  return new Date(`${offer.date}T${timePart}`);
};

/** True when a limited_offer has passed its date+time */
export const isOfferExpired = (offer: Offer): boolean => {
  if (offer.offer_type !== 'limited_offer') return false;
  const end = buildOfferEnd(offer);
  if (!end) return false;
  return end.getTime() < Date.now();
};

/** True when a limited_offer expires today */
export const isOfferEndingToday = (offer: Offer): boolean => {
  if (offer.offer_type !== 'limited_offer') return false;
  const end = buildOfferEnd(offer);
  if (!end) return false;
  const now = new Date();
  return (
    end.getFullYear() === now.getFullYear() &&
    end.getMonth() === now.getMonth() &&
    end.getDate() === now.getDate() &&
    end.getTime() > now.getTime()
  );
};

/**
 * Returns a human-readable countdown label for limited_offer.
 * - Expired → "Expirată"
 * - Ending today → "Expiră în Xh Ym" or "Expiră azi la HH:MM"
 * - Future → "Valabilă până pe DD.MM"
 */
export const getOfferCountdownLabel = (offer: Offer): string | null => {
  if ((offer.offer_type || 'event') !== 'limited_offer') return null;
  const end = buildOfferEnd(offer);
  if (!end) return null;

  const now = Date.now();
  const diff = end.getTime() - now;

  if (diff <= 0) return 'Expirată';

  if (isOfferEndingToday(offer)) {
    const hours = Math.floor(diff / 3_600_000);
    const mins = Math.floor((diff % 3_600_000) / 60_000);
    if (hours > 0) return `Expiră în ${hours}h ${mins}m`;
    return `Expiră în ${mins}m`;
  }

  const dd = String(end.getDate()).padStart(2, '0');
  const mm = String(end.getMonth() + 1).padStart(2, '0');
  const hh = String(end.getHours()).padStart(2, '0');
  const mi = String(end.getMinutes()).padStart(2, '0');
  return `Valabilă până pe ${dd}.${mm} la ${hh}:${mi}`;
};

/**
 * High-level display helper.
 * Returns { label, isExpired, isUrgent } for any offer.
 */
export const formatOfferDisplay = (offer: Offer) => {
  const type = offer.offer_type || 'event';
  if (type === 'event') {
    return { label: null, isExpired: false, isUrgent: false };
  }
  const expired = isOfferExpired(offer);
  const urgent = !expired && isOfferEndingToday(offer);
  return {
    label: getOfferCountdownLabel(offer),
    isExpired: expired,
    isUrgent: urgent,
  };
};

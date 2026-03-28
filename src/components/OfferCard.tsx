import React, { useEffect, useRef } from 'react';
import { Offer } from '@/types';
import { Heart, MapPin, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { trackEvent } from '@/lib/analytics';

interface OfferCardProps {
  offer: Offer;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  compact?: boolean;
}

const OfferCard: React.FC<OfferCardProps> = ({ offer, isFavorite, onToggleFavorite, compact }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);

  // Track view when card enters viewport
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          trackEvent(offer.id, 'view', user?.id);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [offer.id, user?.id]);

  const handleClick = () => {
    trackEvent(offer.id, 'click', user?.id);
    navigate(`/offer/${offer.id}`);
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      trackEvent(offer.id, 'favorite', user?.id);
      onToggleFavorite();
    }
  };

  const isPromo = offer.is_promoted && (!offer.promotion_expires_at || new Date(offer.promotion_expires_at) > new Date());

  return (
    <div
      ref={cardRef}
      onClick={handleClick}
      className={`relative rounded-2xl overflow-hidden cursor-pointer card-gradient border transition-all hover:shadow-neon group ${
        compact ? 'flex gap-3 p-3' : ''
      } ${isPromo ? 'border-primary/40 shadow-neon' : 'border-border/50'}`}
    >
      {/* Promo badge */}
      {isPromo && !compact && (
        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-primary/90 text-primary-foreground text-[10px] font-bold backdrop-blur-sm">
          🔥 PROMO
        </div>
      )}

      {offer.image_url && (
        <div className={compact ? 'w-20 h-20 rounded-xl overflow-hidden flex-shrink-0' : 'aspect-[16/10] overflow-hidden'}>
          <img src={offer.image_url} alt={offer.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      )}

      <div className={compact ? 'flex-1 min-w-0' : 'p-4'}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">{offer.category}</span>
              {isPromo && compact && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-bold">🔥</span>
              )}
            </div>
            <h3 className="font-semibold text-foreground truncate font-heading text-sm mt-0.5">{offer.title}</h3>
          </div>
          {onToggleFavorite && (
            <button onClick={handleFavorite} className="flex-shrink-0 p-1">
              <Heart className={`w-4 h-4 transition-colors ${isFavorite ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          {offer.location && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 flex-shrink-0" />{offer.city || offer.location}
            </span>
          )}
          {offer.date && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 flex-shrink-0" />{offer.date}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfferCard;

import React from 'react';
import { Offer } from '@/types';
import { Heart, MapPin, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OfferCardProps {
  offer: Offer;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  compact?: boolean;
}

const OfferCard: React.FC<OfferCardProps> = ({ offer, isFavorite, onToggleFavorite, compact }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/offer/${offer.id}`)}
      className={`relative rounded-2xl overflow-hidden cursor-pointer card-gradient border border-border/50 transition-all hover:shadow-neon group ${
        compact ? 'flex gap-3 p-3' : ''
      }`}
    >
      {offer.image_url && (
        <div className={compact ? 'w-20 h-20 rounded-xl overflow-hidden flex-shrink-0' : 'aspect-[16/10] overflow-hidden'}>
          <img src={offer.image_url} alt={offer.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      )}

      <div className={compact ? 'flex-1 min-w-0' : 'p-4'}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">{offer.category}</span>
            <h3 className="font-semibold text-foreground truncate font-heading text-sm mt-0.5">{offer.title}</h3>
          </div>
          {onToggleFavorite && (
            <button
              onClick={e => { e.stopPropagation(); onToggleFavorite(); }}
              className="flex-shrink-0 p-1"
            >
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

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Offer, translations } from '@/types';
import { trackEvent } from '@/lib/analytics';
import { ArrowLeft, MapPin, Calendar, Clock, Heart, ExternalLink, Phone, Navigation } from 'lucide-react';

const OfferDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, language } = useAuth();
  const t = translations[language];
  const [offer, setOffer] = useState<Offer | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOffer = async () => {
      const { data } = await supabase.from('offers').select('*').eq('id', id).single();
      if (data) {
        setOffer(data);
        trackEvent(data.id, 'view', user?.id);
      }
      setLoading(false);
    };
    const checkFav = async () => {
      if (!user || !id) return;
      const { data } = await supabase.from('favorites').select('id').eq('user_id', user.id).eq('offer_id', id).maybeSingle();
      setIsFavorite(!!data);
    };
    fetchOffer();
    checkFav();
  }, [id, user]);

  const toggleFavorite = async () => {
    if (!user || !offer) return;
    trackEvent(offer.id, 'favorite', user.id);
    if (isFavorite) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('offer_id', offer.id);
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, offer_id: offer.id });
    }
    setIsFavorite(!isFavorite);
  };

  const openLocation = () => {
    if (!offer) return;
    trackEvent(offer.id, 'open_map', user?.id);
    let url = offer.location_url;
    if (!url && offer.location) {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(offer.location)}`;
    }
    if (url) window.open(url, '_blank');
  };

  const openContact = () => {
    if (!offer) return;
    if (offer.phone) {
      window.location.href = `tel:${offer.phone}`;
    } else if (offer.contact_link) {
      window.open(offer.contact_link, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spinner" />
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <p className="text-muted-foreground mb-4">Oferta nu a fost găsită</p>
        <button onClick={() => navigate('/')} className="text-primary hover:underline">Acasă</button>
      </div>
    );
  }

  const hasLocation = !!(offer.location_url || offer.location);
  const hasContact = !!(offer.contact_link || offer.phone);
  const isPromo = offer.is_promoted && (!offer.promotion_expires_at || new Date(offer.promotion_expires_at) > new Date());

  return (
    <div className="min-h-screen bg-background">
      {/* Image */}
      <div className="relative">
        {offer.image_url ? (
          <img src={offer.image_url} alt={offer.title} className="w-full aspect-[16/10] object-cover" />
        ) : (
          <div className="w-full aspect-[16/10] bg-card flex items-center justify-center">
            <span className="text-muted-foreground text-4xl">📍</span>
          </div>
        )}
        <button onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 rounded-full glass flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        {isPromo && (
          <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-primary/90 text-primary-foreground text-xs font-bold backdrop-blur-sm">
            🔥 PROMO
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-5 space-y-4 animate-slide-up">
        <div>
          <span className="text-xs uppercase tracking-wider text-primary font-semibold">{offer.category}</span>
          <h1 className="text-2xl font-bold font-heading text-foreground mt-1">{offer.title}</h1>
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          {offer.location && (
            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{offer.location}</span>
          )}
          {offer.date && (
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{offer.date}</span>
          )}
          {offer.time && (
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{offer.time}</span>
          )}
        </div>

        {offer.description && (
          <p className="text-foreground/80 leading-relaxed">{offer.description}</p>
        )}

        {/* "Merg acum" big button */}
        {hasLocation && (
          <button onClick={openLocation}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-primary text-primary-foreground font-bold text-lg shadow-neon-strong">
            <Navigation className="w-6 h-6" /> {t.goNow}
          </button>
        )}

        {/* Secondary actions */}
        <div className="flex gap-3">
          {user && (
            <button onClick={toggleFavorite}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border font-semibold transition-all ${
                isFavorite ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
              }`}>
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-primary' : ''}`} />
              {isFavorite ? t.saved : t.save}
            </button>
          )}
          {hasContact && (
            <button onClick={openContact}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-foreground font-semibold hover:bg-card transition-all">
              {offer.phone ? <Phone className="w-5 h-5" /> : <ExternalLink className="w-5 h-5" />}
              {t.contact}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfferDetails;

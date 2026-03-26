import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Offer, translations } from '@/types';
import OfferCard from '@/components/OfferCard';
import BottomNav from '@/components/BottomNav';
import PullToRefresh from '@/components/PullToRefresh';
import { Heart } from 'lucide-react';

const Favorites = () => {
  const { user, language } = useAuth();
  const t = translations[language];
  const [offers, setOffers] = useState<Offer[]>([]);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    if (!user) return;
    const { data: favs } = await supabase.from('favorites').select('offer_id').eq('user_id', user.id);
    if (!favs || favs.length === 0) { setOffers([]); setFavIds(new Set()); setLoading(false); return; }
    const ids = favs.map(f => f.offer_id);
    setFavIds(new Set(ids));
    const { data: offersData } = await supabase.from('offers').select('*').in('id', ids).eq('is_active', true);
    if (offersData) setOffers(offersData);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchFavorites(); }, [fetchFavorites]);

  const removeFavorite = async (offerId: string) => {
    if (!user) return;
    await supabase.from('favorites').delete().eq('user_id', user.id).eq('offer_id', offerId);
    setOffers(prev => prev.filter(o => o.id !== offerId));
    setFavIds(prev => { const n = new Set(prev); n.delete(offerId); return n; });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <PullToRefresh onRefresh={fetchFavorites}>
        <div className="px-4 pt-6 pb-4">
          <h1 className="text-2xl font-bold font-heading text-foreground">{t.favorites}</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spinner" />
          </div>
        ) : offers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Heart className="w-12 h-12 mb-3 opacity-30" />
            <p>{t.noFavorites}</p>
          </div>
        ) : (
          <div className="px-4 space-y-3">
            {offers.map(o => (
              <OfferCard key={o.id} offer={o} isFavorite={true} onToggleFavorite={() => removeFavorite(o.id)} compact />
            ))}
          </div>
        )}
        <div className="h-8" />
      </PullToRefresh>
      <BottomNav />
    </div>
  );
};

export default Favorites;

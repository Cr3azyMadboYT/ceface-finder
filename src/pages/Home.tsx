import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Offer, CATEGORIES, translations } from '@/types';
import OfferCard from '@/components/OfferCard';
import BottomNav from '@/components/BottomNav';
import PullToRefresh from '@/components/PullToRefresh';
import { Search } from 'lucide-react';

const Home = () => {
  const { user, language } = useAuth();
  const t = translations[language];
  const [offers, setOffers] = useState<Offer[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchOffers = useCallback(async () => {
    const { data } = await supabase
      .from('offers')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (data) setOffers(data);
    setLoading(false);
  }, []);

  const fetchFavorites = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('favorites').select('offer_id').eq('user_id', user.id);
    if (data) setFavorites(new Set(data.map(f => f.offer_id)));
  }, [user]);

  useEffect(() => { fetchOffers(); fetchFavorites(); }, [fetchOffers, fetchFavorites]);

  const toggleFavorite = async (offerId: string) => {
    if (!user) return;
    const isFav = favorites.has(offerId);
    if (isFav) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('offer_id', offerId);
      setFavorites(prev => { const n = new Set(prev); n.delete(offerId); return n; });
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, offer_id: offerId });
      setFavorites(prev => new Set(prev).add(offerId));
    }
  };

  const handleRefresh = async () => {
    await Promise.all([fetchOffers(), fetchFavorites()]);
  };

  const filtered = offers.filter(o => {
    const matchSearch = !search || o.title.toLowerCase().includes(search.toLowerCase()) ||
      o.description?.toLowerCase().includes(search.toLowerCase()) ||
      o.category?.toLowerCase().includes(search.toLowerCase());
    const matchCat = !activeCategory || o.category === activeCategory;
    return matchSearch && matchCat;
  });

  const today = new Date().toISOString().split('T')[0];
  const dayOfWeek = new Date().getDay();
  const isWeekendSoon = dayOfWeek >= 4;

  const popular = filtered.slice(0, 6);
  const tonight = filtered.filter(o => o.date === today);
  const weekend = isWeekendSoon ? filtered.filter(o => {
    if (!o.date) return false;
    const d = new Date(o.date).getDay();
    return d === 0 || d === 5 || d === 6;
  }) : [];

  return (
    <div className="min-h-screen bg-background pb-20">
      <PullToRefresh onRefresh={handleRefresh}>
        {/* Header */}
        <div className="px-4 pt-6 pb-2">
          <h1 className="text-2xl font-bold font-heading text-gradient">CeFaci</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Descoperă ce se întâmplă lângă tine</p>
        </div>

        {/* Search */}
        <div className="px-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <input
              type="text" placeholder={t.search} value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="px-4 mb-6">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            <button
              onClick={() => setActiveCategory('')}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                !activeCategory ? 'bg-gradient-primary text-primary-foreground shadow-neon' : 'bg-card text-muted-foreground border border-border'
              }`}
            >
              {t.allCategories}
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(activeCategory === cat ? '' : cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat ? 'bg-gradient-primary text-primary-foreground shadow-neon' : 'bg-card text-muted-foreground border border-border'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spinner" />
          </div>
        ) : (
          <div className="space-y-6 px-4">
            {/* Popular */}
            {popular.length > 0 && (
              <section>
                <h2 className="text-lg font-bold font-heading text-foreground mb-3">{t.popular}</h2>
                <div className="grid grid-cols-2 gap-3">
                  {popular.map(o => (
                    <OfferCard key={o.id} offer={o} isFavorite={favorites.has(o.id)} onToggleFavorite={() => toggleFavorite(o.id)} />
                  ))}
                </div>
              </section>
            )}

            {/* Tonight */}
            {tonight.length > 0 && (
              <section>
                <h2 className="text-lg font-bold font-heading text-foreground mb-3">{t.tonight}</h2>
                <div className="space-y-3">
                  {tonight.map(o => (
                    <OfferCard key={o.id} offer={o} isFavorite={favorites.has(o.id)} onToggleFavorite={() => toggleFavorite(o.id)} compact />
                  ))}
                </div>
              </section>
            )}

            {/* Weekend */}
            {weekend.length > 0 && (
              <section>
                <h2 className="text-lg font-bold font-heading text-foreground mb-3">{t.weekend}</h2>
                <div className="grid grid-cols-2 gap-3">
                  {weekend.map(o => (
                    <OfferCard key={o.id} offer={o} isFavorite={favorites.has(o.id)} onToggleFavorite={() => toggleFavorite(o.id)} />
                  ))}
                </div>
              </section>
            )}

            {/* All offers */}
            {filtered.length > 0 && popular.length < filtered.length && (
              <section>
                <h2 className="text-lg font-bold font-heading text-foreground mb-3">{t.nearby}</h2>
                <div className="space-y-3">
                  {filtered.slice(6).map(o => (
                    <OfferCard key={o.id} offer={o} isFavorite={favorites.has(o.id)} onToggleFavorite={() => toggleFavorite(o.id)} compact />
                  ))}
                </div>
              </section>
            )}

            {filtered.length === 0 && (
              <div className="text-center py-20 text-muted-foreground">{t.noOffers}</div>
            )}
          </div>
        )}
        <div className="h-8" />
      </PullToRefresh>
      <BottomNav />
    </div>
  );
};

export default Home;

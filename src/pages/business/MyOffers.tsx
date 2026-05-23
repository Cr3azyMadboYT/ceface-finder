import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Offer, OfferStatus } from '@/types';
import BottomNav from '@/components/BottomNav';
import OfferCard from '@/components/OfferCard';
import { ArrowLeft, BarChart3, Pencil, EyeOff } from 'lucide-react';

const TABS: { id: OfferStatus; label: string }[] = [
  { id: 'active', label: 'Active' },
  { id: 'pending', label: 'În așteptare' },
  { id: 'expired', label: 'Expirate' },
  { id: 'rejected', label: 'Respinse' },
  { id: 'draft', label: 'Draft' },
];

const MyOffers: React.FC = () => {
  const { business } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<OfferStatus>('active');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!business) return;
    setLoading(true);
    const { data } = await supabase.from('offers').select('*')
      .eq('business_id', business.id)
      .eq('status', tab)
      .order('created_at', { ascending: false });
    setOffers((data as Offer[]) || []);
    setLoading(false);
  }, [business, tab]);

  useEffect(() => { load(); }, [load]);

  const deactivate = async (id: string) => {
    await supabase.from('offers').update({ status: 'draft', is_active: false }).eq('id', id);
    load();
  };

  if (!business) {
    return (
      <div className="min-h-screen bg-background safe-pb px-4 pt-8 text-center">
        <p className="text-muted-foreground">Completează profilul business mai întâi.</p>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background safe-pb">
      <div className="px-4 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-card text-muted-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold font-heading text-foreground">Ofertele mele</h1>
      </div>

      <div className="px-4 mb-4 overflow-x-auto hide-scrollbar">
        <div className="flex gap-2 min-w-max">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                tab === t.id ? 'bg-gradient-primary text-primary-foreground shadow-neon' : 'bg-card text-muted-foreground border border-border'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spinner" />
          </div>
        ) : offers.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">Nicio ofertă în această secțiune.</p>
        ) : offers.map(o => (
          <div key={o.id} className="space-y-2">
            <OfferCard offer={o} />
            {o.rejection_reason && (
              <p className="text-xs text-destructive px-2">Motiv: {o.rejection_reason}</p>
            )}
            <div className="flex gap-2">
              <button onClick={() => navigate(`/business/stats/${o.id}`)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-border text-foreground text-sm font-medium">
                <BarChart3 className="w-4 h-4" /> Statistici
              </button>
              <button onClick={() => navigate(`/business/create?edit=${o.id}`)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-border text-foreground text-sm font-medium">
                <Pencil className="w-4 h-4" /> Editează
              </button>
              <button onClick={() => deactivate(o.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-border text-muted-foreground text-sm font-medium">
                <EyeOff className="w-4 h-4" /> Dezactivează
              </button>
            </div>
          </div>
        ))}
        <div className="h-20" />
      </div>

      <BottomNav />
    </div>
  );
};

export default MyOffers;

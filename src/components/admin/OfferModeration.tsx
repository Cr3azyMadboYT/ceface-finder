import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Offer, Business } from '@/types';
import { dispatchOfferNotifications } from '@/lib/notifications';
import OfferCard from '@/components/OfferCard';
import { Check, X } from 'lucide-react';

const OfferModeration: React.FC = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [reasonId, setReasonId] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('offers').select('*').eq('status', 'pending')
      .order('created_at', { ascending: false });
    setOffers((data as Offer[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const approve = async (o: Offer) => {
    await supabase.from('offers').update({ status: 'active', rejection_reason: null }).eq('id', o.id);
    if (o.business_id) {
      const { data: b } = await supabase.from('businesses').select('*').eq('id', o.business_id).maybeSingle();
      await dispatchOfferNotifications({ ...o, status: 'active' }, b as Business);
    }
    load();
  };

  const reject = async (id: string) => {
    await supabase.from('offers').update({ status: 'rejected', rejection_reason: reason || 'Respins de admin' }).eq('id', id);
    setReasonId(null); setReason('');
    load();
  };

  if (loading) return <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spinner" /></div>;
  if (offers.length === 0) return <p className="text-center py-10 text-muted-foreground">Nicio ofertă în așteptare.</p>;

  return (
    <div className="space-y-4">
      {offers.map(o => (
        <div key={o.id} className="space-y-2">
          <OfferCard offer={o} />
          <div className="flex flex-wrap gap-2">
            <button onClick={() => approve(o)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
              <Check className="w-3.5 h-3.5" /> Aprobă + Notifică
            </button>
            <button onClick={() => setReasonId(reasonId === o.id ? null : o.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-destructive/30 text-destructive text-xs font-medium">
              <X className="w-3.5 h-3.5" /> Respinge
            </button>
          </div>
          {reasonId === o.id && (
            <div className="space-y-2">
              <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Motiv"
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground" />
              <button onClick={() => reject(o.id)} className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs">Confirmă</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default OfferModeration;

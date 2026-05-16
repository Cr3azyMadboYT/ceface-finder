import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Business } from '@/types';
import { Check, X, ShieldCheck } from 'lucide-react';

const BusinessModeration: React.FC = () => {
  const [items, setItems] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [reasonId, setReasonId] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('businesses').select('*')
      .order('created_at', { ascending: false });
    setItems((data as Business[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const approve = async (id: string) => {
    await supabase.from('businesses').update({ is_approved: true, rejection_reason: null }).eq('id', id);
    load();
  };
  const reject = async (id: string) => {
    await supabase.from('businesses').update({ is_approved: false, rejection_reason: reason || 'Respins de admin' }).eq('id', id);
    setReasonId(null); setReason('');
    load();
  };
  const verify = async (id: string, value: boolean) => {
    await supabase.from('businesses').update({ is_verified: value }).eq('id', id);
    load();
  };
  const changePlan = async (id: string, plan: string) => {
    await supabase.from('businesses').update({ subscription_plan: plan, subscription_status: 'active' }).eq('id', id);
    load();
  };

  if (loading) return <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spinner" /></div>;
  if (items.length === 0) return <p className="text-center py-10 text-muted-foreground">Niciun business.</p>;

  return (
    <div className="space-y-3">
      {items.map(b => (
        <div key={b.id} className="p-4 rounded-2xl card-gradient border border-border/50">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground truncate">{b.business_name}</h3>
              <p className="text-xs text-muted-foreground truncate">{b.email || b.phone || b.city}</p>
              <div className="flex gap-2 mt-1 flex-wrap">
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${b.is_approved ? 'bg-primary/20 text-primary' : 'bg-accent/20 text-accent'}`}>
                  {b.is_approved ? 'Aprobat' : 'Pending'}
                </span>
                {b.is_verified && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary">✓ Verificat</span>}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground capitalize">{b.subscription_plan}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {!b.is_approved && (
              <button onClick={() => approve(b.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
                <Check className="w-3.5 h-3.5" /> Aprobă
              </button>
            )}
            <button onClick={() => setReasonId(reasonId === b.id ? null : b.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-destructive/30 text-destructive text-xs font-medium">
              <X className="w-3.5 h-3.5" /> Respinge
            </button>
            <button onClick={() => verify(b.id, !b.is_verified)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-foreground text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> {b.is_verified ? 'Scoate verificat' : 'Verifică'}
            </button>
            <select value={b.subscription_plan} onChange={e => changePlan(b.id, e.target.value)}
              className="px-2 py-1 rounded-lg bg-background border border-border text-foreground text-xs">
              <option value="free">Free</option><option value="basic">Basic</option><option value="pro">Pro</option><option value="premium">Premium</option>
            </select>
          </div>

          {reasonId === b.id && (
            <div className="mt-3 space-y-2">
              <input value={reason} onChange={e => setReason(e.target.value)}
                placeholder="Motiv respingere"
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground" />
              <button onClick={() => reject(b.id)} className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs">Confirmă</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default BusinessModeration;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PLANS, getPlan } from '@/lib/plans';
import { requestPlanChange } from '@/lib/businessApi';
import BottomNav from '@/components/BottomNav';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';

const Plans: React.FC = () => {
  const { business, refreshBusiness } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  const current = getPlan(business?.subscription_plan);

  const choose = async (planId: string, price: number) => {
    if (!business) { navigate('/business/profile'); return; }
    setLoading(planId);
    setMsg('');
    try {
      await requestPlanChange(business.id, planId, price);
      await refreshBusiness();
      setMsg(planId === 'free'
        ? 'Plan activ.'
        : 'Cerere trimisă. Adminul va activa planul după confirmarea plății.');
    } catch (e) {
      setMsg((e as Error).message);
    }
    setLoading(null);
  };

  return (
    <div className="min-h-screen bg-background safe-pb">
      <div className="px-4 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-card text-muted-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold font-heading text-foreground">Planuri și prețuri</h1>
      </div>

      {msg && <p className="px-4 mb-3 text-sm text-primary">{msg}</p>}

      <div className="px-4 space-y-3 max-w-lg mx-auto">
        {PLANS.map(p => {
          const isCurrent = current.id === p.id;
          return (
            <div key={p.id}
              className={`p-5 rounded-2xl card-gradient border transition-all relative ${
                p.recommended ? 'border-primary/60 shadow-neon' : 'border-border/50'
              } ${isCurrent ? 'ring-2 ring-primary' : ''}`}>
              {p.recommended && (
                <div className="absolute -top-2 right-4 px-2 py-0.5 rounded-full bg-gradient-primary text-primary-foreground text-[10px] font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> RECOMANDAT
                </div>
              )}
              <div className="flex items-baseline justify-between mb-2">
                <h3 className="text-xl font-bold font-heading text-foreground">{p.name}</h3>
                <div>
                  <span className="text-2xl font-bold text-gradient">{p.price}</span>
                  <span className="text-xs text-muted-foreground"> lei/lună</span>
                </div>
              </div>
              <ul className="space-y-1.5 mb-4">
                {p.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground/90">
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                disabled={isCurrent || loading !== null}
                onClick={() => choose(p.id, p.price)}
                className={`w-full py-2.5 rounded-xl font-semibold transition-all ${
                  isCurrent
                    ? 'bg-card text-muted-foreground'
                    : 'bg-gradient-primary text-primary-foreground shadow-neon'
                } disabled:opacity-60`}>
                {isCurrent ? 'Plan curent' : loading === p.id ? '...' : p.price === 0 ? 'Alege' : 'Upgrade'}
              </button>
            </div>
          );
        })}
        <div className="h-20" />
      </div>

      <BottomNav />
    </div>
  );
};

export default Plans;

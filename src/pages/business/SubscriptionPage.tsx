import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getPlan } from '@/lib/plans';
import { countActiveOffers } from '@/lib/businessApi';
import BottomNav from '@/components/BottomNav';
import { ArrowLeft, Crown, RefreshCw } from 'lucide-react';

const SubscriptionPage: React.FC = () => {
  const { business } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (business) countActiveOffers(business.id).then(setActive);
  }, [business]);

  if (!business) return (
    <div className="min-h-screen bg-background safe-pb px-4 pt-8 text-center text-muted-foreground">
      Completează profilul business mai întâi.
      <BottomNav />
    </div>
  );

  const plan = getPlan(business.subscription_plan);
  const max = plan.maxActiveOffers === -1 ? '∞' : plan.maxActiveOffers;

  return (
    <div className="min-h-screen bg-background safe-pb">
      <div className="px-4 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-card text-muted-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold font-heading text-foreground">Abonamentul meu</h1>
      </div>

      <div className="px-4 space-y-3 max-w-lg mx-auto">
        <div className="p-5 rounded-2xl card-gradient border border-border/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center shadow-neon">
              <Crown className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Plan curent</p>
              <p className="text-xl font-bold font-heading text-foreground">{plan.name}</p>
            </div>
          </div>
          <div className="space-y-1 text-sm">
            <p className="flex justify-between text-foreground"><span className="text-muted-foreground">Status</span> <span className="capitalize">{business.subscription_status}</span></p>
            <p className="flex justify-between text-foreground"><span className="text-muted-foreground">Preț</span> <span>{plan.price} lei/lună</span></p>
            <p className="flex justify-between text-foreground"><span className="text-muted-foreground">Expiră</span> <span>{business.subscription_expires_at ? new Date(business.subscription_expires_at).toLocaleDateString('ro-RO') : '—'}</span></p>
            <p className="flex justify-between text-foreground"><span className="text-muted-foreground">Oferte active</span> <span>{active} / {max}</span></p>
          </div>
        </div>

        <button onClick={() => navigate('/business/plans')}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-neon">
          <RefreshCw className="w-5 h-5" /> Schimbă planul / Upgrade
        </button>
        <div className="h-20" />
      </div>

      <BottomNav />
    </div>
  );
};

export default SubscriptionPage;

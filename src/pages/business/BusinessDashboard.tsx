import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import BusinessBottomNav from '@/components/BusinessBottomNav';
import { getBusinessAggregateStats } from '@/lib/businessApi';
import { getPlan } from '@/lib/plans';
import { Eye, MousePointerClick, Users, Bell, TrendingUp, Plus, List, BarChart3, Store, Crown, AlertCircle } from 'lucide-react';

const BusinessDashboard: React.FC = () => {
  const { user, business, refreshBusiness } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ views: 0, clicks: 0, saves: 0, calls: 0, directions: 0, notifications_sent: 0, unique_users: 0 });
  const [activeOffers, setActiveOffers] = useState(0);

  useEffect(() => {
    refreshBusiness();
  }, [user]); // eslint-disable-line

  useEffect(() => {
    const load = async () => {
      if (!business) return;
      const agg = await getBusinessAggregateStats(business.id);
      setStats(agg);
      const { count } = await supabase.from('offers').select('id', { count: 'exact', head: true })
        .eq('business_id', business.id).eq('status', 'active');
      setActiveOffers(count || 0);
    };
    load();
  }, [business]);

  if (!business) {
    return (
      <div className="min-h-screen bg-background safe-pb px-4 pt-8">
        <div className="max-w-md mx-auto text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-primary flex items-center justify-center shadow-neon">
            <Store className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold font-heading text-foreground">Bun venit pe CeFaci Business</h1>
          <p className="text-muted-foreground">Completează-ți profilul business ca să poți publica oferte.</p>
          <button onClick={() => navigate('/business/profile')}
            className="w-full py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-neon">
            Completează profil business
          </button>
        </div>
        <BusinessBottomNav />
      </div>
    );
  }

  const plan = getPlan(business.subscription_plan);
  const conv = stats.views > 0 ? Math.round((stats.clicks / stats.views) * 100) : 0;

  const kpis = [
    { label: 'Oferte active', value: activeOffers, icon: List },
    { label: 'Vizualizări', value: stats.views, icon: Eye },
    { label: 'Click-uri', value: stats.clicks, icon: MousePointerClick },
    { label: 'Clienți unici', value: stats.unique_users, icon: Users },
    { label: 'Notificări trimise', value: stats.notifications_sent, icon: Bell },
    { label: 'Conversie', value: `${conv}%`, icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-background safe-pb">
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold font-heading text-foreground truncate">{business.business_name}</h1>
            <p className="text-sm text-muted-foreground">Plan: <span className="text-primary font-semibold">{plan.name}</span></p>
          </div>
          {business.is_verified && (
            <span className="px-2 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold">✓ Verificat</span>
          )}
        </div>
      </div>

      {!business.is_approved && (
        <div className="mx-4 mb-4 p-3 rounded-xl bg-accent/10 border border-accent/20 flex gap-2 text-sm">
          <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <p className="text-foreground">Profilul tău este în verificare. Vei putea publica oferte după aprobare.</p>
        </div>
      )}

      <div className="px-4 grid grid-cols-2 gap-3 mb-4">
        {kpis.map(k => (
          <div key={k.label} className="p-4 rounded-2xl card-gradient border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <k.icon className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">{k.label}</span>
            </div>
            <p className="text-2xl font-bold font-heading text-foreground">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="px-4 space-y-2 mb-4">
        <button onClick={() => navigate('/business/create')}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-neon">
          <Plus className="w-5 h-5" /> Creează ofertă
        </button>
        <div className="grid grid-cols-2 gap-2">
          <Link to="/business/offers" className="flex items-center justify-center gap-2 py-3 rounded-xl card-gradient border border-border/50 text-foreground font-medium">
            <List className="w-4 h-4" /> Ofertele mele
          </Link>
          <Link to="/business/stats" className="flex items-center justify-center gap-2 py-3 rounded-xl card-gradient border border-border/50 text-foreground font-medium">
            <BarChart3 className="w-4 h-4" /> Statistici
          </Link>
          <Link to="/business/profile" className="flex items-center justify-center gap-2 py-3 rounded-xl card-gradient border border-border/50 text-foreground font-medium">
            <Store className="w-4 h-4" /> Profil
          </Link>
          <Link to="/business/subscription" className="flex items-center justify-center gap-2 py-3 rounded-xl card-gradient border border-border/50 text-foreground font-medium">
            <Crown className="w-4 h-4" /> Abonament
          </Link>
        </div>
      </div>

      <div className="h-20" />
      <BusinessBottomNav />
    </div>
  );
};

export default BusinessDashboard;

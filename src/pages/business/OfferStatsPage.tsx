import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Offer, OfferStats } from '@/types';
import { getBusinessAggregateStats, getOfferStats } from '@/lib/businessApi';
import BottomNav from '@/components/BottomNav';
import { ArrowLeft, Eye, MousePointerClick, Bookmark, Phone, Navigation, Bell, Users, TrendingUp } from 'lucide-react';

const StatBar: React.FC<{ label: string; value: number | string; icon: React.ComponentType<{ className?: string }> }> = ({ label, value, icon: Icon }) => (
  <div className="p-4 rounded-2xl card-gradient border border-border/50">
    <div className="flex items-center gap-2 mb-1.5">
      <Icon className="w-4 h-4 text-primary" />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
    <p className="text-2xl font-bold font-heading text-foreground">{value}</p>
  </div>
);

const StatsView: React.FC<{ stats: OfferStats | { views: number; clicks: number; saves: number; calls: number; directions: number; notifications_sent: number; unique_users: number } }> = ({ stats }) => {
  const conv = stats.views > 0 ? Math.round((stats.clicks / stats.views) * 100) : 0;
  return (
    <div className="grid grid-cols-2 gap-3">
      <StatBar label="Vizualizări" value={stats.views} icon={Eye} />
      <StatBar label="Click-uri" value={stats.clicks} icon={MousePointerClick} />
      <StatBar label="Salvări" value={stats.saves} icon={Bookmark} />
      <StatBar label="Apeluri" value={stats.calls} icon={Phone} />
      <StatBar label="Navigări" value={stats.directions} icon={Navigation} />
      <StatBar label="Notificări trimise" value={stats.notifications_sent} icon={Bell} />
      <StatBar label="Clienți unici" value={stats.unique_users} icon={Users} />
      <StatBar label="Conversie" value={`${conv}%`} icon={TrendingUp} />
    </div>
  );
};

const OfferStatsPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { business } = useAuth();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [stats, setStats] = useState<OfferStats | null>(null);
  const [agg, setAgg] = useState({ views: 0, clicks: 0, saves: 0, calls: 0, directions: 0, notifications_sent: 0, unique_users: 0 });

  useEffect(() => {
    const load = async () => {
      if (id) {
        const { data } = await supabase.from('offers').select('*').eq('id', id).maybeSingle();
        setOffer(data as Offer);
        const s = await getOfferStats(id);
        setStats(s);
      } else if (business) {
        const a = await getBusinessAggregateStats(business.id);
        setAgg(a);
      }
    };
    load();
  }, [id, business]);

  return (
    <div className="min-h-screen bg-background safe-pb">
      <div className="px-4 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-card text-muted-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold font-heading text-foreground">{id ? 'Statistici ofertă' : 'Statistici generale'}</h1>
      </div>
      {id && offer && (
        <div className="px-4 mb-4">
          <p className="text-sm text-muted-foreground">Ofertă:</p>
          <p className="font-semibold text-foreground">{offer.title}</p>
        </div>
      )}
      <div className="px-4">
        <StatsView stats={stats || agg} />
        <div className="h-20" />
      </div>
      <BottomNav />
    </div>
  );
};

export default OfferStatsPage;

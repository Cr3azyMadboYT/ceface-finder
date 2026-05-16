import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { translations, PushLog } from '@/types';
import { BarChart3, TrendingUp, Eye, MousePointerClick, Megaphone, Bell } from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  totalBusinesses: number;
  pendingBusinesses: number;
  activeOffers: number;
  pendingOffers: number;
  viewsToday: number;
  clicksToday: number;
  estimatedRevenue: number;
}

const AdminDashboard: React.FC = () => {
  const { language } = useAuth();
  const t = translations[language];
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0, totalBusinesses: 0, pendingBusinesses: 0,
    activeOffers: 0, pendingOffers: 0, viewsToday: 0, clicksToday: 0, estimatedRevenue: 0,
  });
  const [recentPushes, setRecentPushes] = useState<PushLog[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const today = new Date().toISOString().split('T')[0];

      const [usersRes, bizRes, pendingBizRes, activeRes, pendingOfRes, viewsRes, clicksRes, pushRes, subsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('businesses').select('id', { count: 'exact', head: true }),
        supabase.from('businesses').select('id', { count: 'exact', head: true }).eq('is_approved', false),
        supabase.from('offers').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('offers').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('offer_events').select('id', { count: 'exact', head: true }).eq('event_type', 'view').gte('created_at', today),
        supabase.from('offer_events').select('id', { count: 'exact', head: true }).eq('event_type', 'click').gte('created_at', today),
        supabase.from('push_logs').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('subscriptions').select('price').eq('status', 'active'),
      ]);

      const revenue = (subsRes.data || []).reduce((s: number, r: { price?: number | null }) => s + (Number(r.price) || 0), 0);

      setStats({
        totalUsers: usersRes.count || 0,
        totalBusinesses: bizRes.count || 0,
        pendingBusinesses: pendingBizRes.count || 0,
        activeOffers: activeRes.count || 0,
        pendingOffers: pendingOfRes.count || 0,
        viewsToday: viewsRes.count || 0,
        clicksToday: clicksRes.count || 0,
        estimatedRevenue: revenue,
      });
      if (pushRes.data) setRecentPushes(pushRes.data);
    };

    fetchStats();
  }, []);

  const statCards = [
    { label: 'Utilizatori', value: stats.totalUsers, icon: BarChart3, color: 'text-primary' },
    { label: 'Business-uri', value: stats.totalBusinesses, icon: Megaphone, color: 'text-accent' },
    { label: 'Pending business', value: stats.pendingBusinesses, icon: Megaphone, color: 'text-accent' },
    { label: 'Oferte active', value: stats.activeOffers, icon: BarChart3, color: 'text-primary' },
    { label: 'Oferte pending', value: stats.pendingOffers, icon: BarChart3, color: 'text-accent' },
    { label: t.viewsToday, value: stats.viewsToday, icon: Eye, color: 'text-accent' },
    { label: t.clicksToday, value: stats.clicksToday, icon: MousePointerClick, color: 'text-primary' },
    { label: 'Venit estimat (lei/lună)', value: stats.estimatedRevenue, icon: Megaphone, color: 'text-primary' },
  ];

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map(s => (
          <div key={s.label} className="p-4 rounded-2xl card-gradient border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-2xl font-bold font-heading text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Push Notifications */}
      {recentPushes.length > 0 && (
        <div className="p-4 rounded-2xl card-gradient border border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold font-heading text-foreground">Ultimele push-uri</h3>
          </div>
          <div className="space-y-2">
            {recentPushes.map(p => (
              <div key={p.id} className="flex items-center justify-between text-xs">
                <span className="text-foreground truncate flex-1">{p.title}</span>
                <span className="text-muted-foreground ml-2">{new Date(p.created_at).toLocaleDateString('ro-RO')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

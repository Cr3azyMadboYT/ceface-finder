import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Offer, translations } from '@/types';
import BottomNav from '@/components/BottomNav';
import PullToRefresh from '@/components/PullToRefresh';
import AdminDashboard from '@/components/AdminDashboard';
import AdminOfferList from '@/components/AdminOfferList';
import AdminOfferForm from '@/components/AdminOfferForm';
import BusinessModeration from '@/components/admin/BusinessModeration';
import OfferModeration from '@/components/admin/OfferModeration';
import { Plus, BarChart3, List, Store, ClipboardCheck } from 'lucide-react';

type Tab = 'dashboard' | 'offers' | 'pending_offers' | 'businesses';

const Admin = () => {
  const { language } = useAuth();
  const t = translations[language];
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const fetchOffers = useCallback(async () => {
    const { data } = await supabase.from('offers').select('*').order('created_at', { ascending: false });
    if (data) setOffers(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchOffers(); }, [fetchOffers]);

  const openCreate = () => { setEditingOffer(null); setShowForm(true); };
  const openEdit = (offer: Offer) => { setEditingOffer(offer); setShowForm(true); };
  const handleSaved = () => { setShowForm(false); setEditingOffer(null); fetchOffers(); };

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'pending_offers', label: 'Oferte pending', icon: ClipboardCheck },
    { id: 'businesses', label: 'Business-uri', icon: Store },
    { id: 'offers', label: `Toate (${offers.length})`, icon: List },
  ];

  return (
    <div className="min-h-screen bg-background safe-pb">
      <PullToRefresh onRefresh={fetchOffers}>
        <div className="px-4 pt-6 pb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold font-heading text-foreground">{t.admin}</h1>
          <button onClick={openCreate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-primary text-primary-foreground font-medium text-sm shadow-neon">
            <Plus className="w-4 h-4" /> {t.createOffer}
          </button>
        </div>

        <div className="px-4 mb-4 overflow-x-auto hide-scrollbar">
          <div className="flex gap-2 p-1 rounded-xl bg-card border border-border min-w-max">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === t.id ? 'bg-gradient-primary text-primary-foreground shadow-neon' : 'text-muted-foreground'
                }`}>
                <t.icon className="w-4 h-4" /> {t.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spinner" />
          </div>
        ) : (
          <div className="px-4">
            {activeTab === 'dashboard' && <AdminDashboard />}
            {activeTab === 'pending_offers' && <OfferModeration />}
            {activeTab === 'businesses' && <BusinessModeration />}
            {activeTab === 'offers' && <AdminOfferList offers={offers} onEdit={openEdit} onRefresh={fetchOffers} />}
          </div>
        )}
        <div className="h-8" />
      </PullToRefresh>

      {showForm && (
        <AdminOfferForm editingOffer={editingOffer} onClose={() => setShowForm(false)} onSaved={handleSaved} />
      )}

      <BottomNav />
    </div>
  );
};

export default Admin;

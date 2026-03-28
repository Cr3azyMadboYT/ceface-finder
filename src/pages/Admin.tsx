import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Offer, translations } from '@/types';
import BottomNav from '@/components/BottomNav';
import PullToRefresh from '@/components/PullToRefresh';
import AdminDashboard from '@/components/AdminDashboard';
import AdminOfferList from '@/components/AdminOfferList';
import AdminOfferForm from '@/components/AdminOfferForm';
import { Plus, BarChart3, List } from 'lucide-react';

const Admin = () => {
  const { language } = useAuth();
  const t = translations[language];
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'offers'>('dashboard');

  const fetchOffers = useCallback(async () => {
    const { data } = await supabase.from('offers').select('*').order('created_at', { ascending: false });
    if (data) setOffers(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchOffers(); }, [fetchOffers]);

  const openCreate = () => {
    setEditingOffer(null);
    setShowForm(true);
  };

  const openEdit = (offer: Offer) => {
    setEditingOffer(offer);
    setShowForm(true);
  };

  const handleSaved = () => {
    setShowForm(false);
    setEditingOffer(null);
    fetchOffers();
  };

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

        {/* Tab Switcher */}
        <div className="px-4 mb-4">
          <div className="flex gap-2 p-1 rounded-xl bg-card border border-border">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'dashboard' ? 'bg-gradient-primary text-primary-foreground shadow-neon' : 'text-muted-foreground'
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Dashboard
            </button>
            <button
              onClick={() => setActiveTab('offers')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'offers' ? 'bg-gradient-primary text-primary-foreground shadow-neon' : 'text-muted-foreground'
              }`}
            >
              <List className="w-4 h-4" /> Oferte ({offers.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spinner" />
          </div>
        ) : (
          <div className="px-4">
            {activeTab === 'dashboard' ? (
              <AdminDashboard />
            ) : (
              <AdminOfferList offers={offers} onEdit={openEdit} onRefresh={fetchOffers} />
            )}
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

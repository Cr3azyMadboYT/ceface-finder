import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Offer, translations } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Edit2, Trash2, Eye, EyeOff, Megaphone, MegaphoneOff, Bell } from 'lucide-react';
import PromoteModal from './PromoteModal';
import PushModal from './PushModal';

interface AdminOfferListProps {
  offers: Offer[];
  onEdit: (offer: Offer) => void;
  onRefresh: () => void;
}

const AdminOfferList: React.FC<AdminOfferListProps> = ({ offers, onEdit, onRefresh }) => {
  const { language } = useAuth();
  const t = translations[language];
  const [promoteOffer, setPromoteOffer] = useState<Offer | null>(null);
  const [pushOffer, setPushOffer] = useState<Offer | null>(null);

  const toggleActive = async (offer: Offer) => {
    await supabase.from('offers').update({ is_active: !offer.is_active }).eq('id', offer.id);
    onRefresh();
  };

  const deleteOffer = async (id: string) => {
    if (!confirm('Sigur vrei să ștergi această ofertă?')) return;
    await supabase.from('offers').delete().eq('id', id);
    onRefresh();
  };

  const removePromo = async (offer: Offer) => {
    await supabase.from('offers').update({
      is_promoted: false,
      promotion_starts_at: null,
      promotion_expires_at: null,
      promotion_priority: 0,
      promotion_push_sent: false,
    }).eq('id', offer.id);
    onRefresh();
  };

  const isPromoActive = (offer: Offer) => {
    if (!offer.is_promoted) return false;
    if (!offer.promotion_expires_at) return offer.is_promoted;
    return new Date(offer.promotion_expires_at) > new Date();
  };

  return (
    <>
      <div className="space-y-3">
        {offers.map(offer => (
          <div key={offer.id} className={`p-3 rounded-2xl card-gradient border transition-all ${
            isPromoActive(offer) ? 'border-primary/50 shadow-neon' : 'border-border/50'
          }`}>
            <div className="flex gap-3">
              {offer.image_url && (
                <img src={offer.image_url} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-foreground text-sm truncate font-heading">{offer.title}</h3>
                      {isPromoActive(offer) && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-bold whitespace-nowrap">
                          🔥 PROMO
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{offer.category} · {offer.city}</p>
                    {isPromoActive(offer) && offer.promotion_expires_at && (
                      <p className="text-[10px] text-primary/70 mt-0.5">
                        Expiră: {new Date(offer.promotion_expires_at).toLocaleDateString('ro-RO')} · Prioritate: {offer.promotion_priority}
                      </p>
                    )}
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                    offer.is_active ? 'bg-accent/20 text-accent' : 'bg-destructive/20 text-destructive'
                  }`}>
                    {offer.is_active ? t.active : t.inactive}
                  </span>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <button onClick={() => onEdit(offer)} className="p-1.5 rounded-lg bg-secondary text-secondary-foreground" title="Editează">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => toggleActive(offer)} className="p-1.5 rounded-lg bg-secondary text-secondary-foreground" title={offer.is_active ? 'Dezactivează' : 'Activează'}>
                    {offer.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  {isPromoActive(offer) ? (
                    <button onClick={() => removePromo(offer)} className="p-1.5 rounded-lg bg-primary/10 text-primary" title="Scoate promo">
                      <MegaphoneOff className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button onClick={() => setPromoteOffer(offer)} className="p-1.5 rounded-lg bg-primary/10 text-primary" title="Promovează">
                      <Megaphone className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => setPushOffer(offer)} className="p-1.5 rounded-lg bg-accent/10 text-accent" title="Trimite push">
                    <Bell className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteOffer(offer.id)} className="p-1.5 rounded-lg bg-destructive/10 text-destructive" title="Șterge">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {offers.length === 0 && <p className="text-center text-muted-foreground py-12">{t.noOffers}</p>}
      </div>

      {promoteOffer && (
        <PromoteModal offer={promoteOffer} onClose={() => setPromoteOffer(null)} onDone={() => { setPromoteOffer(null); onRefresh(); }} />
      )}
      {pushOffer && (
        <PushModal offer={pushOffer} onClose={() => setPushOffer(null)} onDone={() => { setPushOffer(null); onRefresh(); }} />
      )}
    </>
  );
};

export default AdminOfferList;

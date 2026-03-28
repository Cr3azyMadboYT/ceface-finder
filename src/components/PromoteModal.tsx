import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Offer } from '@/types';
import { X, Megaphone } from 'lucide-react';

interface Props {
  offer: Offer;
  onClose: () => void;
  onDone: () => void;
}

const PromoteModal: React.FC<Props> = ({ offer, onClose, onDone }) => {
  const [days, setDays] = useState(7);
  const [priority, setPriority] = useState(1);
  const [saving, setSaving] = useState(false);

  const handlePromote = async () => {
    setSaving(true);
    const now = new Date();
    const expires = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    await supabase.from('offers').update({
      is_promoted: true,
      promotion_starts_at: now.toISOString(),
      promotion_expires_at: expires.toISOString(),
      promotion_priority: priority,
    }).eq('id', offer.id);

    setSaving(false);
    onDone();
  };

  const inputClass = "w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm";
  const labelClass = "text-xs font-medium text-muted-foreground mb-1 block";

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl card-gradient border border-border/50 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold font-heading text-foreground">Promovează</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-card text-muted-foreground"><X className="w-5 h-5" /></button>
        </div>

        <p className="text-sm text-muted-foreground mb-4 truncate">{offer.title}</p>

        <div className="space-y-3">
          <div>
            <label className={labelClass}>Durata (zile)</label>
            <input type="number" min={1} max={90} value={days} onChange={e => setDays(Number(e.target.value))} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Prioritate (1-10)</label>
            <input type="number" min={1} max={10} value={priority} onChange={e => setPriority(Number(e.target.value))} className={inputClass} />
            <p className="text-[10px] text-muted-foreground mt-1">Cu cât mai mare, cu atât apare mai sus</p>
          </div>
        </div>

        <button onClick={handlePromote} disabled={saving}
          className="w-full mt-4 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-neon disabled:opacity-50">
          {saving ? '...' : 'Activează promoția'}
        </button>
      </div>
    </div>
  );
};

export default PromoteModal;

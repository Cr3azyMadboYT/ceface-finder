import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Offer } from '@/types';
import { X, Bell, Send } from 'lucide-react';

interface Props {
  offer: Offer;
  onClose: () => void;
  onDone: () => void;
}

const PushModal: React.FC<Props> = ({ offer, onClose, onDone }) => {
  const defaultTitle = '🔥 Ofertă nouă în zona ta';
  const defaultBody = 'Intră acum și vezi ce a apărut pe CeFaci 👀';

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [withPromo, setWithPromo] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);

    const pushTitle = title.trim() || defaultTitle;
    const pushBody = body.trim() || defaultBody;

    // Log the push notification
    await supabase.from('push_logs').insert({
      offer_id: offer.id,
      title: pushTitle,
      body: pushBody,
      sent_count: 0, // Will be updated when actual push is sent
    });

    // Mark push as sent on offer
    await supabase.from('offers').update({ promotion_push_sent: true }).eq('id', offer.id);

    // If "promote and send push" — also promote with defaults
    if (withPromo && !offer.is_promoted) {
      const now = new Date();
      const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      await supabase.from('offers').update({
        is_promoted: true,
        promotion_starts_at: now.toISOString(),
        promotion_expires_at: expires.toISOString(),
        promotion_priority: 1,
      }).eq('id', offer.id);
    }

    setSending(false);
    onDone();
  };

  const inputClass = "w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm";
  const labelClass = "text-xs font-medium text-muted-foreground mb-1 block";

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl card-gradient border border-border/50 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-bold font-heading text-foreground">Trimite push</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-card text-muted-foreground"><X className="w-5 h-5" /></button>
        </div>

        <p className="text-sm text-muted-foreground mb-4 truncate">{offer.title}</p>

        <div className="space-y-3">
          <div>
            <label className={labelClass}>Titlu notificare</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder={defaultTitle} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Mesaj notificare</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} placeholder={defaultBody} className={`${inputClass} min-h-[60px] resize-none`} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={withPromo} onChange={e => setWithPromo(e.target.checked)} className="w-4 h-4 rounded accent-primary" />
            <span className="text-sm text-foreground">Promovează și trimite push</span>
          </label>
        </div>

        <div className="flex gap-2 mt-4">
          <button onClick={() => { setWithPromo(false); handleSend(); }} disabled={sending}
            className="flex-1 py-3 rounded-xl border border-border text-foreground font-semibold disabled:opacity-50">
            <span className="flex items-center justify-center gap-1.5"><Send className="w-4 h-4" /> Doar push</span>
          </button>
          <button onClick={() => { setWithPromo(true); handleSend(); }} disabled={sending}
            className="flex-1 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-neon disabled:opacity-50">
            {sending ? '...' : '🔥 Promo + push'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PushModal;

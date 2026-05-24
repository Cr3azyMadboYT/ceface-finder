import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { CATEGORIES, CITIES, Offer, TargetType, OfferType } from '@/types';
import { getPlan, canCreateMoreOffers } from '@/lib/plans';
import { countActiveOffers, isBusinessApproved, isBusinessRejected } from '@/lib/businessApi';
import BottomNav from '@/components/BottomNav';
import OfferCard from '@/components/OfferCard';
import UpgradeModal from '@/components/UpgradeModal';
import { Upload, ArrowLeft, Eye, AlertCircle, ShieldAlert, Store, CheckCircle2 } from 'lucide-react';

const inputClass = "w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm";
const labelClass = "text-xs font-medium text-muted-foreground mb-1 block";

const CreateOffer: React.FC = () => {
  const { user, business, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '',
    has_discount: false,
    old_price: '', new_price: '',
    offer_type: 'event' as OfferType,
    category: CATEGORIES[0] as string, city: (business?.city || CITIES[0]) as string,
    zone: business?.zone || '', start_date: '', end_date: '',
    start_time: '', end_time: '',
    image_url: '', terms: '',
    target_type: 'all' as TargetType,
    target_city: '', target_zone: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    if (business) setForm(f => ({ ...f, city: business.city || f.city, zone: business.zone || f.zone }));
  }, [business]);

  const oldP = form.has_discount ? (parseFloat(form.old_price) || 0) : 0;
  const newP = form.has_discount ? (parseFloat(form.new_price) || 0) : 0;
  const discount = oldP > 0 && newP > 0 && oldP > newP ? Math.round(((oldP - newP) / oldP) * 100) : 0;

  const upload = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const name = `offers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('offers-images').upload(name, file, { upsert: true });
    if (error) { setError(`Upload eșuat: ${error.message}`); return null; }
    return supabase.storage.from('offers-images').getPublicUrl(name).data.publicUrl;
  };

  const validate = (): string | null => {
    if (!form.title) return 'Titlul este obligatoriu';
    if (!form.description) return 'Descrierea este obligatorie';
    if (form.has_discount) {
      if (oldP <= 0 || newP <= 0) return 'Completează prețul vechi și prețul nou';
      if (oldP <= newP) return 'Prețul vechi trebuie să fie mai mare decât cel nou';
    }
    if (form.offer_type === 'limited_offer' && !form.end_date) {
      return 'Pentru o ofertă cu reducere/limitată trebuie să selectezi data de expirare';
    }
    if (form.start_date && form.end_date && form.end_date < form.start_date) {
      return 'Data expirării trebuie să fie după data de început';
    }
    return null;
  };

  const submit = async () => {
    setError('');
    if (!user) { setError('Trebuie să fii autentificat.'); return; }
    if (!business && !isAdmin) { setError('Nu s-a găsit profilul de business.'); return; }
    if (business && !isBusinessApproved(business) && !isAdmin) {
      setError('Business-ul trebuie aprobat ca să publici oferte.');
      return;
    }
    const v = validate();
    if (v) { setError(v); return; }

    if (business) {
      const active = await countActiveOffers(business.id);
      if (!canCreateMoreOffers(business.subscription_plan, active)) {
        setShowUpgrade(true);
        return;
      }
    }

    setSaving(true);
    let image_url = form.image_url;
    if (imageFile) {
      const u = await upload(imageFile);
      if (u) image_url = u;
      else { setSaving(false); return; }
    }

    const approvedNow = isAdmin || (business && isBusinessApproved(business));
    const payload = {
      title: form.title, description: form.description,
      category: form.category, city: form.city, area: form.zone,
      location: business?.address || '', location_url: '',
      date: form.start_date || '', time: '',
      image_url, contact_link: business?.website || '', phone: business?.phone || '',
      is_active: true,
      offer_type: form.offer_type,
      business_id: business?.id || null,
      created_by: user.id,
      old_price: form.has_discount ? (oldP || null) : null,
      new_price: form.has_discount ? (newP || null) : null,
      discount_percent: form.has_discount ? (discount || null) : null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      target_type: form.target_type,
      target_city: form.target_type === 'city' ? (form.target_city || form.city) : null,
      target_zone: form.target_type === 'zone' ? (form.target_zone || form.zone) : null,
      terms: form.terms || null,
      status: approvedNow ? 'active' : 'pending',
    };
    const { error: err, data } = await supabase.from('offers').insert(payload).select('*').maybeSingle();
    if (err) { setSaving(false); setError(err.message); return; }

    if (approvedNow && data) {
      try {
        const { dispatchOfferNotifications } = await import('@/lib/notifications');
        await dispatchOfferNotifications(data as Offer, business);
      } catch { /* noop */ }
    }
    setSaving(false);
    navigate('/business/offers', {
      state: { flash: approvedNow ? 'Ofertă publicată și notificare trimisă.' : 'Ofertă trimisă spre aprobare.' },
    });
  };

  const previewOffer: Offer = {
    id: 'preview', title: form.title || 'Titlu ofertă',
    description: form.description, category: form.category,
    city: form.city, area: form.zone, location: business?.address || '',
    location_url: '', date: form.start_date, time: '',
    image_url: imageFile ? URL.createObjectURL(imageFile) : form.image_url,
    contact_link: '', phone: '', is_active: true,
    created_by: user?.id || '', created_at: new Date().toISOString(),
    offer_type: form.offer_type,
    is_promoted: false, promotion_starts_at: null, promotion_expires_at: null,
    promotion_priority: 0, promotion_push_sent: false,
    end_date: form.end_date || null,
    discount_percent: form.has_discount ? (discount || null) : null,
    new_price: form.has_discount ? (newP || null) : null,
    old_price: form.has_discount ? (oldP || null) : null,
  } as unknown as Offer;

  const approved = isAdmin || isBusinessApproved(business);
  const rejected = isBusinessRejected(business);
  const plan = getPlan(business?.subscription_plan);

  return (
    <div className="min-h-screen bg-background safe-pb">
      <div className="px-4 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-card text-muted-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold font-heading text-foreground">Creează ofertă</h1>
      </div>

      {!approved ? (
        <div className="px-4 max-w-lg mx-auto">
          <div className="p-5 rounded-2xl card-gradient border border-border/50 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className={`w-5 h-5 ${rejected ? 'text-destructive' : 'text-accent'}`} />
              <h2 className="font-semibold text-foreground">
                {rejected ? 'Cont business respins' : 'Cont business în verificare'}
              </h2>
            </div>
            {rejected ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Motiv: <span className="text-foreground">{business?.rejection_reason || '—'}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Editează profilul și retrimite-l spre verificare.
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Poți completa profilul afacerii tale, dar vei putea publica oferte doar după ce contul tău este aprobat de admin.
              </p>
            )}
            <div className="flex flex-col gap-2 pt-1">
              <button onClick={() => navigate('/business/profile')}
                className="w-full py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-neon flex items-center justify-center gap-2">
                <Store className="w-4 h-4" /> Completează profilul
              </button>
              <button onClick={() => navigate('/business')}
                className="w-full py-3 rounded-xl border border-border text-foreground font-medium">
                Vezi status verificare
              </button>
            </div>
          </div>
          <div className="h-20" />
          <BottomNav />
        </div>
      ) : (
        <>
        {business && (
          <div className="mx-4 mb-3 p-3 rounded-xl bg-card border border-border/50 text-xs text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            Plan <span className="text-foreground font-medium">{plan.name}</span> · limită oferte active:{' '}
            <span className="text-foreground font-medium">{plan.maxActiveOffers === -1 ? 'nelimitat' : plan.maxActiveOffers}</span>
          </div>
        )}

      {preview ? (
        <div className="px-4 max-w-lg mx-auto space-y-4">
          <p className="text-sm text-muted-foreground">Preview ofertă:</p>
          <OfferCard offer={previewOffer} />
          {error && <p className="text-destructive text-sm">{error}</p>}
          <div className="flex gap-2">
            <button onClick={() => { setError(''); setPreview(false); }} className="flex-1 py-3 rounded-xl border border-border text-foreground font-medium">Înapoi</button>
            <button onClick={submit} disabled={saving}
              className="flex-1 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-neon disabled:opacity-50">
              {saving ? '...' : (approved ? 'Publică și trimite notificarea' : 'Trimite spre aprobare')}
            </button>
          </div>
          <div className="h-20" />
        </div>
      ) : (
        <form onSubmit={e => { e.preventDefault(); const v = validate(); if (v) setError(v); else { setError(''); setPreview(true); } }}
          className="px-4 space-y-3 max-w-lg mx-auto">
          <div><label className={labelClass}>Titlu *</label>
            <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={inputClass} /></div>
          <div><label className={labelClass}>Descriere *</label>
            <textarea required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={`${inputClass} min-h-[80px] resize-none`} /></div>

          <div>
            <label className={labelClass}>Tip ofertă</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setForm({ ...form, offer_type: 'event' })}
                className={`py-2.5 rounded-xl border text-sm font-medium ${form.offer_type === 'event' ? 'bg-gradient-primary text-primary-foreground border-transparent shadow-neon' : 'border-border text-foreground bg-card'}`}>
                Eveniment
              </button>
              <button type="button" onClick={() => setForm({ ...form, offer_type: 'limited_offer' })}
                className={`py-2.5 rounded-xl border text-sm font-medium ${form.offer_type === 'limited_offer' ? 'bg-gradient-primary text-primary-foreground border-transparent shadow-neon' : 'border-border text-foreground bg-card'}`}>
                Ofertă limitată
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl bg-card border border-border/50">
            <input type="checkbox" checked={form.has_discount}
              onChange={e => setForm({ ...form, has_discount: e.target.checked })}
              className="w-4 h-4 rounded accent-primary" />
            <span className="text-sm text-foreground font-medium">Această ofertă include o reducere de preț</span>
          </label>

          {form.has_discount && (
            <div className="grid grid-cols-3 gap-3">
              <div><label className={labelClass}>Preț vechi *</label>
                <input type="number" step="0.01" value={form.old_price} onChange={e => setForm({ ...form, old_price: e.target.value })} className={inputClass} /></div>
              <div><label className={labelClass}>Preț nou *</label>
                <input type="number" step="0.01" value={form.new_price} onChange={e => setForm({ ...form, new_price: e.target.value })} className={inputClass} /></div>
              <div><label className={labelClass}>Reducere</label>
                <div className={`${inputClass} flex items-center font-bold text-primary`}>{discount}%</div></div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>Categorie</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={inputClass}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select></div>
            <div><label className={labelClass}>Oraș</label>
              <select value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className={inputClass}>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select></div>
          </div>

          <div><label className={labelClass}>Zonă</label>
            <input value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })} className={inputClass} /></div>

          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>Data început</label>
              <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className={inputClass} /></div>
            <div><label className={labelClass}>Data expirare {form.offer_type === 'limited_offer' && '*'}</label>
              <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className={inputClass} /></div>
          </div>

          <div>
            <label className={labelClass}>Public țintă</label>
            <select value={form.target_type} onChange={e => setForm({ ...form, target_type: e.target.value as TargetType })} className={inputClass}>
              <option value="all">Toți utilizatorii</option>
              <option value="city">Oraș</option>
              <option value="zone">Zonal</option>
              <option value="followers">Followers</option>
              <option value="category">Categorie</option>
            </select>
          </div>

          {form.target_type === 'city' && (
            <div><label className={labelClass}>Oraș țintă</label>
              <select value={form.target_city || form.city} onChange={e => setForm({ ...form, target_city: e.target.value })} className={inputClass}>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select></div>
          )}
          {form.target_type === 'zone' && (
            <div><label className={labelClass}>Zonă țintă</label>
              <input value={form.target_zone} onChange={e => setForm({ ...form, target_zone: e.target.value })} className={inputClass} placeholder="ex: centru" /></div>
          )}

          <div>
            <label className={labelClass}>Imagine ofertă</label>
            <div className="flex gap-3 items-start">
              <label className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border cursor-pointer">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{imageFile?.name || 'Alege imagine'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={e => setImageFile(e.target.files?.[0] || null)} />
              </label>
              {imageFile && <img src={URL.createObjectURL(imageFile)} alt="" className="w-16 h-16 rounded-xl object-cover" />}
            </div>
          </div>

          <div><label className={labelClass}>Termeni și condiții</label>
            <textarea value={form.terms} onChange={e => setForm({ ...form, terms: e.target.value })} className={`${inputClass} min-h-[60px] resize-none`} /></div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <button type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-neon mt-2">
            <Eye className="w-5 h-5" /> Preview și publicare
          </button>
          <div className="h-20" />
        </form>
      )}

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)}
        message={`Plan ${plan.name}: ai atins limita de ${plan.maxActiveOffers} oferte active. Fă upgrade ca să publici mai multe.`} />
      <BottomNav />
        </>
      )}
    </div>
  );
};

export default CreateOffer;

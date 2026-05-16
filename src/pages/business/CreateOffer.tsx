import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { CATEGORIES, CITIES, Offer, TargetType } from '@/types';
import { getPlan, canCreateMoreOffers } from '@/lib/plans';
import { countActiveOffers } from '@/lib/businessApi';
import BusinessBottomNav from '@/components/BusinessBottomNav';
import OfferCard from '@/components/OfferCard';
import UpgradeModal from '@/components/UpgradeModal';
import { Upload, ArrowLeft, Eye, AlertCircle } from 'lucide-react';

const inputClass = "w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm";
const labelClass = "text-xs font-medium text-muted-foreground mb-1 block";

const CreateOffer: React.FC = () => {
  const { user, business, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', old_price: '', new_price: '',
    category: CATEGORIES[0] as string, city: (business?.city || CITIES[0]) as string,
    zone: business?.zone || '', start_date: '', end_date: '',
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

  const oldP = parseFloat(form.old_price) || 0;
  const newP = parseFloat(form.new_price) || 0;
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
    if (oldP > 0 && newP > 0 && oldP <= newP) return 'Prețul vechi trebuie să fie mai mare decât cel nou';
    if (form.start_date && form.end_date && form.end_date < form.start_date) return 'Data expirării trebuie să fie după data de început';
    return null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !business) return;
    if (!business.is_approved && !isAdmin) {
      setError('Business-ul trebuie aprobat ca să publici oferte.');
      return;
    }
    const v = validate();
    if (v) { setError(v); return; }

    // plan limit check
    const active = await countActiveOffers(business.id);
    if (!canCreateMoreOffers(business.subscription_plan, active)) {
      setShowUpgrade(true);
      return;
    }

    setError(''); setSaving(true);
    let image_url = form.image_url;
    if (imageFile) {
      const u = await upload(imageFile);
      if (u) image_url = u;
      else { setSaving(false); return; }
    }

    const payload = {
      title: form.title, description: form.description,
      category: form.category, city: form.city, area: form.zone,
      location: business.address || '', location_url: '',
      date: form.start_date || '', time: '',
      image_url, contact_link: business.website || '', phone: business.phone || '',
      is_active: true,
      offer_type: 'limited_offer',
      business_id: business.id,
      created_by: user.id,
      old_price: oldP || null, new_price: newP || null,
      discount_percent: discount || null,
      start_date: form.start_date || null, end_date: form.end_date || null,
      target_type: form.target_type,
      target_city: form.target_type === 'city' ? (form.target_city || form.city) : null,
      target_zone: form.target_type === 'zone' ? (form.target_zone || form.zone) : null,
      terms: form.terms || null,
      status: isAdmin ? 'active' : 'pending',
    };
    const { error: err, data } = await supabase.from('offers').insert(payload).select('*').maybeSingle();
    setSaving(false);
    if (err) { setError(err.message); return; }

    // If admin published directly → dispatch notifications now
    if (isAdmin && data) {
      try {
        const { dispatchOfferNotifications } = await import('@/lib/notifications');
        await dispatchOfferNotifications(data as Offer, business);
      } catch { /* noop */ }
    }
    navigate('/business/offers');
  };

  const previewOffer: Offer = {
    id: 'preview', title: form.title || 'Titlu ofertă',
    description: form.description, category: form.category,
    city: form.city, area: form.zone, location: business?.address || '',
    location_url: '', date: form.start_date, time: '',
    image_url: imageFile ? URL.createObjectURL(imageFile) : form.image_url,
    contact_link: '', phone: '', is_active: true,
    created_by: user?.id || '', created_at: new Date().toISOString(),
    offer_type: 'limited_offer',
    is_promoted: false, promotion_starts_at: null, promotion_expires_at: null,
    promotion_priority: 0, promotion_push_sent: false,
    end_date: form.end_date || null,
    discount_percent: discount || null,
    new_price: newP || null, old_price: oldP || null,
  } as unknown as Offer;

  return (
    <div className="min-h-screen bg-background safe-pb">
      <div className="px-4 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-card text-muted-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold font-heading text-foreground">Creează ofertă</h1>
      </div>

      {business && !business.is_approved && !isAdmin && (
        <div className="mx-4 mb-4 p-3 rounded-xl bg-accent/10 border border-accent/20 flex gap-2 text-sm">
          <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <p className="text-foreground">Profilul tău este în verificare. Vei putea publica oferte după aprobare.</p>
        </div>
      )}

      {preview ? (
        <div className="px-4 max-w-lg mx-auto space-y-4">
          <p className="text-sm text-muted-foreground">Preview ofertă:</p>
          <OfferCard offer={previewOffer} />
          <div className="flex gap-2">
            <button onClick={() => setPreview(false)} className="flex-1 py-3 rounded-xl border border-border text-foreground font-medium">Înapoi</button>
            <button onClick={submit} disabled={saving}
              className="flex-1 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-neon disabled:opacity-50">
              {saving ? '...' : 'Publică și trimite notificarea'}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={e => { e.preventDefault(); const v = validate(); if (v) setError(v); else { setError(''); setPreview(true); } }}
          className="px-4 space-y-3 max-w-lg mx-auto">
          <div><label className={labelClass}>Titlu *</label>
            <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={inputClass} /></div>
          <div><label className={labelClass}>Descriere *</label>
            <textarea required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={`${inputClass} min-h-[80px] resize-none`} /></div>

          <div className="grid grid-cols-3 gap-3">
            <div><label className={labelClass}>Preț vechi</label>
              <input type="number" step="0.01" value={form.old_price} onChange={e => setForm({ ...form, old_price: e.target.value })} className={inputClass} /></div>
            <div><label className={labelClass}>Preț nou</label>
              <input type="number" step="0.01" value={form.new_price} onChange={e => setForm({ ...form, new_price: e.target.value })} className={inputClass} /></div>
            <div><label className={labelClass}>Reducere</label>
              <div className={`${inputClass} flex items-center font-bold text-primary`}>{discount}%</div></div>
          </div>

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
            <div><label className={labelClass}>Data expirare</label>
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
        message={`Plan ${getPlan(business?.subscription_plan).name}: ai atins limita de oferte active.`} />
      <BusinessBottomNav />
    </div>
  );
};

export default CreateOffer;

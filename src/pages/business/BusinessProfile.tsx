import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { upsertMyBusiness, resubmitBusiness, isBusinessRejected, isBusinessApproved } from '@/lib/businessApi';
import { CATEGORIES, CITIES } from '@/types';
import BottomNav from '@/components/BottomNav';
import { Upload, ArrowLeft, AlertCircle, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';

const inputClass = "w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm";
const labelClass = "text-xs font-medium text-muted-foreground mb-1 block";

const BusinessProfile: React.FC = () => {
  const { user, business, refreshBusiness } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    business_name: '', category: CATEGORIES[0] as string, description: '',
    phone: '', email: '', city: CITIES[0] as string, zone: '', address: '',
    website: '', logo_url: '', cover_image_url: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (business) {
      setForm({
        business_name: business.business_name || '',
        category: business.category || CATEGORIES[0],
        description: business.description || '',
        phone: business.phone || '',
        email: business.email || user?.email || '',
        city: business.city || CITIES[0],
        zone: business.zone || '',
        address: business.address || '',
        website: business.website || '',
        logo_url: business.logo_url || '',
        cover_image_url: business.cover_image_url || '',
      });
    } else if (user?.email) {
      setForm(f => ({ ...f, email: user.email || '' }));
    }
  }, [business, user]);

  const upload = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const name = `business/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('offers-images').upload(name, file, { upsert: true });
    if (error) { setError(`Upload eșuat: ${error.message}`); return null; }
    const { data } = supabase.storage.from('offers-images').getPublicUrl(name);
    return data.publicUrl;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(''); setSuccess(false); setSaving(true);
    try {
      let logo_url = form.logo_url;
      let cover_image_url = form.cover_image_url;
      if (logoFile) { const u = await upload(logoFile); if (u) logo_url = u; }
      if (coverFile) { const u = await upload(coverFile); if (u) cover_image_url = u; }
      await upsertMyBusiness(user.id, { ...form, logo_url, cover_image_url });
      await refreshBusiness();
      setSuccess(true);
    } catch (err) {
      setError((err as Error).message);
    }
    setSaving(false);
  };

  const rejected = isBusinessRejected(business);
  const approved = isBusinessApproved(business);

  const handleResubmit = async () => {
    if (!business) return;
    await resubmitBusiness(business.id);
    await refreshBusiness();
  };

  return (
    <div className="min-h-screen bg-background safe-pb">
      <div className="px-4 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-card text-muted-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold font-heading text-foreground">Profil business</h1>
      </div>

      {business && rejected && (
        <div className="mx-4 mb-4 p-4 rounded-2xl card-gradient border border-destructive/30 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-destructive" />
            <h2 className="font-semibold text-foreground">Cont business respins</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Motiv: <span className="text-foreground">{business.rejection_reason || '—'}</span>
          </p>
          <button onClick={handleResubmit}
            className="w-full py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-neon flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4" /> Retrimite spre verificare
          </button>
        </div>
      )}

      {business && !rejected && !approved && (
        <div className="mx-4 mb-4 p-3 rounded-xl bg-accent/10 border border-accent/20 flex gap-2 text-sm">
          <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <p className="text-foreground">Profilul tău este în verificare. Vei putea publica oferte după aprobare.</p>
        </div>
      )}

      {business && approved && (
        <div className="mx-4 mb-4 p-3 rounded-xl bg-primary/10 border border-primary/20 flex gap-2 text-sm">
          <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-foreground">Cont aprobat. Poți publica oferte.</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="px-4 space-y-3 max-w-lg mx-auto">
        <div><label className={labelClass}>Nume business *</label>
          <input required value={form.business_name} onChange={e => setForm({ ...form, business_name: e.target.value })} className={inputClass} /></div>

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

        <div><label className={labelClass}>Descriere</label>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={`${inputClass} min-h-[80px] resize-none`} /></div>

        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelClass}>Telefon</label>
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputClass} /></div>
          <div><label className={labelClass}>Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} /></div>
        </div>

        <div><label className={labelClass}>Zonă</label>
          <input value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })} className={inputClass} /></div>

        <div><label className={labelClass}>Adresă</label>
          <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className={inputClass} /></div>

        <div><label className={labelClass}>Website / social</label>
          <input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} className={inputClass} placeholder="https://..." /></div>

        <div>
          <label className={labelClass}>Logo</label>
          <div className="flex gap-3 items-start">
            <label className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border cursor-pointer">
              <Upload className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{logoFile?.name || 'Alege logo'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={e => setLogoFile(e.target.files?.[0] || null)} />
            </label>
            {(logoFile || form.logo_url) && <img src={logoFile ? URL.createObjectURL(logoFile) : form.logo_url} alt="" className="w-16 h-16 rounded-xl object-cover" />}
          </div>
        </div>

        <div>
          <label className={labelClass}>Imagine copertă</label>
          <div className="flex gap-3 items-start">
            <label className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border cursor-pointer">
              <Upload className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{coverFile?.name || 'Alege copertă'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={e => setCoverFile(e.target.files?.[0] || null)} />
            </label>
            {(coverFile || form.cover_image_url) && <img src={coverFile ? URL.createObjectURL(coverFile) : form.cover_image_url} alt="" className="w-16 h-16 rounded-xl object-cover" />}
          </div>
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}
        {success && <p className="text-primary text-sm">Profil salvat.</p>}

        <button type="submit" disabled={saving}
          className="w-full py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-neon disabled:opacity-50">
          {saving ? '...' : 'Salvează profilul'}
        </button>
        <div className="h-20" />
      </form>

      <BottomNav />
    </div>
  );
};

export default BusinessProfile;

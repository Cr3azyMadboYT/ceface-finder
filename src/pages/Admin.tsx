import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Offer, CATEGORIES, CITIES, translations } from '@/types';
import BottomNav from '@/components/BottomNav';
import PullToRefresh from '@/components/PullToRefresh';
import { Plus, Edit2, Trash2, Eye, EyeOff, X, Upload, Image } from 'lucide-react';

const EMPTY_OFFER = {
  title: '', description: '', category: CATEGORIES[0], city: CITIES[0], area: '',
  location: '', location_url: '', date: '', time: '', image_url: '', contact_link: '',
  phone: '', is_active: true,
};

const Admin = () => {
  const { user, language } = useAuth();
  const t = translations[language];
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_OFFER);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchOffers = useCallback(async () => {
    const { data } = await supabase.from('offers').select('*').order('created_at', { ascending: false });
    if (data) setOffers(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchOffers(); }, [fetchOffers]);

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('offers-images').upload(fileName, file, { upsert: true });
    if (error) { setError(`Upload failed: ${error.message}`); return null; }
    const { data: urlData } = supabase.storage.from('offers-images').getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    setSaving(true);

    let imageUrl = form.image_url;
    if (imageFile) {
      const url = await uploadImage(imageFile);
      if (url) imageUrl = url;
      else { setSaving(false); return; }
    }

    const payload = { ...form, image_url: imageUrl, created_by: user.id };

    if (editingId) {
      const { error } = await supabase.from('offers').update(payload).eq('id', editingId);
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.from('offers').insert(payload);
      if (error) setError(error.message);
    }

    setSaving(false);
    if (!error) {
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_OFFER);
      setImageFile(null);
      setImagePreview('');
      fetchOffers();
    }
  };

  const startEdit = (offer: Offer) => {
    setForm({
      title: offer.title || '', description: offer.description || '', category: offer.category || CATEGORIES[0],
      city: offer.city || CITIES[0], area: offer.area || '', location: offer.location || '',
      location_url: offer.location_url || '', date: offer.date || '', time: offer.time || '',
      image_url: offer.image_url || '', contact_link: offer.contact_link || '', phone: offer.phone || '',
      is_active: offer.is_active,
    });
    setEditingId(offer.id);
    setImagePreview(offer.image_url || '');
    setShowForm(true);
  };

  const toggleActive = async (offer: Offer) => {
    await supabase.from('offers').update({ is_active: !offer.is_active }).eq('id', offer.id);
    fetchOffers();
  };

  const deleteOffer = async (id: string) => {
    if (!confirm('Sigur vrei să ștergi această ofertă?')) return;
    await supabase.from('offers').delete().eq('id', id);
    fetchOffers();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const openCreate = () => {
    setForm(EMPTY_OFFER);
    setEditingId(null);
    setImageFile(null);
    setImagePreview('');
    setShowForm(true);
  };

  const inputClass = "w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm";
  const labelClass = "text-xs font-medium text-muted-foreground mb-1 block";

  return (
    <div className="min-h-screen bg-background pb-20">
      <PullToRefresh onRefresh={fetchOffers}>
        <div className="px-4 pt-6 pb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold font-heading text-foreground">{t.admin}</h1>
          <button onClick={openCreate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-primary text-primary-foreground font-medium text-sm shadow-neon">
            <Plus className="w-4 h-4" /> {t.createOffer}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spinner" />
          </div>
        ) : (
          <div className="px-4 space-y-3">
            {offers.map(offer => (
              <div key={offer.id} className="p-3 rounded-2xl card-gradient border border-border/50">
                <div className="flex gap-3">
                  {offer.image_url && (
                    <img src={offer.image_url} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-foreground text-sm truncate font-heading">{offer.title}</h3>
                        <p className="text-xs text-muted-foreground">{offer.category} · {offer.city}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        offer.is_active ? 'bg-accent/20 text-accent' : 'bg-destructive/20 text-destructive'
                      }`}>
                        {offer.is_active ? t.active : t.inactive}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => startEdit(offer)} className="p-1.5 rounded-lg bg-secondary text-secondary-foreground"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => toggleActive(offer)} className="p-1.5 rounded-lg bg-secondary text-secondary-foreground">
                        {offer.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => deleteOffer(offer.id)} className="p-1.5 rounded-lg bg-destructive/10 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {offers.length === 0 && <p className="text-center text-muted-foreground py-12">{t.noOffers}</p>}
          </div>
        )}
        <div className="h-8" />
      </PullToRefresh>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto">
          <div className="px-4 py-6 max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold font-heading text-foreground">{editingId ? t.editOffer : t.createOffer}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-xl bg-card text-muted-foreground"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div><label className={labelClass}>{t.title}</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={inputClass} required /></div>
              <div><label className={labelClass}>{t.description}</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={`${inputClass} min-h-[80px] resize-none`} /></div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>{t.category}</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={inputClass}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>{t.city}</label>
                  <select value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className={inputClass}>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div><label className={labelClass}>{t.area}</label><input value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} className={inputClass} /></div>
              <div><label className={labelClass}>{t.location}</label><input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className={inputClass} /></div>
              <div><label className={labelClass}>{t.locationUrl}</label><input value={form.location_url} onChange={e => setForm({ ...form, location_url: e.target.value })} className={inputClass} placeholder="https://maps.google.com/..." /></div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass}>{t.date}</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className={inputClass} /></div>
                <div><label className={labelClass}>{t.time}</label><input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} className={inputClass} /></div>
              </div>

              {/* Image upload */}
              <div>
                <label className={labelClass}>{t.image}</label>
                <div className="flex gap-3 items-start">
                  <label className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors">
                    <Upload className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{imageFile ? imageFile.name : 'Alege imagine'}</span>
                    <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                  </label>
                  {imagePreview && (
                    <img src={imagePreview} alt="" className="w-16 h-16 rounded-xl object-cover" />
                  )}
                </div>
              </div>

              <div><label className={labelClass}>{t.contactLink}</label><input value={form.contact_link} onChange={e => setForm({ ...form, contact_link: e.target.value })} className={inputClass} /></div>
              <div><label className={labelClass}>{t.phone}</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputClass} /></div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4 rounded accent-primary" />
                  <span className="text-sm text-foreground">{t.active}</span>
                </label>
              </div>

              {error && <p className="text-destructive text-sm">{error}</p>}

              <button type="submit" disabled={saving}
                className="w-full py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-neon disabled:opacity-50 mt-2">
                {saving ? '...' : editingId ? t.editOffer : t.createOffer}
              </button>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Admin;

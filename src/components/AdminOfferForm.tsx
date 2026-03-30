import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Offer, OfferType, CATEGORIES, CITIES, translations } from '@/types';
import { X, Upload } from 'lucide-react';

interface Props {
  editingOffer: Offer | null;
  onClose: () => void;
  onSaved: () => void;
}

const EMPTY_OFFER = {
  title: '', description: '', category: CATEGORIES[0] as string, city: CITIES[0] as string, area: '',
  location: '', location_url: '', date: '', time: '', image_url: '', contact_link: '',
  phone: '', is_active: true, offer_type: 'event' as OfferType,
};

const AdminOfferForm: React.FC<Props> = ({ editingOffer, onClose, onSaved }) => {
  const { user, language } = useAuth();
  const t = translations[language];

  const [form, setForm] = useState(editingOffer ? {
    title: editingOffer.title || '', description: editingOffer.description || '',
    category: (editingOffer.category || CATEGORIES[0]) as string, city: (editingOffer.city || CITIES[0]) as string,
    area: editingOffer.area || '', location: editingOffer.location || '',
    location_url: editingOffer.location_url || '', date: editingOffer.date || '', time: editingOffer.time || '',
    image_url: editingOffer.image_url || '', contact_link: editingOffer.contact_link || '',
    phone: editingOffer.phone || '', is_active: editingOffer.is_active,
    offer_type: (editingOffer.offer_type || 'event') as OfferType,
  } : EMPTY_OFFER);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(editingOffer?.image_url || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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

    if (editingOffer) {
      const { error: err } = await supabase.from('offers').update(payload).eq('id', editingOffer.id);
      if (err) setError(err.message);
    } else {
      const { error: err } = await supabase.from('offers').insert(payload);
      if (err) setError(err.message);
    }

    setSaving(false);
    if (!error) {
      onSaved();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const inputClass = "w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm";
  const labelClass = "text-xs font-medium text-muted-foreground mb-1 block";

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto">
      <div className="px-4 py-6 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold font-heading text-foreground">{editingOffer ? t.editOffer : t.createOffer}</h2>
          <button onClick={onClose} className="p-2 rounded-xl bg-card text-muted-foreground"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className={labelClass}>Tip ofertă</label>
            <select value={form.offer_type} onChange={e => setForm({ ...form, offer_type: e.target.value as OfferType })} className={inputClass}>
              <option value="event">📅 Eveniment</option>
              <option value="limited_offer">⏳ Ofertă limitată</option>
            </select>
          </div>
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

          <div>
            <label className={labelClass}>{t.image}</label>
            <div className="flex gap-3 items-start">
              <label className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{imageFile ? imageFile.name : 'Alege imagine'}</span>
                <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
              </label>
              {imagePreview && <img src={imagePreview} alt="" className="w-16 h-16 rounded-xl object-cover" />}
            </div>
          </div>

          <div><label className={labelClass}>{t.contactLink}</label><input value={form.contact_link} onChange={e => setForm({ ...form, contact_link: e.target.value })} className={inputClass} /></div>
          <div><label className={labelClass}>{t.phone}</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputClass} /></div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 rounded accent-primary" />
              <span className="text-sm text-foreground">{t.active}</span>
            </label>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <button type="submit" disabled={saving}
            className="w-full py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-neon disabled:opacity-50 mt-2">
            {saving ? '...' : editingOffer ? t.editOffer : t.createOffer}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminOfferForm;

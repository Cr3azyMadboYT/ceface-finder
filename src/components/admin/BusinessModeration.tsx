import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Business } from '@/types';
import {
  approveBusiness, rejectBusiness, setBusinessVerified, isBusinessApproved, isBusinessRejected,
} from '@/lib/businessApi';
import {
  Check, X, ShieldCheck, ChevronDown, ChevronUp,
  Building2, User as UserIcon,
} from 'lucide-react';

type OwnerInfo = { email?: string | null; role?: string | null; created_at?: string | null };

const Row: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-start justify-between gap-3 py-1.5">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-xs text-foreground text-right break-words max-w-[60%]">
      {value === null || value === undefined || value === '' ? <span className="text-muted-foreground italic">—</span> : value}
    </span>
  </div>
);

const StatusBadge: React.FC<{ b: Business }> = ({ b }) => {
  if (isBusinessRejected(b)) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/20 text-destructive">Respins</span>;
  if (isBusinessApproved(b)) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary">Aprobat</span>;
  return <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent">Pending</span>;
};

const BusinessModeration: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Business[]>([]);
  const [owners, setOwners] = useState<Record<string, OwnerInfo>>({});
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [reasonId, setReasonId] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('businesses').select('*').order('created_at', { ascending: false });
    const list = (data as Business[]) || [];
    setItems(list);
    const ids = Array.from(new Set(list.map(b => b.owner_id).filter(Boolean)));
    if (ids.length) {
      const { data: profs } = await supabase.from('profiles').select('id,email,role,created_at').in('id', ids);
      const map: Record<string, OwnerInfo> = {};
      (profs || []).forEach((p: { id: string; email?: string | null; role?: string | null; created_at?: string | null }) => {
        map[p.id] = { email: p.email, role: p.role, created_at: p.created_at };
      });
      setOwners(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const onApprove = async (id: string) => { if (!user) return; await approveBusiness(id, user.id); load(); };
  const onReject = async (id: string) => {
    if (!user) return;
    await rejectBusiness(id, user.id, reason);
    setReasonId(null); setReason('');
    load();
  };
  const onVerify = async (id: string, value: boolean) => { await setBusinessVerified(id, value); load(); };
  const changePlan = async (id: string, plan: string) => {
    await supabase.from('businesses').update({ subscription_plan: plan, subscription_status: 'active' }).eq('id', id);
    load();
  };

  const filtered = items.filter(b => {
    if (filter === 'all') return true;
    if (filter === 'approved') return isBusinessApproved(b);
    if (filter === 'rejected') return isBusinessRejected(b);
    return !isBusinessApproved(b) && !isBusinessRejected(b);
  });

  const counts = {
    all: items.length,
    pending: items.filter(b => !isBusinessApproved(b) && !isBusinessRejected(b)).length,
    approved: items.filter(isBusinessApproved).length,
    rejected: items.filter(isBusinessRejected).length,
  };

  if (loading) return (
    <div className="flex justify-center py-10">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spinner" />
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto hide-scrollbar">
        {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap ${
              filter === f ? 'bg-gradient-primary text-primary-foreground shadow-neon' : 'bg-card text-muted-foreground border border-border'
            }`}>
            {f === 'pending' ? 'Pending' : f === 'approved' ? 'Aprobate' : f === 'rejected' ? 'Respinse' : 'Toate'} ({counts[f]})
          </button>
        ))}
      </div>

      {filtered.length === 0 && <p className="text-center py-10 text-muted-foreground text-sm">Niciun business.</p>}

      {filtered.map(b => {
        const open = openId === b.id;
        const owner = owners[b.owner_id];
        return (
          <div key={b.id} className="p-4 rounded-2xl card-gradient border border-border/50">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground truncate">{b.business_name}</h3>
                <p className="text-xs text-muted-foreground truncate">
                  {b.email || owner?.email || b.phone || '—'} · {b.category || 'fără categorie'} · {b.city || '—'}
                </p>
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  <StatusBadge b={b} />
                  {b.is_verified && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary">✓ Verificat</span>}
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground capitalize">{b.subscription_plan}</span>
                </div>
              </div>
              <button onClick={() => setOpenId(open ? null : b.id)}
                className="px-3 py-1.5 rounded-lg border border-border text-foreground text-xs font-medium flex items-center gap-1 shrink-0">
                {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {open ? 'Ascunde' : 'Vezi detalii'}
              </button>
            </div>

            {open && (
              <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
                {!b.business_name || !b.category || !b.city || !b.phone ? (
                  <p className="text-xs text-accent">Profil business incomplet</p>
                ) : null}

                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-primary" /> Detalii business
                  </h4>
                  <Row label="Nume" value={b.business_name} />
                  <Row label="Categorie" value={b.category} />
                  <Row label="Descriere" value={b.description} />
                  <Row label="Email" value={b.email} />
                  <Row label="Telefon" value={b.phone} />
                  <Row label="Oraș" value={b.city} />
                  <Row label="Zonă" value={b.zone} />
                  <Row label="Adresă" value={b.address} />
                  <Row label="Website" value={b.website ? <a href={b.website} target="_blank" rel="noreferrer" className="text-primary underline">{b.website}</a> : ''} />
                  <Row label="Social" value={b.social_links ? JSON.stringify(b.social_links) : ''} />
                  <Row label="Program" value={b.opening_hours ? JSON.stringify(b.opening_hours) : ''} />
                </div>

                {(b.logo_url || b.cover_image_url) && (
                  <div className="flex gap-2">
                    {b.logo_url && <img src={b.logo_url} alt="logo" className="w-16 h-16 rounded-xl object-cover border border-border/50" />}
                    {b.cover_image_url && <img src={b.cover_image_url} alt="cover" className="flex-1 h-16 rounded-xl object-cover border border-border/50" />}
                  </div>
                )}

                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-primary" /> Owner
                  </h4>
                  <Row label="owner_id" value={<span className="font-mono text-[10px]">{b.owner_id}</span>} />
                  <Row label="Email owner" value={owner?.email} />
                  <Row label="Rol owner" value={owner?.role} />
                  <Row label="Cont creat" value={owner?.created_at ? new Date(owner.created_at).toLocaleString('ro-RO') : ''} />
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Moderare & abonament
                  </h4>
                  <Row label="is_approved" value={String(b.is_approved)} />
                  <Row label="is_verified" value={String(b.is_verified)} />
                  <Row label="moderation_status" value={b.moderation_status || 'pending'} />
                  <Row label="subscription_plan" value={b.subscription_plan} />
                  <Row label="subscription_status" value={b.subscription_status} />
                  <Row label="subscription_expires_at" value={b.subscription_expires_at ? new Date(b.subscription_expires_at).toLocaleDateString('ro-RO') : ''} />
                  <Row label="rejection_reason" value={b.rejection_reason} />
                  <Row label="reviewed_at" value={b.reviewed_at ? new Date(b.reviewed_at).toLocaleString('ro-RO') : ''} />
                  <Row label="created_at" value={new Date(b.created_at).toLocaleString('ro-RO')} />
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {!isBusinessApproved(b) && (
                    <button onClick={() => onApprove(b.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
                      <Check className="w-3.5 h-3.5" /> Aprobă
                    </button>
                  )}
                  <button onClick={() => { setReasonId(reasonId === b.id ? null : b.id); setReason(b.rejection_reason || ''); }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-destructive/30 text-destructive text-xs font-medium">
                    <X className="w-3.5 h-3.5" /> Respinge
                  </button>
                  <button onClick={() => onVerify(b.id, !b.is_verified)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-foreground text-xs font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" /> {b.is_verified ? 'Scoate verificat' : 'Marchează verificat'}
                  </button>
                  <select value={b.subscription_plan} onChange={e => changePlan(b.id, e.target.value)}
                    className="px-2 py-1 rounded-lg bg-background border border-border text-foreground text-xs">
                    <option value="free">Free</option>
                    <option value="basic">Basic</option>
                    <option value="pro">Pro</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>

                {reasonId === b.id && (
                  <div className="space-y-2">
                    <textarea value={reason} onChange={e => setReason(e.target.value)}
                      placeholder="Motiv respingere"
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground min-h-[60px] resize-none" />
                    <div className="flex gap-2">
                      <button onClick={() => onReject(b.id)} className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-medium">
                        Confirmă respingere
                      </button>
                      <button onClick={() => { setReasonId(null); setReason(''); }} className="px-3 py-1.5 rounded-lg border border-border text-foreground text-xs">
                        Anulează
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default BusinessModeration;

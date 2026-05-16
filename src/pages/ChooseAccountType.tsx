import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { User, Store } from 'lucide-react';

const ChooseAccountType: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<'client' | 'business' | null>(null);

  const choose = async (role: 'client' | 'business') => {
    if (!user) return;
    setLoading(role);
    // store as 'user' for client (existing role), 'business' for business
    const roleValue = role === 'client' ? 'user' : 'business';
    await supabase.from('profiles').update({
      role: roleValue,
      account_type_chosen: true,
    }).eq('id', user.id);
    await refreshProfile();
    navigate(role === 'business' ? '/business' : '/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md animate-slide-up">
        <h1 className="text-3xl font-bold text-center mb-2 font-heading text-gradient">Cum vrei să folosești CeFaci?</h1>
        <p className="text-center text-muted-foreground mb-8">Alege tipul de cont. Poți schimba mai târziu din profil.</p>

        <div className="space-y-4">
          <button
            disabled={loading !== null}
            onClick={() => choose('client')}
            className="w-full p-5 rounded-2xl card-gradient border border-border/50 hover:border-primary/50 hover:shadow-neon transition-all text-left flex items-center gap-4 disabled:opacity-50"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center shadow-neon flex-shrink-0">
              <User className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold font-heading text-foreground">Cont client</h3>
              <p className="text-sm text-muted-foreground">Vezi oferte, primește notificări, salvează favorite.</p>
            </div>
          </button>

          <button
            disabled={loading !== null}
            onClick={() => choose('business')}
            className="w-full p-5 rounded-2xl card-gradient border border-border/50 hover:border-primary/50 hover:shadow-neon transition-all text-left flex items-center gap-4 disabled:opacity-50"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center shadow-neon flex-shrink-0">
              <Store className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold font-heading text-foreground">Cont business</h3>
              <p className="text-sm text-muted-foreground">Publică oferte, vezi statistici, trimite notificări către clienți.</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChooseAccountType;

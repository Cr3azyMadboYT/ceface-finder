import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile, Business } from '@/types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  business: Business | null;
  loading: boolean;
  isAdmin: boolean;
  isBusiness: boolean;
  isClient: boolean;
  needsAccountType: boolean;
  language: 'ro' | 'en';
  setLanguage: (lang: 'ro' | 'en') => void;
  refreshProfile: () => Promise<void>;
  refreshBusiness: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  business: null,
  loading: true,
  isAdmin: false,
  isBusiness: false,
  isClient: false,
  needsAccountType: false,
  language: 'ro',
  setLanguage: () => {},
  refreshProfile: async () => {},
  refreshBusiness: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguageState] = useState<'ro' | 'en'>('ro');

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (data) {
      setProfile(data as Profile);
      setLanguageState(data.language || 'ro');
      if (data.role === 'business') {
        const { data: b } = await supabase
          .from('businesses')
          .select('*')
          .eq('owner_id', userId)
          .maybeSingle();
        setBusiness((b as Business) || null);
      } else {
        setBusiness(null);
      }
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const refreshBusiness = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', user.id)
      .maybeSingle();
    setBusiness((data as Business) || null);
  };

  const setLanguage = async (lang: 'ro' | 'en') => {
    setLanguageState(lang);
    if (user) {
      await supabase.from('profiles').update({ language: lang }).eq('id', user.id);
      if (profile) setProfile({ ...profile, language: lang });
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setBusiness(null);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => fetchProfile(session.user.id), 0);
      } else {
        setProfile(null);
        setBusiness(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAdminEmail = user?.email === 'cornelboss915@gmail.com';
  const isAdmin = profile?.role === 'admin' || isAdminEmail;
  const isBusiness = profile?.role === 'business';
  const isClient = !isAdmin && !isBusiness;
  const needsAccountType = !!user && !!profile && profile.account_type_chosen === false && !isAdmin;

  return (
    <AuthContext.Provider value={{
      session, user, profile, business, loading,
      isAdmin, isBusiness, isClient, needsAccountType,
      language, setLanguage,
      refreshProfile, refreshBusiness, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

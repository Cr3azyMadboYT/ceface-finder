import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const initSession = async () => {
      try {
        // Parse tokens from URL hash (Supabase sends them as hash fragments)
        const hash = window.location.hash.substring(1); // remove #
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const type = params.get('type');

        if (accessToken && refreshToken && type === 'recovery') {
          // Set session manually with recovery tokens
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            console.error('Failed to set recovery session:', error.message);
            setError('Link-ul de resetare a expirat. Încearcă din nou.');
          } else {
            setSessionReady(true);
          }
        } else {
          // Maybe session already exists (e.g. Supabase auto-handled it)
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setSessionReady(true);
          } else {
            setError('Link-ul de resetare este invalid sau a expirat.');
          }
        }
      } catch (e) {
        console.error('ResetPassword init error:', e);
        setError('A apărut o eroare. Încearcă din nou.');
      } finally {
        setInitializing(false);
      }
    };

    initSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError('Minim 6 caractere'); return; }
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setError(error.message);
    else {
      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    }
    setLoading(false);
  };

  if (initializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-muted-foreground">Se procesează link-ul...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
        <div className="text-center animate-slide-up">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-accent" />
          <h2 className="text-2xl font-bold mb-2 font-heading text-foreground">Parola actualizată!</h2>
          <p className="text-muted-foreground">Redirecționare...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <div className="w-full max-w-sm animate-slide-up">
        <h1 className="text-2xl font-bold mb-2 font-heading text-foreground">Parolă nouă</h1>
        <p className="text-muted-foreground mb-6">Introdu noua parolă.</p>
        {!sessionReady && error ? (
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            <button onClick={() => navigate('/forgot-password')}
              className="text-primary underline">Solicită un nou link</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <input type={showPw ? 'text' : 'password'} placeholder="Parolă nouă" value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-11 pr-11 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" required />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-3 text-muted-foreground">
                {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {error && <p className="text-destructive text-sm text-center">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-neon disabled:opacity-50">
              {loading ? '...' : 'Salvează parola'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { translations } from '@/types';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

const Signup = () => {
  const t = translations.ro;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPw) { setError('Parolele nu se potrivesc'); return; }
    if (password.length < 6) { setError('Parola trebuie să aibă minim 6 caractere'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) setError(error.message);
    else setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
        <div className="w-full max-w-sm text-center animate-slide-up">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-primary flex items-center justify-center shadow-neon">
            <Mail className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2 font-heading text-foreground">{t.confirmEmail}</h2>
          <p className="text-muted-foreground mb-6">Am trimis un email de confirmare la <strong className="text-foreground">{email}</strong></p>
          <Link to="/login" className="text-primary hover:underline font-medium">{t.login}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <div className="w-full max-w-sm animate-slide-up">
        <h1 className="text-4xl font-bold text-center mb-2 text-gradient font-heading">CeFaci</h1>
        <p className="text-center text-muted-foreground mb-8">Creează-ți contul</p>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <input type="email" placeholder={t.email} value={email} onChange={e => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" required />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <input type={showPw ? 'text' : 'password'} placeholder={t.password} value={password} onChange={e => setPassword(e.target.value)}
              className="w-full pl-11 pr-11 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" required />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-3 text-muted-foreground">
              {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <input type={showPw ? 'text' : 'password'} placeholder={t.confirmPassword} value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" required />
          </div>

          {error && <p className="text-destructive text-sm text-center">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold text-lg shadow-neon disabled:opacity-50 transition-all">
            {loading ? '...' : t.signup}
          </button>
        </form>

        <div className="mt-6 text-center text-muted-foreground text-sm">
          {t.hasAccount}{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">{t.login}</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;

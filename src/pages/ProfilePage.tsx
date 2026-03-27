import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import { translations } from '@/types';
import { LogOut, Globe, Mail } from 'lucide-react';

const ProfilePage = () => {
  const { user, profile, language, setLanguage, signOut } = useAuth();
  const t = translations[language];
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background safe-pb">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold font-heading text-foreground">{t.profile}</h1>
      </div>

      <div className="px-4 space-y-4">
        {/* Email */}
        <div className="p-4 rounded-2xl card-gradient border border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center shadow-neon">
              <Mail className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t.email}</p>
              <p className="text-foreground font-medium">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Language */}
        <div className="p-4 rounded-2xl card-gradient border border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <Globe className="w-5 h-5 text-foreground" />
              </div>
              <p className="text-foreground font-medium">{t.language}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setLanguage('ro')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  language === 'ro' ? 'bg-gradient-primary text-primary-foreground shadow-neon' : 'bg-card text-muted-foreground border border-border'
                }`}
              >
                RO
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  language === 'en' ? 'bg-gradient-primary text-primary-foreground shadow-neon' : 'bg-card text-muted-foreground border border-border'
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>

        {/* Role badge */}
        {profile?.role && (
          <div className="p-4 rounded-2xl card-gradient border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Rol</p>
            <span className={`inline-block px-3 py-1 rounded-lg text-sm font-medium ${
              profile.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-secondary text-secondary-foreground'
            }`}>
              {profile.role === 'admin' ? 'Administrator' : 'Utilizator'}
            </span>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 transition-all font-medium"
        >
          <LogOut className="w-5 h-5" />
          {t.logout}
        </button>
      </div>
      <BottomNav />
    </div>
  );
};

export default ProfilePage;

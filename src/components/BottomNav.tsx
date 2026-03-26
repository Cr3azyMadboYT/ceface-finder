import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Heart, User, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { translations } from '@/types';

const BottomNav = () => {
  const { isAdmin, language } = useAuth();
  const t = translations[language];
  const location = useLocation();

  const navItems = [
    { to: '/', icon: Home, label: t.home },
    { to: '/favorites', icon: Heart, label: t.favorites },
    ...(isAdmin ? [{ to: '/admin', icon: Shield, label: t.admin }] : []),
    { to: '/profile', icon: User, label: t.profile },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50 safe-area-bottom">
      <div className="flex items-center justify-around py-2 px-2 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
              isActive(to) ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive(to) ? 'drop-shadow-[0_0_6px_hsl(252,90%,65%)]' : ''}`} />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;

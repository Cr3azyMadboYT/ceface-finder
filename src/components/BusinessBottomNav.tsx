import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Plus, List, BarChart3, Store } from 'lucide-react';

const BusinessBottomNav: React.FC = () => {
  const location = useLocation();
  const items = [
    { to: '/business', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { to: '/business/offers', icon: List, label: 'Oferte' },
    { to: '/business/create', icon: Plus, label: 'Creează' },
    { to: '/business/stats', icon: BarChart3, label: 'Statistici' },
    { to: '/business/profile', icon: Store, label: 'Profil' },
  ];
  const isActive = (to: string, exact?: boolean) => exact ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center justify-around py-2 px-2 max-w-lg mx-auto">
        {items.map(({ to, icon: Icon, label, exact }) => (
          <NavLink key={to} to={to}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all ${
              isActive(to, exact) ? 'text-primary' : 'text-muted-foreground'
            }`}>
            <Icon className={`w-5 h-5 ${isActive(to, exact) ? 'drop-shadow-[0_0_6px_hsl(252,90%,65%)]' : ''}`} />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BusinessBottomNav;

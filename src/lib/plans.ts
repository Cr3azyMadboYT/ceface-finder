export type PlanId = 'free' | 'basic' | 'pro' | 'premium';

export interface PlanDef {
  id: PlanId;
  name: string;
  price: number; // RON / month
  recommended?: boolean;
  maxActiveOffers: number; // Infinity = -1
  features: string[];
}

export const PLANS: PlanDef[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    maxActiveOffers: 3,
    features: [
      'Profil business de bază',
      '3 oferte active',
      'Notificări push limitate',
      'Statistici simple',
    ],
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 49,
    maxActiveOffers: 10,
    features: [
      'Profil business complet',
      '10 oferte active',
      'Notificări push în oraș',
      'Statistici de bază',
      'Editare oferte',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 99,
    recommended: true,
    maxActiveOffers: -1,
    features: [
      'Profil business complet',
      'Oferte active nelimitate',
      'Notificări push avansate',
      'Trimitere către oraș / zonal / followers',
      'Statistici avansate',
      'Promovare în căutare',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 199,
    maxActiveOffers: -1,
    features: [
      'Tot din planul Pro',
      'Promovare prioritară',
      'Poziție mai sus în aplicație',
      'Badge business verificat',
      'Suport dedicat',
      'Consultanță personalizată',
    ],
  },
];

export const getPlan = (id?: string | null): PlanDef =>
  PLANS.find(p => p.id === (id as PlanId)) || PLANS[0];

export const canCreateMoreOffers = (planId: string | null | undefined, activeCount: number): boolean => {
  const p = getPlan(planId);
  if (p.maxActiveOffers === -1) return true;
  return activeCount < p.maxActiveOffers;
};

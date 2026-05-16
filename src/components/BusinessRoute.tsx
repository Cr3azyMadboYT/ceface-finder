import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

interface Props { children: React.ReactNode }

export const BusinessRoute: React.FC<Props> = ({ children }) => {
  const { user, profile, loading, isBusiness, isAdmin, needsAccountType } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spinner" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (needsAccountType) return <Navigate to="/choose-account" replace />;
  if (!isBusiness && !isAdmin) return <Navigate to="/" replace />;
  if (!profile) return null;
  return <>{children}</>;
};

export default BusinessRoute;

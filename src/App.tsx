import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import OfferDetails from "./pages/OfferDetails";
import Favorites from "./pages/Favorites";
import ProfilePage from "./pages/ProfilePage";
import Admin from "./pages/Admin";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";
import DeepLinkHandler from "./components/DeepLinkHandler";
import ChooseAccountType from "./pages/ChooseAccountType";
import BusinessRoute from "./components/BusinessRoute";
import BusinessDashboard from "./pages/business/BusinessDashboard";
import BusinessProfile from "./pages/business/BusinessProfile";
import Plans from "./pages/business/Plans";
import CreateOffer from "./pages/business/CreateOffer";
import MyOffers from "./pages/business/MyOffers";
import OfferStatsPage from "./pages/business/OfferStatsPage";
import SubscriptionPage from "./pages/business/SubscriptionPage";

const queryClient = new QueryClient();

const Spinner = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spinner" />
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, needsAccountType } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (needsAccountType) return <Navigate to="/choose-account" replace />;
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AuthRedirect = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, needsAccountType, isBusiness, isAdmin } = useAuth();
  if (loading) return null;
  if (user) {
    if (needsAccountType) return <Navigate to="/choose-account" replace />;
    if (isAdmin) return <Navigate to="/admin" replace />;
    if (isBusiness) return <Navigate to="/business" replace />;
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const ChooseAccountGate = () => {
  const { user, loading, needsAccountType, isBusiness, isAdmin } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (!needsAccountType) {
    if (isAdmin) return <Navigate to="/admin" replace />;
    if (isBusiness) return <Navigate to="/business" replace />;
    return <Navigate to="/" replace />;
  }
  return <ChooseAccountType />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <DeepLinkHandler />
          <Routes>
            <Route path="/login" element={<AuthRedirect><Login /></AuthRedirect>} />
            <Route path="/signup" element={<AuthRedirect><Signup /></AuthRedirect>} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/choose-account" element={<ChooseAccountGate />} />

            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/offer/:id" element={<OfferDetails />} />
            <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

            <Route path="/business" element={<BusinessRoute><BusinessDashboard /></BusinessRoute>} />
            <Route path="/business/profile" element={<BusinessRoute><BusinessProfile /></BusinessRoute>} />
            <Route path="/business/plans" element={<BusinessRoute><Plans /></BusinessRoute>} />
            <Route path="/business/create" element={<BusinessRoute><CreateOffer /></BusinessRoute>} />
            <Route path="/business/offers" element={<BusinessRoute><MyOffers /></BusinessRoute>} />
            <Route path="/business/stats" element={<BusinessRoute><OfferStatsPage /></BusinessRoute>} />
            <Route path="/business/stats/:id" element={<BusinessRoute><OfferStatsPage /></BusinessRoute>} />
            <Route path="/business/subscription" element={<BusinessRoute><SubscriptionPage /></BusinessRoute>} />

            <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

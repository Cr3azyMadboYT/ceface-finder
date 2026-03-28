import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      // Supabase automatically picks up tokens from URL hash/query
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Auth callback error:', error.message);
        navigate('/login', { replace: true });
        return;
      }
      // Redirect to home if session exists, otherwise login
      navigate(session ? '/' : '/login', { replace: true });
    };

    handleAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center animate-slide-up">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Se procesează autentificarea...</p>
      </div>
    </div>
  );
};

export default AuthCallback;

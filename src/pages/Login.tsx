"use client";

import React, { useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Login page mounted. Supabase client initialized:", !!supabase);

    // Check session immediately on mount of Login page
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Login page: Error getting session:", error);
      } else {
        console.log("Login page: Session on mount:", session);
        if (session) {
          console.log("Login page: Session found, redirecting to home.");
          navigate('/');
        }
      }
    };
    checkSession();

    // Listen for auth state changes specifically on the login page
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log('Login page: Auth state changed!', { event, currentSession });
      if (currentSession) {
        console.log("Login page: Session found via onAuthStateChange, redirecting to home.");
        navigate('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto' }}>
      <h2 style={{ textAlign: 'center' }}>Login to Choir Companion</h2>
      <Auth
        supabaseClient={supabase}
        providers={['google']}
        appearance={{
          theme: ThemeSupa,
        }}
        theme="light"
        // Removed redirectTo to let Auth UI handle it, or default to current URL
        debug={true}
      />
    </div>
  );
};

export default Login;
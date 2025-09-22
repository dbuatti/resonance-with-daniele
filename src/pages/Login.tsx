"use client";

import React, { useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';

const Login: React.FC = () => {
  useEffect(() => {
    console.log("Login page mounted. Supabase client initialized:", !!supabase);
  }, []);

  const handleAuthError = (error: any) => {
    console.error("Supabase Auth Error:", error);
  };

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
        redirectTo="http://localhost:8080" // Explicitly set redirect URL
        onError={handleAuthError} // Attempt to capture errors
        debug={true}
      />
    </div>
  );
};

export default Login;
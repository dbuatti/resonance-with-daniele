"use client";

import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';

const Login: React.FC = () => {
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
        debug={true}
        redirectTo="http://localhost:32100/" // Hardcode for testing
      />
    </div>
  );
};

export default Login;
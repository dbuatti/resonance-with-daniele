"use client";

import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';

const Login: React.FC = () => {
  // Dynamically get the current origin for the redirect URL
  const redirectToUrl = window.location.origin + '/';

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="p-8 max-w-md w-full bg-card rounded-xl shadow-lg border border-border animate-fade-in-up">
        <h2 className="text-3xl font-bold text-center mb-8 text-foreground font-lora">Login to Resonance with Daniele</h2>
        <Auth
          supabaseClient={supabase}
          providers={['google']}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(var(--primary))',
                  brandAccent: 'hsl(var(--accent))',
                },
              },
            },
          }}
          theme="light"
          redirectTo={redirectToUrl} // Use the dynamic redirect URL
        />
      </div>
    </div>
  );
};

export default Login;
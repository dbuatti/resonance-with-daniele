"use client";

import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';

const Login: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="p-8 max-w-md w-full bg-card rounded-xl shadow-lg border border-border">
        <h2 className="text-3xl font-bold text-center mb-8 text-foreground">Login to Resonance with Daniele</h2>
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
                  // You can add more specific color overrides here if needed
                  // For example:
                  // defaultButtonBackground: 'hsl(var(--primary))',
                  // defaultButtonBackgroundHover: 'hsl(var(--primary-foreground))',
                  // defaultButtonBorder: 'hsl(var(--primary))',
                  // defaultButtonText: 'hsl(var(--primary-foreground))',
                  // inputBackground: 'hsl(var(--input))',
                  // inputBorder: 'hsl(var(--border))',
                  // inputText: 'hsl(var(--foreground))',
                },
              },
            },
          }}
          theme="light"
          debug={false} // Set to false for production
          redirectTo="http://localhost:32100/"
        />
      </div>
    </div>
  );
};

export default Login;
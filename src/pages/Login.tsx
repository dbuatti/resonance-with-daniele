"use client";

import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useTheme } from 'next-themes'; // Import useTheme

const Login: React.FC = () => {
  const redirectToUrl = window.location.origin + '/';
  const { resolvedTheme } = useTheme(); // Get the resolved theme

  // Determine the theme for Supabase Auth UI
  const authTheme = resolvedTheme === 'dark' ? 'dark' : 'light';

  return (
    <div className="flex flex-col items-center justify-center p-4 min-h-[calc(100vh-80px)]">
      <div className="p-8 max-w-md w-full bg-card rounded-xl shadow-2xl border-2 border-primary/20">
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
          theme={authTheme}
          redirectTo={redirectToUrl}
        />
        <div className="mt-6 text-center">
          <Button variant="link" asChild>
            <Link to="/" className="text-primary hover:underline">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Login;
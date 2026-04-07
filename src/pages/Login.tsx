"use client";

import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Music } from 'lucide-react';
import { useTheme } from 'next-themes';

const Login: React.FC = () => {
  const redirectToUrl = window.location.origin + '/';
  const { resolvedTheme } = useTheme();
  const authTheme = resolvedTheme === 'dark' ? 'dark' : 'light';

  return (
    <div className="flex flex-col items-center justify-center p-4 min-h-[calc(100vh-80px)] bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="p-8 md:p-12 max-w-md w-full bg-card rounded-[2.5rem] soft-shadow border-4 border-white/10 animate-fade-in-up">
        <div className="flex flex-col items-center mb-8 text-center space-y-4">
          <div className="bg-primary/10 p-4 rounded-2xl text-primary">
            <Music className="h-10 w-10" />
          </div>
          <div className="space-y-1">
            <h2 className="text-3xl font-black font-lora tracking-tight">Welcome Back</h2>
            <p className="text-muted-foreground font-medium">Sign in to access your choir resources.</p>
          </div>
        </div>

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
                radii: {
                  borderRadiusButton: '1rem',
                  inputBorderRadius: '1rem',
                }
              },
            },
          }}
          theme={authTheme}
          redirectTo={redirectToUrl}
        />
        
        <div className="mt-8 text-center">
          <Button variant="ghost" asChild className="text-muted-foreground hover:text-primary font-bold">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Login;
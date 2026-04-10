"use client";

import React, { useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Music, Sparkles } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useSession } from '@/integrations/supabase/auth';

const Login: React.FC = () => {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const redirectToUrl = window.location.origin + '/';
  const { resolvedTheme } = useTheme();
  const authTheme = resolvedTheme === 'dark' ? 'dark' : 'light';

  // Redirect to home if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <Music className="h-12 w-12 text-primary animate-bounce" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 min-h-[calc(100vh-80px)] bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="p-8 md:p-12 max-w-md w-full bg-card rounded-[2.5rem] soft-shadow border-4 border-white/10 animate-fade-in-up">
        <div className="flex flex-col items-center mb-8 text-center space-y-4">
          <div className="bg-primary/10 p-4 rounded-2xl text-primary">
            <Music className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black font-lora tracking-tight">Join the Circle</h2>
            <p className="text-muted-foreground font-medium leading-relaxed">
              Sign in to access your sheet music, practice tracks, and community updates.
            </p>
          </div>
        </div>

        <div className="bg-accent/10 p-4 rounded-2xl mb-8 border border-accent/20 flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-accent-foreground shrink-0 mt-0.5" />
          <p className="text-xs font-bold text-accent-foreground leading-tight">
            New here? Just sign in with Google to instantly create your member account and access your resources.
          </p>
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
"use client";

import React, { useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useSession } from '@/integrations/supabase/auth';
import { usePageLoading } from '@/contexts/PageLoadingContext'; // Import usePageLoading

const Login: React.FC = () => {
  const { loading: loadingUserSession } = useSession();
  const { setPageLoading } = usePageLoading(); // Consume setPageLoading

  useEffect(() => {
    console.log("[Login Page] useEffect: Session loading:", loadingUserSession);
    // Login page itself doesn't fetch data, it relies on auth state.
    // Set pageLoading to false once session is resolved.
    if (!loadingUserSession) {
      setPageLoading(false);
      console.log("[Login Page] Page loading set to false (session resolved).");
    } else {
      setPageLoading(true); // Keep page loading true while session is loading
      console.log("[Login Page] Page loading set to true (session loading).");
    }
  }, [loadingUserSession, setPageLoading]);

  // Dynamically get the current origin for the redirect URL
  const redirectToUrl = window.location.origin + '/';

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
          theme="light"
          redirectTo={redirectToUrl} // Use the dynamic redirect URL
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
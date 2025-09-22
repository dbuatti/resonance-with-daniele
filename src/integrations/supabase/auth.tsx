"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './client';
import { useNavigate, useLocation } from 'react-router-dom';

interface CustomUser extends User {
  is_admin?: boolean; // Add is_admin property
}

interface SessionContextType {
  session: Session | null;
  user: CustomUser | null;
  loading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider = ({ children }: { children: React.ReactNode }): JSX.Element => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // This function will handle setting the user and admin status
  const processUser = useCallback(async (supabaseUser: User | null) => {
    if (supabaseUser) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', supabaseUser.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error("Error fetching user profile for admin status:", profileError);
        setUser({ ...supabaseUser, is_admin: false });
      } else {
        setUser({ ...supabaseUser, is_admin: profileData?.is_admin || false });
      }
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    let initialSessionChecked = false; // Flag to ensure loading is set to false after the first check

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (ignore) return;

      setSession(currentSession);
      await processUser(currentSession?.user || null);

      if (!initialSessionChecked) {
        setLoading(false); // Set loading to false after the first auth state is processed
        initialSessionChecked = true;
      }

      // Handle redirects
      if (currentSession?.user && location.pathname === '/login') {
        navigate('/');
      } else if (!currentSession?.user && location.pathname !== '/login' && location.pathname !== '/' && location.pathname !== '/events' && location.pathname !== '/resources') {
        navigate('/login');
      }
    });

    // Immediately check session in case onAuthStateChange 'INITIAL_SESSION' is not fired or is delayed.
    // This is a fallback to ensure `loading` is resolved.
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (ignore || initialSessionChecked) return; // If the listener already handled it, don't re-process

      setSession(initialSession);
      await processUser(initialSession?.user || null);
      setLoading(false);
      initialSessionChecked = true;

      // Handle redirects (duplicate, but ensures it runs if listener is slow)
      if (initialSession?.user && location.pathname === '/login') {
        navigate('/');
      } else if (!initialSession?.user && location.pathname !== '/login' && location.pathname !== '/' && location.pathname !== '/events' && location.pathname !== '/resources') {
        navigate('/login');
      }
    }).catch(error => {
      console.error("Error fetching initial session:", error);
      if (!initialSessionChecked) {
        setLoading(false);
        initialSessionChecked = true;
      }
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname, processUser]);

  const contextValue = { session, user, loading };

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionContextProvider');
  }
  return context;
};
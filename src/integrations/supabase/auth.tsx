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
  const [loading, setLoading] = useState(true); // Keep loading true initially
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

    const initializeSession = async () => {
      setLoading(true); // Ensure loading is true at the start of initialization
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      if (ignore) return;

      setSession(initialSession);
      await processUser(initialSession?.user || null); // Wait for user processing
      
      setLoading(false); // Set loading to false only after user is fully processed

      // Handle redirects after initial load
      if (initialSession?.user && location.pathname === '/login') {
        navigate('/');
      } else if (!initialSession?.user && location.pathname !== '/login' && location.pathname !== '/' && location.pathname !== '/events' && location.pathname !== '/resources') {
        navigate('/login');
      }
    };

    initializeSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      if (ignore) return;
      // For subsequent changes, we might not need to set loading to true again
      // unless it's a full sign-in/sign-out that requires re-processing
      setSession(currentSession);
      await processUser(currentSession?.user || null);
      // No setLoading(false) here, as initial load already handled it.
      // If a user signs out, processUser will set user to null, and components will react.
      // If a user signs in, processUser will set user, and components will react.
      // The loading state is primarily for the *initial* render.
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname, processUser]); // Added processUser to dependencies

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
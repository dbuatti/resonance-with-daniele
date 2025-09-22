"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
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

  useEffect(() => {
    let ignore = false; // Flag to prevent state updates on unmounted component

    const handleAuthStateChange = async (currentSession: Session | null) => {
      if (ignore) return;

      setSession(currentSession);

      if (currentSession?.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', currentSession.user.id)
          .single();

        if (ignore) return; // Check again after async operation

        if (profileError && profileError.code !== 'PGRST116') {
          console.error("Error fetching user profile for admin status:", profileError);
          setUser({ ...currentSession.user, is_admin: false });
        } else {
          setUser({ ...currentSession.user, is_admin: profileData?.is_admin || false });
        }

        if (location.pathname === '/login') {
          navigate('/');
        }
      } else {
        setUser(null);
        if (location.pathname !== '/login' && location.pathname !== '/' && location.pathname !== '/events' && location.pathname !== '/resources') {
          navigate('/login');
        }
      }
      setLoading(false); // Set loading to false only after user state is fully determined
    };

    // Fetch initial session on mount
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!ignore) {
        handleAuthStateChange(initialSession);
      }
    });

    // Set up listener for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!ignore) {
        handleAuthStateChange(currentSession);
      }
    });

    return () => {
      ignore = true; // Cleanup to prevent memory leaks
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]); // Removed user?.id from dependencies to avoid unnecessary re-runs

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
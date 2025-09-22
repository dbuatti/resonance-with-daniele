"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './client';
import { useNavigate, useLocation } from 'react-router-dom';

interface SessionContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider = ({ children }: { children: React.ReactNode }): JSX.Element => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Start loading as true
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log('SessionContextProvider: Initializing auth state listener.');
    console.log('SessionContextProvider: Current URL hash on mount:', window.location.hash);

    // Fetch the initial session immediately to handle page loads/reloads
    supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
      if (error) {
        console.error('SessionContextProvider: Error getting initial session:', error);
      }
      console.log('SessionContextProvider: Initial session check result:', { initialSession });
      setSession(initialSession);
      setUser(initialSession?.user || null);
      setLoading(false); // Set loading to false after initial session check

      // Handle initial redirect based on session
      if (initialSession?.user) {
        console.log('SessionContextProvider: Initial session found, redirecting from login if applicable.');
        if (location.pathname === '/login') {
          navigate('/');
        }
      } else {
        console.log('SessionContextProvider: No initial session, redirecting to login if not already there.');
        if (location.pathname !== '/login') {
          navigate('/login');
        }
      }
    });

    // Set up the real-time auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession, error) => {
      console.log('SessionContextProvider: Auth state changed!', { event, currentSession, error });
      
      if (error) {
        console.error('SessionContextProvider: Error in onAuthStateChange:', error);
      }
      
      setSession(currentSession);
      setUser(currentSession?.user || null);
      // No need to set loading here, as it's handled by the initial getSession and subsequent state changes
      // will naturally update the UI based on `session` and `user`

      if (currentSession?.user) {
        console.log('SessionContextProvider: User found, redirecting from login if applicable.');
        if (location.pathname === '/login') {
          navigate('/');
        }
      } else {
        console.log('SessionContextProvider: No user found, redirecting to login if not already there.');
        if (location.pathname !== '/login') {
          navigate('/login');
        }
      }
    });

    return () => {
      console.log('SessionContextProvider: Unsubscribing from auth state changes.');
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]); // Dependencies for useEffect

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
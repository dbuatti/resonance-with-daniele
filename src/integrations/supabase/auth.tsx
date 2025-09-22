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
  const [loading, setLoading] = useState(true); // Start as true
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log('SessionContextProvider: Initializing auth state listener.');

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log('SessionContextProvider: Auth state changed!', { event, currentSession });
      setSession(currentSession);
      setUser(currentSession?.user || null);
      setLoading(false); // Set loading to false once the initial state is determined

      if (currentSession?.user) {
        console.log('SessionContextProvider: User found, redirecting from login if applicable.');
        if (location.pathname === '/login') {
          navigate('/'); // Redirect authenticated users from login page to home
        }
      } else {
        console.log('SessionContextProvider: No user found, redirecting to login if not already there.');
        if (location.pathname !== '/login') {
          navigate('/login'); // Redirect unauthenticated users to login page
        }
      }
    });

    // The onAuthStateChange listener will fire immediately with the current session (INITIAL_SESSION event)
    // so we don't need a separate getInitialSession call.

    return () => {
      console.log('SessionContextProvider: Unsubscribing from auth state changes.');
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]); // Dependencies are correct

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
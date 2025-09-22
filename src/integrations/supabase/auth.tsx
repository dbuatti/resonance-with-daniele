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
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const getAndSetSession = async (initial = false) => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);

      if (currentSession?.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', currentSession.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error("Error fetching user profile for admin status:", profileError);
          setUser({ ...currentSession.user, is_admin: false });
        } else {
          setUser({ ...currentSession.user, is_admin: profileData?.is_admin || false });
        }

        if (initial && location.pathname === '/login') {
          navigate('/');
        }
      } else {
        setUser(null);
        if (initial && location.pathname !== '/login' && location.pathname !== '/' && location.pathname !== '/events' && location.pathname !== '/resources') {
          navigate('/login');
        }
      }
      setLoading(false);
    };

    // Fetch initial session on mount
    getAndSetSession(true);

    // Set up listener for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      // Only update if the session actually changed or if it's a USER_UPDATED event
      if (currentSession?.user?.id !== user?.id || event === 'USER_UPDATED') {
        getAndSetSession(); // Re-fetch and set session/user on change
      } else if (!currentSession) {
        getAndSetSession(); // Handle sign-out
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname, user?.id]); // Added user?.id to dependency array to react to user changes

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
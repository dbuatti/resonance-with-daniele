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
    console.log("[SessionContext] Initializing auth state change listener.");
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log(`[SessionContext] Auth state changed: Event=${event}, Session=${currentSession ? 'present' : 'null'}`);
      setSession(currentSession);
      let currentUser: CustomUser | null = currentSession?.user || null;
      console.log("[SessionContext] Raw currentUser from session:", currentUser);

      if (currentUser) {
        console.log(`[SessionContext] Fetching is_admin status for user ID: ${currentUser.id}`);
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', currentUser.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error("[SessionContext] Error fetching admin status:", profileError);
        } else if (profileData) {
          currentUser = { ...currentUser, is_admin: profileData.is_admin };
          console.log("[SessionContext] User is_admin status fetched:", profileData.is_admin);
        } else {
          currentUser = { ...currentUser, is_admin: false }; // Default to false if no profile or no is_admin
          console.log("[SessionContext] No profile data found for user, setting is_admin to false.");
        }
      }
      
      setUser(currentUser);
      setLoading(false);
      console.log("[SessionContext] Final user state:", currentUser);
      console.log("[SessionContext] Loading state set to false.");

      if (currentUser) {
        console.log(`[SessionContext] User is logged in. Current path: ${location.pathname}`);
        if (location.pathname === '/login') {
          console.log("[SessionContext] Redirecting from /login to /.");
          navigate('/');
        }
      } else {
        console.log(`[SessionContext] User is NOT logged in. Current path: ${location.pathname}`);
        if (location.pathname !== '/login' && location.pathname !== '/' && location.pathname !== '/events' && location.pathname !== '/resources') {
          console.log(`[SessionContext] Redirecting from ${location.pathname} to /login.`);
          navigate('/login');
        }
      }
    });

    return () => {
      console.log("[SessionContext] Unsubscribing from auth state changes.");
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  const contextValue = { session, user, loading };
  console.log("[SessionContext] Rendering SessionContextProvider with loading:", loading, "user:", user ? user.id : 'null');

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
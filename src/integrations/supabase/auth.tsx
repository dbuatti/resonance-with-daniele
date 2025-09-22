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
    console.log("[Auth Debug] Processing user:", supabaseUser?.id);
    if (supabaseUser) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', supabaseUser.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error("[Auth Debug] Error fetching user profile for admin status:", profileError);
        setUser({ ...supabaseUser, is_admin: false });
      } else {
        const isAdmin = profileData?.is_admin || false;
        console.log(`[Auth Debug] User ${supabaseUser.id} is_admin: ${isAdmin}`);
        setUser({ ...supabaseUser, is_admin: isAdmin });
      }
    } else {
      console.log("[Auth Debug] No Supabase user to process.");
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    let initialSessionChecked = false; // Flag to ensure loading is set to false after the first check

    console.log("[Auth Debug] useEffect: Setting up auth state listener.");

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (ignore) {
        console.log("[Auth Debug] onAuthStateChange: Ignoring event due to cleanup.");
        return;
      }

      console.log(`[Auth Debug] onAuthStateChange event: ${event}, session:`, currentSession);
      setSession(currentSession);
      await processUser(currentSession?.user || null);

      if (!initialSessionChecked) {
        console.log("[Auth Debug] onAuthStateChange: Initial session processed, setting loading to false.");
        setLoading(false); // Set loading to false after the first auth state is processed
        initialSessionChecked = true;
      }

      // Handle redirects
      console.log(`[Auth Debug] Current path: ${location.pathname}, User: ${!!currentSession?.user}`);
      if (currentSession?.user && location.pathname === '/login') {
        console.log("[Auth Debug] Redirecting authenticated user from /login to /.");
        navigate('/');
      } else if (!currentSession?.user && location.pathname !== '/login' && location.pathname !== '/' && location.pathname !== '/events' && location.pathname !== '/resources') {
        console.log("[Auth Debug] Redirecting unauthenticated user from protected route to /login.");
        navigate('/login');
      }
    });

    // Immediately check session in case onAuthStateChange 'INITIAL_SESSION' is not fired or is delayed.
    // This is a fallback to ensure `loading` is resolved.
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (ignore || initialSessionChecked) { // If the listener already handled it, don't re-process
        console.log("[Auth Debug] getSession: Ignoring initial session check (already handled or cleaned up).");
        return;
      }

      console.log("[Auth Debug] getSession: Initial session check fallback, session:", initialSession);
      setSession(initialSession);
      await processUser(initialSession?.user || null);
      console.log("[Auth Debug] getSession: Initial session processed, setting loading to false.");
      setLoading(false);
      initialSessionChecked = true;

      // Handle redirects (duplicate, but ensures it runs if listener is slow)
      console.log(`[Auth Debug] Current path: ${location.pathname}, User: ${!!initialSession?.user}`);
      if (initialSession?.user && location.pathname === '/login') {
        console.log("[Auth Debug] Redirecting authenticated user from /login to / (fallback).");
        navigate('/');
      } else if (!initialSession?.user && location.pathname !== '/login' && location.pathname !== '/' && location.pathname !== '/events' && location.pathname !== '/resources') {
        console.log("[Auth Debug] Redirecting unauthenticated user from protected route to /login (fallback).");
        navigate('/login');
      }
    }).catch(error => {
      console.error("[Auth Debug] Error fetching initial session (fallback):", error);
      if (!initialSessionChecked) {
        console.log("[Auth Debug] getSession: Error occurred, setting loading to false.");
        setLoading(false);
        initialSessionChecked = true;
      }
    });

    return () => {
      console.log("[Auth Debug] useEffect cleanup: Unsubscribing from auth state changes.");
      ignore = true;
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname, processUser]);

  const contextValue = { session, user, loading };
  console.log(`[Auth Debug] Render: loading=${loading}, user=${!!user}, session=${!!session}`);

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
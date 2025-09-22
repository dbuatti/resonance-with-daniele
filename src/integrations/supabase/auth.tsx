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
  const [loading, setLoading] = useState(true); // Initial state is true
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
        console.log(`[SessionContext] Ensuring profile exists for user ID: ${currentUser.id}`);
        // Use upsert to either insert a new profile or update an existing one
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .upsert(
            {
              id: currentUser.id,
              first_name: currentUser.user_metadata?.first_name || null,
              last_name: currentUser.user_metadata?.last_name || null,
              avatar_url: currentUser.user_metadata?.avatar_url || null,
              is_admin: currentUser.email === 'daniele.buatti@gmail.com' || currentUser.email === 'resonancewithdaniele@gmail.com',
            },
            { onConflict: 'id' } // If a row with this 'id' exists, update it; otherwise, insert it.
          );

        if (profileError) {
          console.error("[SessionContext] Error upserting profile data:", profileError);
          currentUser = { ...currentUser, is_admin: false }; // Default to false on error
        } else if (profileData && profileData.length > 0) {
          // Profile exists or was created/updated, get is_admin status from the returned data
          currentUser = { ...currentUser, is_admin: profileData[0].is_admin };
          console.log("[SessionContext] User profile upserted. is_admin status:", profileData[0].is_admin);
        } else {
          // Fallback if upsert didn't return data (should ideally not happen with upsert)
          currentUser = { ...currentUser, is_admin: currentUser.email === 'daniele.buatti@gmail.com' || currentUser.email === 'resonancewithdaniele@gmail.com' };
          console.log("[SessionContext] Profile upserted, but no data returned. Setting is_admin based on email.");
        }
      }
      
      setUser(currentUser);
      setLoading(false); // Ensure loading is set to false after all async operations
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
        // Only redirect if not already on a public page
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
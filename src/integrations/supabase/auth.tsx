"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './client';
import { useNavigate, useLocation } from 'react-router-dom';
import { PostgrestError } from '@supabase/supabase-js'; // Import PostgrestError

// Define the Profile interface based on your 'profiles' table schema
interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  is_admin: boolean; // This is crucial for the TypeScript fix
  updated_at: string;
  how_heard: string | null;
  motivation: string[] | null;
  attended_session: boolean | null;
  singing_experience: string | null;
  session_frequency: string | null;
  preferred_time: string | null;
  music_genres: string[] | null;
  choir_goals: string | null;
  inclusivity_importance: string | null;
  suggestions: string | null;
}

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

  // Memoized function to process user and profile data
  const processUserAndProfile = useCallback(async (currentUser: User | null) => {
    let processedUser: CustomUser | null = currentUser;

    if (processedUser) {
      console.log(`[SessionContext] Processing profile for user ID: ${processedUser.id}`);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin') // Only select is_admin, as other profile data is managed elsewhere
        .eq('id', processedUser.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error("[SessionContext] Error fetching profile data:", profileError);
        processedUser = { ...processedUser, is_admin: false }; // Default to false on error
      } else if (profileData) {
        processedUser = { ...processedUser, is_admin: profileData.is_admin };
        console.log("[SessionContext] User profile fetched. is_admin status:", profileData.is_admin);
      } else {
        // If no profile found, assume not admin, or set based on email for initial setup
        processedUser = { ...processedUser, is_admin: processedUser.email === 'daniele.buatti@gmail.com' || processedUser.email === 'resonancewithdaniele@gmail.com' };
        console.log("[SessionContext] No profile found for user. Setting is_admin based on email.");
      }
    }
    return processedUser;
  }, []); // No dependencies, as supabase is stable

  useEffect(() => {
    console.log("[SessionContext] Initializing session and auth state listener.");

    const getInitialSessionAndSetupListener = async () => {
      // 1. Get initial session immediately
      console.log("[SessionContext] Attempting to get initial session.");
      const { data: { session: initialSession }, error: initialSessionError } = await supabase.auth.getSession();

      if (initialSessionError) {
        console.error("[SessionContext] Error getting initial session:", initialSessionError);
      }

      const processedInitialUser = await processUserAndProfile(initialSession?.user || null);
      setSession(initialSession);
      setUser(processedInitialUser);
      setLoading(false); // Set loading to false after initial session is processed
      console.log("[SessionContext] Initial session processed. Loading set to false.");

      // Handle redirects after initial session is processed
      if (processedInitialUser) {
        if (location.pathname === '/login') {
          console.log("[SessionContext] Redirecting from /login to / after initial session.");
          navigate('/');
        }
      } else {
        if (location.pathname !== '/login' && location.pathname !== '/' && location.pathname !== '/events' && location.pathname !== '/resources') {
          console.log(`[SessionContext] Redirecting from ${location.pathname} to /login after initial session.`);
          navigate('/login');
        }
      }

      // 2. Set up auth state change listener for subsequent changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
        console.log(`[SessionContext] Auth state changed (listener): Event=${event}, Session=${currentSession ? 'present' : 'null'}`);
        setSession(currentSession);
        const processedUser = await processUserAndProfile(currentSession?.user || null);
        setUser(processedUser);
        // No need to setLoading(false) here again, as it's already false from initial fetch
        console.log("[SessionContext] Listener processed. Final user state:", processedUser);

        // Handle redirects for subsequent auth state changes
        if (processedUser) {
          if (location.pathname === '/login') {
            console.log("[SessionContext] Redirecting from /login to / after listener update.");
            navigate('/');
          }
        } else {
          if (location.pathname !== '/login' && location.pathname !== '/' && location.pathname !== '/events' && location.pathname !== '/resources') {
            console.log(`[SessionContext] Redirecting from ${location.pathname} to /login after listener update.`);
            navigate('/login');
          }
        }
      });

      return () => {
        console.log("[SessionContext] Unsubscribing from auth state changes.");
        subscription.unsubscribe();
      };
    };

    getInitialSessionAndSetupListener();

  }, [navigate, location.pathname, processUserAndProfile]); // Added processUserAndProfile to dependencies

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
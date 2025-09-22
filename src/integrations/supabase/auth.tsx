"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'; // Import useRef
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './client';
import { useNavigate, useLocation } from 'react-router-dom';
import { PostgrestError } from '@supabase/supabase-js';

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
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Refs to hold the latest state values without triggering useEffect re-runs
  const userRef = useRef<CustomUser | null>(user);
  const sessionRef = useRef<Session | null>(session);

  // Update refs whenever state changes
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const processUserAndProfile = useCallback(async (currentUser: User | null) => {
    let processedUser: CustomUser | null = currentUser;

    if (processedUser) {
      console.log(`[SessionContext] Processing profile for user ID: ${processedUser.id}`);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', processedUser.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error("[SessionContext] Error fetching profile data:", profileError);
        processedUser = { ...processedUser, is_admin: false };
      } else if (profileData) {
        processedUser = { ...processedUser, is_admin: profileData.is_admin };
        console.log("[SessionContext] User profile fetched. is_admin status:", profileData.is_admin);
      } else {
        processedUser = { ...processedUser, is_admin: processedUser.email === 'daniele.buatti@gmail.com' || processedUser.email === 'resonancewithdaniele@gmail.com' };
        console.log("[SessionContext] No profile found for user. Setting is_admin based on email.");
      }
    }
    return processedUser;
  }, []);

  useEffect(() => {
    console.log("[SessionContext] Initializing session and auth state listener.");

    const getInitialSessionAndSetupListener = async () => {
      console.log("[SessionContext] Attempting to get initial session.");
      const { data: { session: initialSession }, error: initialSessionError } = await supabase.auth.getSession();

      if (initialSessionError) {
        console.error("[SessionContext] Error getting initial session:", initialSessionError);
      }

      const processedInitialUser = await processUserAndProfile(initialSession?.user || null);
      setSession(initialSession);
      setUser(processedInitialUser);
      setLoading(false);
      console.log("[SessionContext] Initial session processed. Loading set to false.");

      // Initial redirect logic
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

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
        console.log(`[SessionContext] Auth state changed (listener): Event=${event}, Session=${currentSession ? 'present' : 'null'}`);
        
        const processedUser = await processUserAndProfile(currentSession?.user || null);

        const userChanged = (oldUser: CustomUser | null, newUser: CustomUser | null) => {
          console.log("--- userChanged comparison ---");
          console.log("Old User (ref):", oldUser);
          console.log("New User (processed):", newUser);

          if (!oldUser && !newUser) return false;
          if (!oldUser || !newUser) {
            console.log("[SessionContext] User changed: one is null, other isn't.");
            return true;
          }

          if (oldUser.id !== newUser.id) {
            console.log("[SessionContext] User changed: ID mismatch.");
            return true;
          }
          if (oldUser.email !== newUser.email) {
            console.log("[SessionContext] User changed: Email mismatch.");
            return true;
          }
          if (oldUser.is_admin !== newUser.is_admin) {
            console.log("[SessionContext] User changed: Admin status mismatch.");
            return true;
          }

          const oldMeta = oldUser.user_metadata || {};
          const newMeta = newUser.user_metadata || {};

          if (oldMeta.first_name !== newMeta.first_name) {
            console.log(`[SessionContext] User changed: First name mismatch. Old: ${oldMeta.first_name}, New: ${newMeta.first_name}`);
            return true;
          }
          if (oldMeta.last_name !== newMeta.last_name) {
            console.log(`[SessionContext] User changed: Last name mismatch. Old: ${oldMeta.last_name}, New: ${newMeta.last_name}`);
            return true;
          }
          if (oldMeta.avatar_url !== newMeta.avatar_url) {
            console.log(`[SessionContext] User changed: Avatar URL mismatch. Old: ${oldMeta.avatar_url}, New: ${newMeta.avatar_url}`);
            return true;
          }
          
          console.log("[SessionContext] User unchanged.");
          return false;
        };

        const sessionChanged = (oldSession: Session | null, newSession: Session | null) => {
          if (oldSession === null && newSession === null) return false;
          if (oldSession === null || newSession === null) return true;
          return oldSession.access_token !== newSession.access_token || oldSession.expires_at !== newSession.expires_at;
        };

        // Use refs for comparison to get the latest state values
        const shouldUpdateUser = userChanged(userRef.current, processedUser);
        const shouldUpdateSession = sessionChanged(sessionRef.current, currentSession);

        if (shouldUpdateSession) {
          setSession(currentSession);
          console.log("[SessionContext] Listener processed. Session state updated.");
        }
        if (shouldUpdateUser) {
          setUser(processedUser);
          console.log("[SessionContext] Listener processed. User state updated.");
        } else if (!shouldUpdateSession && !shouldUpdateUser) {
          console.log("[SessionContext] Listener processed. User and Session state unchanged (no significant diff).");
        }

        // Redirect logic
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

  }, [navigate, processUserAndProfile]); // Removed location.pathname from dependencies

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
"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './client';
import { useNavigate, useLocation } from 'react-router-dom';
import { PostgrestError } from '@supabase/supabase-js';

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
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
  is_admin: boolean; // Make it non-optional
}

interface SessionContextType {
  session: Session | null;
  user: CustomUser | null;
  loading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider = ({ children }: { children: React.ReactNode }): JSX.Element => {
  // Use a single state object to manage session, user, and loading
  const [contextState, setContextState] = useState<SessionContextType>({
    session: null,
    user: null,
    loading: true,
  });

  const { session, user, loading } = contextState; // Destructure for easier access

  const navigate = useNavigate();
  const location = useLocation();

  // Refs to keep track of the *current* user and session for comparison in the listener
  const userRef = useRef<CustomUser | null>(user);
  const sessionRef = useRef<Session | null>(session);
  const initialSessionHandledRef = useRef(false);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const fetchIsAdminStatus = useCallback(async (userId: string, userEmail: string | undefined): Promise<boolean> => {
    console.log(`[SessionContext] Fetching is_admin status for user ID: ${userId}`);
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error("[SessionContext] Error fetching profile data for is_admin:", profileError);
      return false;
    } else if (profileData) {
      console.log("[SessionContext] is_admin status fetched:", profileData.is_admin);
      return profileData.is_admin;
    } else {
      const isAdminByEmail = userEmail === 'daniele.buatti@gmail.com' || userEmail === 'resonancewithdaniele@gmail.com';
      console.log("[SessionContext] No profile found for user. Setting is_admin based on email:", isAdminByEmail);
      return isAdminByEmail;
    }
  }, []);

  useEffect(() => {
    console.log("[SessionContext] Initializing session and auth state listener.");

    const getInitialSessionAndSetupListener = async () => {
      console.log("[SessionContext] Attempting to get initial session.");
      const { data: { session: initialSession }, error: initialSessionError } = await supabase.auth.getSession();

      if (initialSessionError) {
        console.error("[SessionContext] Error getting initial session:", initialSessionError);
      }

      let userWithAdminStatus: CustomUser | null = null;
      if (initialSession?.user) {
        const isAdmin = await fetchIsAdminStatus(initialSession.user.id, initialSession.user.email);
        userWithAdminStatus = { ...initialSession.user, is_admin: isAdmin };
        console.log("[SessionContext] Initial user with admin status:", userWithAdminStatus);
      }
      
      // Update all relevant states in a single call to prevent multiple renders
      setContextState({
        session: initialSession,
        user: userWithAdminStatus,
        loading: false,
      });
      initialSessionHandledRef.current = true; 
      console.log("[SessionContext] Initial session processed. Loading set to false. User with admin status set.");

      // Handle redirects based on initial session and admin status
      if (userWithAdminStatus) {
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
        
        // If this is an INITIAL_SESSION event and we've already handled it, skip to prevent redundant updates
        if (event === 'INITIAL_SESSION' && initialSessionHandledRef.current) {
          console.log("[SessionContext] Skipping redundant INITIAL_SESSION event from listener.");
          return;
        }

        let newUserWithAdminStatus: CustomUser | null = null;
        if (currentSession?.user) {
          const existingUser = userRef.current;
          let isAdmin = false;
          if (existingUser && existingUser.id === currentSession.user.id && typeof existingUser.is_admin === 'boolean') {
            isAdmin = existingUser.is_admin;
            console.log("[SessionContext] Reusing existing is_admin status for same user.");
          } else {
            isAdmin = await fetchIsAdminStatus(currentSession.user.id, currentSession.user.email);
          }
          newUserWithAdminStatus = { ...currentSession.user, is_admin: isAdmin };
        }

        const userChanged = (oldUser: CustomUser | null, newUser: CustomUser | null) => {
          console.log("--- userChanged comparison ---");
          console.log("Old User (ref):", oldUser);
          console.log("New User (from currentSession):", newUser);

          if (!oldUser && !newUser) return false;
          if (!oldUser || !newUser) {
            console.log("[SessionContext] User changed: one is null, other isn't.");
            return true;
          }

          if (oldUser.id !== newUser.id) return true;
          if (oldUser.email !== newUser.email) return true;
          if (oldUser.is_admin !== newUser.is_admin) return true; 
          
          const oldMeta = oldUser.user_metadata || {};
          const newMeta = newUser.user_metadata || {};
          if (oldMeta.first_name !== newMeta.first_name) return true;
          if (oldMeta.last_name !== newMeta.last_name) return true;
          if (oldMeta.avatar_url !== newMeta.avatar_url) return true;
          
          console.log("[SessionContext] Core User (Auth) unchanged.");
          return false;
        };

        const sessionChanged = (oldSession: Session | null, newSession: Session | null) => {
          if (oldSession === null && newSession === null) return false;
          if (oldSession === null || newSession === null) return true;
          return oldSession.access_token !== newSession.access_token || oldSession.expires_at !== newSession.expires_at;
        };

        const shouldUpdateSession = sessionChanged(sessionRef.current, currentSession);
        const shouldUpdateCoreUser = userChanged(userRef.current, newUserWithAdminStatus);

        if (shouldUpdateSession || shouldUpdateCoreUser) {
          setContextState(prevState => ({
            ...prevState,
            session: currentSession,
            user: newUserWithAdminStatus,
            loading: false, // Ensure loading is false after any auth state change
          }));
          console.log("[SessionContext] Listener processed. Session and/or User state updated.");
        } else {
          console.log("[SessionContext] Listener processed. User and Session state unchanged (no significant diff).");
        }

        // Handle redirects after auth state change
        if (newUserWithAdminStatus) {
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

  }, [navigate, fetchIsAdminStatus, location.pathname]);

  // Provide the destructured values from the single state object
  const contextValue = { session, user, loading };
  console.log("[SessionContext] Rendering SessionContextProvider with loading:", loading, "user:", user ? user.id : 'null', "is_admin:", user?.is_admin);

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
"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './client';
import { useNavigate, useLocation } from 'react-router-dom';
import { PostgrestError } from '@supabase/supabase-js';

export interface Profile { // Exported Profile interface
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
  email: string | null; // Added email to profile for convenience
}

interface CustomUser extends User {
  is_admin: boolean; // Make it non-optional
}

interface SessionContextType {
  session: Session | null;
  user: CustomUser | null;
  profile: Profile | null; // Added full profile to context
  loading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider = ({ children }: { children: React.ReactNode }): JSX.Element => {
  // Use a single state object to manage session, user, profile, and loading
  const [contextState, setContextState] = useState<SessionContextType>({
    session: null,
    user: null,
    profile: null, // Initialize profile as null
    loading: true,
  });

  const { session, user, profile, loading } = contextState; // Destructure for easier access

  const navigate = useNavigate();
  const location = useLocation();

  // Refs to keep track of the *current* user and session for comparison in the listener
  const userRef = useRef<CustomUser | null>(user);
  const sessionRef = useRef<Session | null>(session);
  const profileRef = useRef<Profile | null>(profile); // Ref for profile
  const initialSessionHandledRef = useRef(false);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const fetchProfileData = useCallback(async (userId: string, userEmail: string | undefined): Promise<Profile | null> => {
    console.log(`[SessionContext] Fetching full profile data for user ID: ${userId}`);
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*') // Select all profile fields
      .eq('id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error("[SessionContext] Error fetching profile data:", profileError);
      return null;
    } else if (profileData) {
      console.log("[SessionContext] Full profile data fetched:", profileData);
      return profileData as Profile;
    } else {
      console.log("[SessionContext] No profile found for user. Returning null profile.");
      return null;
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
      let fullProfile: Profile | null = null;

      if (initialSession?.user) {
        fullProfile = await fetchProfileData(initialSession.user.id, initialSession.user.email);
        const isAdmin = fullProfile?.is_admin ?? (initialSession.user.email === 'daniele.buatti@gmail.com' || initialSession.user.email === 'resonancewithdaniele@gmail.com');
        userWithAdminStatus = { ...initialSession.user, is_admin: isAdmin };
        console.log("[SessionContext] Initial user with admin status:", userWithAdminStatus);
        console.log("[SessionContext] Initial full profile:", fullProfile);
      }
      
      // Update all relevant states in a single call to prevent multiple renders
      setContextState({
        session: initialSession,
        user: userWithAdminStatus,
        profile: fullProfile, // Set the full profile here
        loading: false,
      });
      initialSessionHandledRef.current = true; 
      console.log("[SessionContext] Initial session processed. Loading set to false. User and Profile set.");

      // Define publicly accessible paths
      const publicPaths = ['/', '/events', '/resources', '/current-event'];

      // Handle redirects based on initial session and admin status
      if (userWithAdminStatus) {
        if (location.pathname === '/login') {
          console.log("[SessionContext] Redirecting from /login to / after initial session.");
          navigate('/');
        }
      } else {
        if (!publicPaths.includes(location.pathname)) {
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
        let newFullProfile: Profile | null = null;

        if (currentSession?.user) {
          newFullProfile = await fetchProfileData(currentSession.user.id, currentSession.user.email);
          const isAdmin = newFullProfile?.is_admin ?? (currentSession.user.email === 'daniele.buatti@gmail.com' || currentSession.user.email === 'resonancewithdaniele@gmail.com');
          newUserWithAdminStatus = { ...currentSession.user, is_admin: isAdmin };
        }

        const userChanged = (oldUser: CustomUser | null, newUser: CustomUser | null) => {
          if (!oldUser && !newUser) return false;
          if (!oldUser || !newUser) return true;
          if (oldUser.id !== newUser.id) return true;
          if (oldUser.email !== newUser.email) return true;
          if (oldUser.is_admin !== newUser.is_admin) return true; 
          
          const oldMeta = oldUser.user_metadata || {};
          const newMeta = newUser.user_metadata || {};
          if (oldMeta.first_name !== newMeta.first_name) return true;
          if (oldMeta.last_name !== newMeta.last_name) return true;
          if (oldMeta.avatar_url !== newMeta.avatar_url) return true;
          
          return false;
        };

        const profileChanged = (oldProfile: Profile | null, newProfile: Profile | null) => {
          if (!oldProfile && !newProfile) return false;
          if (!oldProfile || !newProfile) return true;
          // Deep comparison for profile fields (simplified for brevity, can be more thorough)
          return JSON.stringify(oldProfile) !== JSON.stringify(newProfile);
        };

        const sessionChanged = (oldSession: Session | null, newSession: Session | null) => {
          if (oldSession === null && newSession === null) return false;
          if (oldSession === null || newSession === null) return true;
          return oldSession.access_token !== newSession.access_token || oldSession.expires_at !== newSession.expires_at;
        };

        if (shouldUpdateSession || shouldUpdateCoreUser || shouldUpdateProfile) {
          setContextState(prevState => ({
            ...prevState,
            session: currentSession,
            user: newUserWithAdminStatus,
            profile: newFullProfile, // Update the full profile here
            loading: false, // Ensure loading is false after any auth state change
          }));
          console.log("[SessionContext] Listener processed. Session, User, and/or Profile state updated.");
        } else {
          console.log("[SessionContext] Listener processed. User, Session, and Profile state unchanged (no significant diff).");
        }

        // Handle redirects after auth state change
        if (newUserWithAdminStatus) {
          if (location.pathname === '/login') {
            console.log("[SessionContext] Redirecting from /login to / after listener update.");
            navigate('/');
          }
        } else {
          if (!publicPaths.includes(location.pathname)) {
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

  }, [navigate, fetchProfileData, location.pathname]);

  // Provide the destructured values from the single state object
  const contextValue = { session, user, profile, loading };
  console.log("[SessionContext] Rendering SessionContextProvider with loading:", loading, "user:", user ? user.id : 'null', "is_admin:", user?.is_admin, "profile:", profile ? 'present' : 'null');

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
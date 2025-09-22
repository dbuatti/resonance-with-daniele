"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './client';
import { useNavigate, useLocation } from 'react-router-dom';

export interface Profile {
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
  email: string | null;
}

interface CustomUser extends User {
  is_admin: boolean;
}

interface SessionContextType {
  session: Session | null;
  user: CustomUser | null;
  profile: Profile | null;
  loading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider = ({ children }: { children: React.ReactNode }): JSX.Element => {
  const [contextState, setContextState] = useState<SessionContextType>({
    session: null,
    user: null,
    profile: null,
    loading: true,
  });

  const navigate = useNavigate();
  const location = useLocation();

  const fetchProfileData = useCallback(async (userId: string): Promise<Profile | null> => {
    console.log(`[SessionContext] Fetching full profile data for user ID: ${userId}`);
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means "no rows found"
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

  const determineAdminStatus = useCallback((userEmail: string | undefined, profileAdminStatus: boolean | undefined): boolean => {
    return profileAdminStatus ?? (userEmail === 'daniele.buatti@gmail.com' || userEmail === 'resonancewithdaniele@gmail.com');
  }, []);

  useEffect(() => {
    console.log("[SessionContext] Initializing auth state listener.");

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log(`[SessionContext] Auth state changed: Event=${event}, Session=${currentSession ? 'present' : 'null'}`);

      let newUser: CustomUser | null = null;
      let newProfile: Profile | null = null;

      if (currentSession?.user) {
        newProfile = await fetchProfileData(currentSession.user.id);
        const isAdmin = determineAdminStatus(currentSession.user.email, newProfile?.is_admin);
        newUser = { ...currentSession.user, is_admin: isAdmin };
        // Ensure profile also has the email for convenience, even if not directly from DB
        if (newProfile) {
          newProfile.email = currentSession.user.email;
        } else {
          // If no profile exists, create a minimal one for context
          newProfile = {
            id: currentSession.user.id,
            first_name: null,
            last_name: null,
            avatar_url: null,
            is_admin: isAdmin,
            updated_at: new Date().toISOString(),
            how_heard: null, motivation: null, attended_session: null, singing_experience: null,
            session_frequency: null, preferred_time: null, music_genres: null, choir_goals: null,
            inclusivity_importance: null, suggestions: null,
            email: currentSession.user.email,
          };
        }
      }

      setContextState({
        session: currentSession,
        user: newUser,
        profile: newProfile,
        loading: false,
      });
      console.log("[SessionContext] State updated. Loading set to false. User and Profile set.");

      // Define publicly accessible paths
      const publicPaths = ['/', '/events', '/resources', '/current-event', '/login'];

      // Handle redirects after auth state change
      if (newUser) {
        if (location.pathname === '/login') {
          console.log("[SessionContext] Redirecting from /login to / after login.");
          navigate('/');
        }
      } else {
        if (!publicPaths.includes(location.pathname)) {
          console.log(`[SessionContext] Redirecting from ${location.pathname} to /login after logout or unauthenticated access.`);
          navigate('/login');
        }
      }
    });

    return () => {
      console.log("[SessionContext] Unsubscribing from auth state changes.");
      subscription.unsubscribe();
    };
  }, [navigate, fetchProfileData, determineAdminStatus, location.pathname]);

  const contextValue = { ...contextState };
  console.log("[SessionContext] Rendering SessionContextProvider with loading:", contextState.loading, "user:", contextState.user ? contextState.user.id : 'null', "is_admin:", contextState.user?.is_admin, "profile:", contextState.profile ? 'present' : 'null');

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
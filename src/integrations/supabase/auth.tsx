"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './client';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query'; // Import useQuery and useQueryClient

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
  loading: boolean; // Overall loading for the session context
  profileLoading: boolean; // Loading specifically for the profile data
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider = ({ children }: { children: React.ReactNode }): JSX.Element => {
  const [session, setSession] = useState<Session | null>(null);
  const [initialLoading, setInitialLoading] = useState(true); // For initial session fetch
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Function to determine admin status
  const determineAdminStatus = useCallback((userEmail: string | undefined, profileAdminStatus: boolean | undefined): boolean => {
    return profileAdminStatus ?? (userEmail === 'daniele.buatti@gmail.com' || userEmail === 'resonancewithdaniele@gmail.com');
  }, []);

  // Use react-query to fetch and cache the user profile
  const { data: profile, isLoading: profileLoading } = useQuery<Profile | null, Error>(
    ['profile', session?.user?.id], // Query key depends on user ID
    async () => {
      if (!session?.user?.id) {
        console.log("[SessionContext] No user ID, skipping profile fetch.");
        return null;
      }
      console.log(`[SessionContext] Fetching full profile data for user ID: ${session.user.id}`);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means "no rows found"
        console.error("[SessionContext] Error fetching profile data:", profileError);
        return null;
      } else if (profileData) {
        console.log("[SessionContext] Full profile data fetched:", profileData);
        // Add email to profile for convenience
        return { ...profileData, email: session.user.email } as Profile;
      } else {
        console.log("[SessionContext] No profile found for user. Returning null profile.");
        // If no profile exists, return a minimal one for context with admin status
        return {
          id: session.user.id,
          first_name: null,
          last_name: null,
          avatar_url: null,
          is_admin: determineAdminStatus(session.user.email, undefined), // Determine admin status even if no profile
          updated_at: new Date().toISOString(),
          how_heard: null, motivation: null, attended_session: null, singing_experience: null,
          session_frequency: null, preferred_time: null, music_genres: null, choir_goals: null,
          inclusivity_importance: null, suggestions: null,
          email: session.user.email,
        };
      }
    },
    {
      enabled: !!session?.user?.id, // Only run query if user ID is available
      staleTime: 5 * 60 * 1000, // Data is considered fresh for 5 minutes
      cacheTime: 10 * 60 * 1000, // Data stays in cache for 10 minutes
      refetchOnWindowFocus: true, // Refetch when window regains focus
      onError: (error) => {
        console.error("[SessionContext] React Query profile fetch error:", error);
      },
    }
  );

  // Effect for Supabase auth state changes
  useEffect(() => {
    console.log("[SessionContext] Initializing auth state listener.");

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log(`[SessionContext] Auth state changed: Event=${event}, Session=${currentSession ? 'present' : 'null'}`);
      setSession(currentSession);
      setInitialLoading(false); // Initial session check is complete

      // Invalidate profile query on auth changes to ensure fresh profile data
      if (currentSession?.user) {
        queryClient.invalidateQueries({ queryKey: ['profile', currentSession.user.id] });
      } else {
        queryClient.removeQueries({ queryKey: ['profile'] }); // Clear profile cache if logged out
      }
    });

    // Fetch initial session on component mount
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      console.log("[SessionContext] Initial getSession result:", initialSession ? 'present' : 'null');
      setSession(initialSession);
      setInitialLoading(false);
    });

    return () => {
      console.log("[SessionContext] Unsubscribing from auth state changes.");
      subscription.unsubscribe();
    };
  }, [queryClient]); // Add queryClient to dependencies

  // Derived user object with admin status
  const user: CustomUser | null = session?.user ? {
    ...session.user,
    is_admin: determineAdminStatus(session.user.email, profile?.is_admin),
  } : null;

  // Handle redirects
  useEffect(() => {
    if (!initialLoading) {
      const publicPaths = ['/', '/events', '/resources', '/current-event', '/login'];
      if (user) {
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
    }
  }, [user, initialLoading, location.pathname, navigate]);

  const contextValue = {
    session,
    user,
    profile,
    loading: initialLoading || profileLoading, // Overall loading is true if initial session or profile is loading
    profileLoading,
  };
  console.log("[SessionContext] Rendering SessionContextProvider with overall loading:", contextValue.loading, "profileLoading:", profileLoading, "user:", user ? user.id : 'null', "is_admin:", user?.is_admin, "profile:", profile ? 'present' : 'null');

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
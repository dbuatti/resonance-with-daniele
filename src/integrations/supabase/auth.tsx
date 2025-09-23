"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './client';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { showSuccess, showError } from '@/utils/toast'; // Import toast functions

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
  voice_type: string[] | null; // Added voice_type
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
  isLoggingOut: boolean; // Added isLoggingOut
  logout: () => Promise<void>; // Added logout function to context
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider = ({ children }: { children: React.ReactNode }): JSX.Element => {
  const [session, setSession] = useState<Session | null>(null);
  const [initialLoading, setInitialLoading] = useState(true); // For initial session fetch
  const [isLoggingOut, setIsLoggingOut] = useState(false); // State for logout loading
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Function to determine admin status
  const determineAdminStatus = useCallback((userEmail: string | undefined, profileAdminStatus: boolean | undefined): boolean => {
    return profileAdminStatus ?? (userEmail === 'daniele.buatti@gmail.com' || userEmail === 'resonancewithdaniele@gmail.com');
  }, []);

  // Centralized logout function
  const logout = useCallback(async () => {
    setIsLoggingOut(true);
    console.log("[SessionContext] Initiating logout. Clearing client cache and session state.");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        if (error.name === 'AuthSessionMissingError') {
          console.log("[SessionContext] AuthSessionMissingError returned, treating as successful logout.");
          showSuccess("Logged out successfully!");
        } else {
          console.error("[SessionContext] Error during logout:", error);
          showError("Failed to log out: " + error.message);
        }
      } else {
        showSuccess("Logged out successfully!");
        console.log("[SessionContext] User logged out.");
      }
    } catch (error: any) {
      console.error("[SessionContext] Unexpected exception during logout:", error);
      showError("An unexpected error occurred during logout: " + error.message);
    } finally {
      // Ensure client-side state is fully reset regardless of server response
      setSession(null); // Explicitly clear session state
      queryClient.clear(); // Clear all cached queries
      console.log("[SessionContext] All React Query caches cleared and session state reset.");
      navigate('/login'); // Redirect to login page
      setIsLoggingOut(false);
    }
  }, [queryClient, navigate]);

  // Effect to handle Supabase auth state changes and initial session fetch
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      console.log("[SessionContext] Auth state changed:", _event, currentSession ? 'session present' : 'no session');
      setSession(currentSession);
      setInitialLoading(false);
      // Invalidate profile query to refetch with new session
      queryClient.invalidateQueries({ queryKey: ['profile', currentSession?.user?.id] });

      // If signed out, clear all queries related to user data
      if (_event === 'SIGNED_OUT') {
        queryClient.clear(); // Clear all cached queries
        console.log("[SessionContext] All React Query caches cleared due to SIGNED_OUT event.");
        // No need to navigate here, as the explicit logout function handles it.
      }
    });

    // Fetch initial session on component mount
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log("[SessionContext] Initial getSession:", currentSession ? 'session present' : 'no session');
      setSession(currentSession);
      setInitialLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [queryClient]); // Add queryClient to dependencies

  // Use react-query to fetch and cache the user profile
  const { data: profile, isLoading: profileLoading } = useQuery<
    Profile | null, // TQueryFnData: The type of data returned by the queryFn
    Error,          // TError: The type of error that can be thrown
    Profile | null, // TData: The type of data in the cache (defaults to TQueryFnData if omitted)
    ['profile', string | null | undefined] // TQueryKey: Explicitly define the tuple type here
  >({
    queryKey: ['profile', session?.user?.id],
    queryFn: async () => {
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
        throw profileError; // Re-throw to be caught by react-query's error handling
      } else if (profileData) {
        console.log("[SessionContext] Full profile data fetched:", profileData);
        // Add email to profile for convenience
        return { ...profileData, email: session.user.email } as Profile;
      } else {
        console.log("[SessionContext] No profile found for user. Returning minimal profile with admin status.");
        // If no profile exists, return a minimal one for context with admin status
        return {
          id: session.user.id,
          first_name: null,
          last_name: null,
          avatar_url: null,
          is_admin: determineAdminStatus(session.user.email, undefined), // Determine admin status even if no profile
          updated_at: new Date().toISOString(), // Provide a default or current timestamp
          how_heard: null, motivation: null, attended_session: null, singing_experience: null,
          session_frequency: null, preferred_time: null, music_genres: null, choir_goals: null,
          inclusivity_importance: null, suggestions: null,
          email: session.user.email,
          voice_type: null, // Default for new column
        };
      }
    },
    enabled: !!session?.user?.id, // Only run query if user ID is available
    staleTime: 5 * 60 * 1000, // Data is considered fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Data stays in cache for 10 minutes (renamed from cacheTime in v5)
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  // Derived user object with admin status
  const user: CustomUser | null = session?.user ? {
    ...session.user,
    is_admin: determineAdminStatus(session.user.email, profile?.is_admin),
  } : null;

  // Handle redirects for unauthenticated users trying to access protected routes
  useEffect(() => {
    if (!initialLoading && !isLoggingOut) { // Only redirect if not initially loading and not in the middle of logging out
      const publicPaths = ['/', '/events', '/resources', '/current-event', '/login', '/learn-more'];
      if (!user && !publicPaths.includes(location.pathname)) {
        console.log(`[SessionContext] Redirecting from ${location.pathname} to /login due to unauthenticated access.`);
        navigate('/login');
      }
    }
  }, [user, initialLoading, isLoggingOut, location.pathname, navigate]);

  const contextValue: SessionContextType = { // Explicitly type contextValue
    session,
    user,
    profile,
    loading: initialLoading || profileLoading, // Overall loading is true if initial session or profile is loading
    profileLoading,
    isLoggingOut, // Provide the state
    logout, // Provide the centralized logout function
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
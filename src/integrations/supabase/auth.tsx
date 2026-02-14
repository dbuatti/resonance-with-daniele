"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './client';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { showSuccess, showError } from '@/utils/toast';

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
  voice_type: string[] | null;
}

interface CustomUser extends User {
  is_admin: boolean;
}

interface SessionContextType {
  session: Session | null;
  user: CustomUser | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  isLoggingOut: boolean;
  isAdminView: boolean;
  isActualAdmin: boolean;
  isProfileCompleted: boolean;
  isSurveyCompleted: boolean;
  incompleteTasksCount: number;
  toggleAdminView: () => void;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider = ({ children }: { children: React.ReactNode }): JSX.Element => {
  const [session, setSession] = useState<Session | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isAdminView, setIsAdminView] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const determineAdminStatus = useCallback((userEmail: string | undefined, profileAdminStatus: boolean | undefined): boolean => {
    return profileAdminStatus ?? (userEmail === 'daniele.buatti@gmail.com' || userEmail === 'resonancewithdaniele@gmail.com');
  }, []);

  const logout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error && error.name !== 'AuthSessionMissingError') {
        showError("Failed to log out: " + error.message);
      } else {
        showSuccess("Logged out successfully!");
      }
    } catch (error: any) {
      showError("An unexpected error occurred during logout.");
    } finally {
      setSession(null);
      queryClient.clear();
      navigate('/login');
      setIsLoggingOut(false);
      setIsAdminView(true);
    }
  }, [queryClient, navigate]);

  const toggleAdminView = useCallback(() => {
    setIsAdminView(prev => !prev);
    queryClient.invalidateQueries({ queryKey: ['resources'] });
    queryClient.invalidateQueries({ queryKey: ['adminDashboardCounts'] });
    showSuccess(`Switched to ${isAdminView ? 'User' : 'Admin'} View.`);
  }, [isAdminView, queryClient]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setInitialLoading(false);
      queryClient.invalidateQueries({ queryKey: ['profile', currentSession?.user?.id] });
      if (_event === 'SIGNED_OUT') queryClient.clear();
    });

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setInitialLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const { data: profile, isLoading: profileLoading } = useQuery<Profile | null, Error, Profile | null, ['profile', string | null | undefined]>({
    queryKey: ['profile', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (profileError && profileError.code !== 'PGRST116') throw profileError;
      return profileData ? { ...profileData, email: session.user.email } as Profile : {
        id: session.user.id, first_name: null, last_name: null, avatar_url: null, is_admin: determineAdminStatus(session.user.email, undefined),
        updated_at: new Date().toISOString(), how_heard: null, motivation: null, attended_session: null, singing_experience: null,
        session_frequency: null, preferred_time: null, music_genres: null, choir_goals: null, inclusivity_importance: null, suggestions: null,
        email: session.user.email, voice_type: null,
      };
    },
    enabled: !!session?.user?.id,
  });

  const actualIsAdmin = determineAdminStatus(session?.user?.email, profile?.is_admin);
  const user: CustomUser | null = session?.user ? { ...session.user, is_admin: actualIsAdmin } : null;
  const isProfileCompleted = !!(profile?.first_name && profile?.last_name);
  const isSurveyCompleted = !!(profile?.how_heard || profile?.singing_experience);
  const incompleteTasksCount = (isProfileCompleted ? 0 : 1) + (isSurveyCompleted ? 0 : 1);

  useEffect(() => {
    if (!initialLoading && !isLoggingOut) {
      const publicPaths = ['/', '/events', '/resources', '/current-event', '/login', '/learn-more', '/song-suggestions'];
      if (!user && !publicPaths.includes(location.pathname)) navigate('/login');
      else if (location.pathname.startsWith('/admin') && user && !user.is_admin) navigate('/');
    }
  }, [user, initialLoading, isLoggingOut, location.pathname, navigate]);

  return (
    <SessionContext.Provider value={{
      session, user: user ? { ...user, is_admin: user.is_admin && isAdminView } : null, profile,
      loading: initialLoading || profileLoading, profileLoading, isLoggingOut, isAdminView, isActualAdmin: actualIsAdmin,
      isProfileCompleted, isSurveyCompleted, incompleteTasksCount, toggleAdminView, logout
    }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) throw new Error('useSession must be used within a SessionContextProvider');
  return context;
};
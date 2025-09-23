"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "@/integrations/supabase/auth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import SurveyMetricsCard from "@/components/admin/SurveyMetricsCard";
import { showError } from "@/utils/toast";
import { useQuery } from "@tanstack/react-query"; // Import useQuery

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  is_admin: boolean;
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
  updated_at: string;
}

const AdminSurveyData: React.FC = () => {
  const { user, loading: loadingSession } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loadingSession && (!user || !user.is_admin)) {
      navigate("/");
      showError("Access Denied: You must be an administrator to view this page.");
    }
  }, [user, loadingSession, navigate]);

  // Query function for fetching profiles
  const fetchProfiles = async (): Promise<Profile[]> => {
    console.log("[AdminSurveyData] Fetching all profiles for survey data.");
    const { data, error } = await supabase
      .from("profiles")
      .select("*, email")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching profiles for survey data:", error);
      throw new Error("Failed to load survey data.");
    }
    console.log("[AdminSurveyData] Profiles fetched successfully:", data?.length, "profiles.");
    return data || [];
  };

  // Use react-query for profiles data
  const { data: profiles, isLoading: loadingProfiles, error: fetchError } = useQuery<
    Profile[], // TQueryFnData
    Error,          // TError
    Profile[], // TData (the type of the 'data' property)
    ['adminProfiles'] // TQueryKey
  >({
    queryKey: ['adminProfiles'],
    queryFn: fetchProfiles,
    enabled: !loadingSession && !!user?.is_admin, // Only fetch if session is not loading and user is admin
    staleTime: 5 * 60 * 1000, // Data is considered fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Data stays in cache for 10 minutes
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  if (loadingProfiles) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl p-6 shadow-lg rounded-xl">
          <CardHeader>
            <Skeleton className="h-8 w-1/2 mb-2" />
            <Skeleton className="h-5 w-3/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full mb-4" />
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user || !user.is_admin) {
    return null;
  }

  if (fetchError) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl p-6 shadow-lg rounded-xl text-center">
          <CardTitle className="text-2xl font-lora text-destructive">Error Loading Data</CardTitle>
          <CardDescription className="text-muted-foreground">{fetchError.message}</CardDescription>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-8 px-4"> {/* Added px-4 for consistent padding */}
      <h1 className="text-4xl font-bold text-center font-lora">Member Survey Data & Insights</h1>
      <p className="text-lg text-center text-muted-foreground max-w-2xl mx-auto">
        Explore aggregated survey responses to understand your community's preferences and feedback.
      </p>
      <SurveyMetricsCard profiles={profiles || []} loading={loadingProfiles} />
    </div>
  );
};

export default AdminSurveyData;
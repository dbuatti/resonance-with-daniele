"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "@/integrations/supabase/auth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import SurveyMetricsCard from "@/components/admin/SurveyMetricsCard";
import { showError } from "@/utils/toast";
import { useQuery } from "@tanstack/react-query";
import BackButton from "@/components/ui/BackButton";

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
  voice_type: string[] | null;
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

  const fetchProfiles = async (): Promise<Profile[]> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*, email")
      .order("updated_at", { ascending: false });

    if (error) throw new Error("Failed to load survey data.");
    return data || [];
  };

  const { data: profiles, isLoading: loadingProfiles, error: fetchError } = useQuery<Profile[], Error>({
    queryKey: ['adminProfiles'],
    queryFn: fetchProfiles,
    enabled: !loadingSession && !!user?.is_admin,
    staleTime: 5 * 60 * 1000,
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

  if (!user || !user.is_admin) return null;

  return (
    <div className="space-y-6 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <BackButton className="mb-6" to="/admin" />
        
        <header className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-bold text-center font-lora">Member Survey Data & Insights</h1>
          <p className="text-lg text-center text-muted-foreground max-w-2xl mx-auto">
            Explore aggregated survey responses to understand your community's preferences and feedback.
          </p>
        </header>
        
        <SurveyMetricsCard profiles={profiles || []} loading={loadingProfiles} />
      </div>
    </div>
  );
};

export default AdminSurveyData;
"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "@/integrations/supabase/auth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import SurveyMetricsCard from "@/components/admin/SurveyMetricsCard";
import { showError } from "@/utils/toast";

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
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  useEffect(() => {
    if (!loadingSession && (!user || !user.is_admin)) {
      navigate("/");
      showError("Access Denied: You must be an administrator to view this page.");
    }
  }, [user, loadingSession, navigate]);

  const fetchProfiles = async () => {
    if (user && user.is_admin) {
      setLoadingProfiles(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*, email")
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error fetching profiles for survey data:", error);
        showError("Failed to load survey data.");
      } else {
        setProfiles(data as Profile[]);
      }
      setLoadingProfiles(false);
    }
  };

  useEffect(() => {
    if (!loadingSession && user?.is_admin) {
      fetchProfiles();
    }
  }, [user, loadingSession]);

  if (loadingSession || loadingProfiles) {
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

  return (
    <div className="space-y-6 py-8 animate-fade-in-up">
      <h1 className="text-4xl font-bold text-center font-lora">Member Survey Data & Insights</h1>
      <p className="text-lg text-center text-muted-foreground max-w-2xl mx-auto">
        Explore aggregated survey responses to understand your community's preferences and feedback.
      </p>
      <SurveyMetricsCard profiles={profiles} />
    </div>
  );
};

export default AdminSurveyData;
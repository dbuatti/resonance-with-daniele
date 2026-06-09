"use client";

import React from "react";
import { useSession } from "@/integrations/supabase/auth";
import { supabase } from "@/integrations/supabase/client";
import SurveyMetricsCard from "@/components/admin/SurveyMetricsCard";
import { useQuery } from "@tanstack/react-query";
import AdminPageLayout from "@/components/admin/AdminPageLayout";

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
  const { user } = useSession();

  const { data: profiles, isLoading } = useQuery<Profile[]>({
    queryKey: ['adminSurveyProfiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.is_admin,
  });

  return (
    <AdminPageLayout
      title="Survey Insights"
      description="Analyze aggregated feedback and understand community preferences."
      badge="Analytics"
      backTo="/admin"
      isLoading={isLoading}
      empty={profiles?.length === 0}
      emptyMessage="No survey data available yet."
    >
      <SurveyMetricsCard profiles={profiles || []} />
    </AdminPageLayout>
  );
};

export default AdminSurveyData;

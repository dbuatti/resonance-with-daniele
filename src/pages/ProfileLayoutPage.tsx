"use client";

import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import ProfileNavigation from "@/components/profile/ProfileNavigation";
import { useSession } from "@/integrations/supabase/auth";
import { usePageLoading } from "@/contexts/PageLoadingContext"; // Import usePageLoading

const ProfileLayoutPage: React.FC = () => {
  const location = useLocation();
  const { loading: loadingUserSession } = useSession();
  const { setPageLoading } = usePageLoading(); // Consume setPageLoading

  useEffect(() => {
    console.log("[ProfileLayoutPage] useEffect: Session loading:", loadingUserSession);
    // This layout page itself doesn't fetch data, its children do.
    // We can set pageLoading to false once session is resolved,
    // and children will manage their own loading.
    if (!loadingUserSession) {
      setPageLoading(false);
      console.log("[ProfileLayoutPage] Page loading set to false (session resolved).");
    } else {
      setPageLoading(true); // Keep page loading true while session is loading
      console.log("[ProfileLayoutPage] Page loading set to true (session loading).");
    }
  }, [loadingUserSession, setPageLoading]);

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 space-y-8">
      <h1 className="text-4xl font-bold text-center font-lora">My Account</h1>
      <p className="text-lg text-center text-muted-foreground max-w-2xl mx-auto">
        Manage your personal details and survey responses.
      </p>
      <div className="max-w-2xl mx-auto">
        <ProfileNavigation currentPath={location.pathname} />
      </div>
      <Outlet /> {/* This will render ProfileDetails or SurveyPage */}
    </div>
  );
};

export default ProfileLayoutPage;
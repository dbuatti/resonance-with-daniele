"use client";

import React, { useEffect } from "react";
import HeroSection from "@/components/landing/HeroSection";
import VideoSection from "@/components/landing/VideoSection";
import AboutChoirSection from "@/components/landing/AboutChoirSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import FeaturedSection from "@/components/landing/FeaturedSection";
import ResourcesBenefitsSection from "@/components/landing/ResourcesBenefitsSection";
import MeetDanieleSection from "@/components/landing/MeetDanieleSection";
import CallToActionSection from "@/components/landing/CallToActionSection";
import FooterSection from "@/components/landing/FooterSection";
import WelcomeHub from "@/components/dashboard/WelcomeHub";
import { useSession } from "@/integrations/supabase/auth";
import { usePageLoading } from "@/contexts/PageLoadingContext"; // Import usePageLoading

const Index: React.FC = () => {
  const { user, loading: loadingSession } = useSession();
  const { setPageLoading } = usePageLoading(); // Consume setPageLoading

  useEffect(() => {
    console.log("[Index Page] useEffect: Session loading:", loadingSession);
    // If session is still loading, the page is also loading.
    if (loadingSession) {
      setPageLoading(true);
      console.log("[Index Page] Page loading set to true (session loading).");
      return; // Exit early, let session resolve first
    }

    // Once session is NOT loading:
    if (!user) {
      // If no user, we're showing the static landing page.
      // This page doesn't have further data fetches, so it's "loaded".
      setPageLoading(false);
      console.log("[Index Page] Page loading set to false (no user, static landing).");
    }
    // If there is a user, WelcomeHub will be rendered.
    // WelcomeHub itself will manage setPageLoading(true/false) based on its data fetches.
    // So, Index.tsx should NOT set setPageLoading(false) here if user exists,
    // to avoid a flicker before WelcomeHub sets it to true.
  }, [loadingSession, user, setPageLoading]);

  // If the session is still loading, render nothing. The Layout component will show a global skeleton.
  if (loadingSession) {
    return null;
  }

  // Once loading is complete, render content based on user authentication status.
  return (
    <>
      {user ? (
        <>
          {console.log("[Index Page] User is logged in, rendering WelcomeHub.")}
          <WelcomeHub />
        </>
      ) : (
        <>
          {console.log("[Index Page] User is NOT logged in, rendering landing sections.")}
          <HeroSection />
          <VideoSection />
          <AboutChoirSection />
          <HowItWorksSection />
          <FeaturedSection />
          <ResourcesBenefitsSection />
          <MeetDanieleSection />
          <CallToActionSection />
          <FooterSection />
        </>
      )}
    </>
  );
};

export default Index;
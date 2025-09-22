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
    // Index page itself doesn't fetch data, its children do.
    // We can set pageLoading to false once session is resolved,
    // and children will manage their own loading.
    if (!loadingSession) {
      setPageLoading(false);
      console.log("[Index Page] Page loading set to false (session resolved).");
    } else {
      setPageLoading(true); // Keep page loading true while session is loading
      console.log("[Index Page] Page loading set to true (session loading).");
    }
  }, [loadingSession, setPageLoading]);

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
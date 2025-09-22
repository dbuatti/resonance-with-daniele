"use client";

import React from "react";
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
// No need for useDelayedLoading here, as Layout handles the global session loading.

const Index: React.FC = () => {
  const { user, loading } = useSession();
  console.log("[Index Page] User:", user ? user.id : 'null', "Loading:", loading);

  // The Layout component already handles the global loading state with a skeleton.
  // We can directly render the content here, and WelcomeHub will manage its own internal delayed loading.
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
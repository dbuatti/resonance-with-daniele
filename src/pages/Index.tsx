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
import InterestFormSection from "@/components/landing/InterestFormSection";
import WelcomeHub from "@/components/dashboard/WelcomeHub";
import { useSession } from "@/integrations/supabase/auth";

const Index: React.FC = () => {
  const { user, loading } = useSession();
  console.log("[Index Page] User:", user ? user.id : 'null', "Loading:", loading);

  if (loading) {
    return null;
  }

  return (
    <div className="container mx-auto"> {/* Added container mx-auto here */}
      {user ? (
        <>
          {console.log("[Index Page] User is logged in, rendering WelcomeHub.")}
          <WelcomeHub />
        </>
      ) : (
        <>
          {console.log("[Index Page] User is NOT logged in, rendering landing sections.")}
          <HeroSection />
          <InterestFormSection />
          <VideoSection />
          <AboutChoirSection />
          <HowItWorksSection />
          <FeaturedSection />
          <ResourcesBenefitsSection />
          <MeetDanieleSection />
          <CallToActionSection />
        </>
      )}
    </div>
  );
};

export default Index;
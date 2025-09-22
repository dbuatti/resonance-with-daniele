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

const Index: React.FC = () => {
  const { user, loading } = useSession();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <> {/* Removed Layout wrapper */}
      {user ? (
        <WelcomeHub />
      ) : (
        <>
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
"use client";

import React from "react";
import Layout from "@/components/Layout";
import HeroSection from "@/components/landing/HeroSection";
import AboutChoirSection from "@/components/landing/AboutChoirSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import FeaturedSection from "@/components/landing/FeaturedSection";
import ResourcesBenefitsSection from "@/components/landing/ResourcesBenefitsSection";
import MeetDanieleSection from "@/components/landing/MeetDanieleSection";
import CallToActionSection from "@/components/landing/CallToActionSection";
import FooterSection from "@/components/landing/FooterSection";
import WelcomeHub from "@/components/dashboard/WelcomeHub"; // Import the new WelcomeHub
import { useSession } from "@/integrations/supabase/auth"; // Import useSession

const Index: React.FC = () => {
  const { user, loading } = useSession();

  if (loading) {
    // Optionally render a loading spinner or skeleton while session is being checked
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {user ? (
        <WelcomeHub />
      ) : (
        <>
          <HeroSection />
          <AboutChoirSection />
          <HowItWorksSection />
          <FeaturedSection />
          <ResourcesBenefitsSection />
          <MeetDanieleSection />
          <CallToActionSection />
          <FooterSection />
        </>
      )}
    </Layout>
  );
};

export default Index;
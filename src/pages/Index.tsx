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
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import CommunityGallery from "@/components/landing/CommunityGallery";
import WelcomeHub from "@/components/dashboard/WelcomeHub";
import { useSession } from "@/integrations/supabase/auth";
import { Skeleton } from "@/components/ui/skeleton";

const Index: React.FC = () => {
  const { user, loading } = useSession();

  if (loading && !user) {
    return (
      <div className="container mx-auto px-4 py-24 md:py-40 text-center">
        <Skeleton className="h-16 w-3/4 mx-auto mb-4" />
        <Skeleton className="h-8 w-1/2 mx-auto" />
        <div className="flex justify-center gap-4 mt-8">
          <Skeleton className="h-12 w-32" />
          <Skeleton className="h-12 w-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      {user ? (
        <div className="container mx-auto px-4">
          <WelcomeHub />
        </div>
      ) : (
        <>
          <HeroSection />
          <InterestFormSection />
          <VideoSection />
          <CommunityGallery />
          <AboutChoirSection />
          <HowItWorksSection />
          <FeaturedSection />
          <TestimonialsSection />
          <ResourcesBenefitsSection />
          <MeetDanieleSection />
          <CallToActionSection />
        </>
      )}
    </div>
  );
};

export default Index;
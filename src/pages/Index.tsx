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
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton for loading state

const Index: React.FC = () => {
  const { user, loading } = useSession();
  console.log("[Index Page] User:", user ? user.id : 'null', "Loading:", loading);

  // Only show skeleton if there's no user data AND it's currently loading for the first time
  // If 'user' is present, it means we have at least stale data, so render the content.
  const showSkeleton = loading && !user;

  if (showSkeleton) {
    console.log("[Index Page] Showing skeleton: loading is true and no user data.");
    return (
      <div className="py-24 md:py-40 text-center"> {/* Keep vertical padding for skeleton */}
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
    </>
  );
};

export default Index;
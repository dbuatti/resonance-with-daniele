"use client";

import React from "react";
import HeroSection from "@/components/landing/HeroSection";
import FeaturedSection from "@/components/landing/FeaturedSection";
import MeetDanieleSection from "@/components/landing/MeetDanieleSection";
import CallToActionSection from "@/components/landing/CallToActionSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import CommunityGallery from "@/components/landing/CommunityGallery";
import Footer from "@/components/Footer";
import WelcomeHub from "@/components/dashboard/WelcomeHub";
import { useSession } from "@/integrations/supabase/auth";
import { Skeleton } from "@/components/ui/skeleton";
const Index: React.FC = () => {
  const { user, loading } = useSession();

  if (loading && !user) {
    return (
      <div className="w-full px-4 py-24 md:py-40 text-center">
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
        <div className="w-full px-4">
          <WelcomeHub />
        </div>
      ) : (
        <>
          <HeroSection />
          <FeaturedSection />
          <section className="py-16 md:py-20">
            <div className="mx-auto max-w-6xl px-4 md:px-6">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-3">
                  The experience
                </p>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-lora leading-[1.05] mb-4">
                  Learn harmony, sing together
                </h2>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-6">
                  A piano-led pop-up choir in Armadale. Learn harmony parts through piano-led teaching, sing with a welcoming group, and enjoy making music together without pressure to be perfect.
                </p>
                <ul className="space-y-2 text-base md:text-lg text-foreground/90">
                  <li className="flex items-start gap-2">• Piano-led teaching of harmony parts</li>
                  <li className="flex items-start gap-2">• Welcoming group, no auditions or prior experience required</li>
                  <li className="flex items-start gap-2">• Make music together without pressure to be perfect</li>
                </ul>
              </div>
            </div>
          </section>
          <CommunityGallery />
          <TestimonialsSection />
          <MeetDanieleSection />
          <CallToActionSection />
          <Footer />
        </>
      )}
    </div>
  );
};

export default Index;
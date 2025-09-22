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

const Index: React.FC = () => {
  return (
    <Layout>
      <HeroSection />
      <AboutChoirSection />
      <HowItWorksSection />
      <FeaturedSection />
      <ResourcesBenefitsSection />
      <MeetDanieleSection />
      <CallToActionSection />
      {/* The Layout component already includes MadeWithDyad, so we'll use a separate FooterSection here */}
      <FooterSection />
    </Layout>
  );
};

export default Index;
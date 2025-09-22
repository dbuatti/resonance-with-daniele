"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HeroSection: React.FC = () => {
  return (
    <section className="relative bg-gradient-to-br from-hero-gradient-start to-hero-gradient-end dark:from-gray-900 dark:to-gray-800 py-24 md:py-40 text-center overflow-hidden rounded-xl shadow-lg">
      <div className="container mx-auto px-4 relative z-10">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 font-lora text-foreground">
          Sing. Connect. Shine. <br className="hidden sm:inline" /> Join Melbourne’s Pop-Up Choir with Daniele.
        </h1>
        <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto text-foreground">
          A joyful, welcoming space I've created for anyone who loves to sing — no experience needed.
        </p>
        <div className="flex justify-center gap-4">
          <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 border border-muted-foreground/30" asChild>
            <Link to="/login">Sign Up Now</Link>
          </Button>
        </div>
      </div>
      {/* Optional: Add background visuals here */}
      <div className="absolute inset-0 opacity-10">
        {/* Placeholder for background image or pattern */}
      </div>
    </section>
  );
};

export default HeroSection;
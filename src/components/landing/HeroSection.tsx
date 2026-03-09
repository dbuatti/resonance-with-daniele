"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HeroSection: React.FC = () => {
  return (
    <section className="relative bg-gradient-to-br from-hero-gradient-start to-hero-gradient-end dark:from-hero-gradient-start-dark dark:to-hero-gradient-end-dark py-24 md:py-48 text-center overflow-hidden border-b border-border/50">
      <div className="container mx-auto px-4 relative z-10">
        <h1 className="text-5xl md:text-8xl font-extrabold tracking-tight mb-6 font-lora text-foreground leading-[1.1]">
          Sing. Connect. <span className="text-primary">Shine.</span>
        </h1>
        <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto text-muted-foreground leading-relaxed">
          Join Melbourne’s most joyful pop-up choir. From Musical Theatre to Jazz and Pop—find your voice in a space built for pure connection.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button size="lg" className="h-14 px-8 text-lg font-bold rounded-xl shadow-xl shadow-primary/20" asChild>
            <Link to="/login">Access Member Resources</Link>
          </Button>
          <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold rounded-xl bg-background/50 backdrop-blur-sm" asChild>
            <Link to="/learn-more">Learn More About the Choir</Link>
          </Button>
        </div>
      </div>
      
      {/* Decorative elements to fill space */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 right-0 -translate-x-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
    </section>
  );
};

export default HeroSection;
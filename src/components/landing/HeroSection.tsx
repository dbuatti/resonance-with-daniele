"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HeroSection: React.FC = () => {
  return (
    <section className="relative bg-gradient-to-r from-primary to-accent text-primary-foreground py-20 md:py-32 text-center overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 animate-fade-in-up font-lora">
          Sing. Connect. Shine. Join Melbourne’s Pop-Up Choir.
        </h1>
        <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          A joyful, welcoming space for anyone who loves to sing — no experience needed.
        </p>
        <div className="flex justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90" asChild>
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
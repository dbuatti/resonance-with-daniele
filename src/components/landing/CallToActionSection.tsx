"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CallToActionSection: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-primary text-primary-foreground text-center">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-5xl font-bold mb-6 font-lora animate-fade-in-up">
          Ready to find your voice?
        </h2>
        <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          Join my choir today — no experience needed!
        </p>
        <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 animate-fade-in-up" style={{ animationDelay: '0.4s' }} asChild>
          <Link to="/login">Sign Up Now</Link>
        </Button>
      </div>
    </section>
  );
};

export default CallToActionSection;
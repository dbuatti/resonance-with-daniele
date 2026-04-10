"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CallToActionSection: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-primary text-primary-foreground text-center">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-4xl md:text-6xl font-black font-lora tracking-tight mb-6">
          Ready to find your voice?
        </h2>
        <p className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto font-medium opacity-90">
          Join my choir today — no experience needed!
        </p>
        <Button size="lg" className="h-16 px-10 text-xl font-black rounded-2xl bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-2xl" asChild>
          <Link to="/login">Sign Up Now</Link>
        </Button>
      </div>
    </section>
  );
};

export default CallToActionSection;
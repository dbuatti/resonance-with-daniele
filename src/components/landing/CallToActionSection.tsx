"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CallToActionSection: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-primary text-primary-foreground text-center">
      <div className="px-4"> {/* Removed container mx-auto */}
        <h2 className="text-3xl md:text-5xl font-bold mb-6 font-lora">
          Ready to find your voice?
        </h2>
        <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
          Join my choir today — no experience needed!
        </p>
        <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90" asChild>
          <Link to="/login">Sign Up Now</Link>
        </Button>
      </div>
    </section>
  );
};

export default CallToActionSection;
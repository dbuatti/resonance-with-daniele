"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CallToActionSection: React.FC = () => {
  return (
    <section className="py-16 md:py-28 relative overflow-hidden text-center">
      <div className="absolute inset-0 bg-gradient-to-br from-[#D69FB0] via-[#F6CFCB]/70 to-[#B0BCD3]/50" />
      <div className="absolute inset-0 texture-bg opacity-10" />
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <h2 className="text-4xl md:text-6xl font-black font-lora tracking-tight mb-6 text-[#2f1f17]">
          Ready to find your voice?
        </h2>
        <p className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto font-medium text-[#2f1f17]/80">
          Join my choir today — no experience needed!
        </p>
        <Button size="lg" className="h-16 px-10 text-xl font-black rounded-2xl bg-[#2f1f17] text-white hover:bg-[#2f1f17]/90 shadow-2xl" asChild>
          <a href="/next">Book Your Spot</a>
        </Button>
      </div>
    </section>
  );
};

export default CallToActionSection;
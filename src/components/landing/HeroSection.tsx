"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Music, MapPin, LogIn } from "lucide-react";

const HeroSection: React.FC = () => {
  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center scale-x-[-1]"
        style={{ backgroundImage: "url('/hero-bg.jpeg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#2f1f17]/90 via-[#2f1f17]/70 to-[#2f1f17]/40" />
      <div className="relative mx-auto max-w-6xl px-4 md:px-6 py-28 md:py-36 lg:py-44 xl:py-52">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm md:text-base font-semibold tracking-[0.2em] uppercase text-[#F6CFCB]/90">
            Melbourne's Monthly Pop-Up Choir
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold font-playfair leading-[1.02] text-white mb-4">
            Come and sing <span className="text-[#F6CFCB]">with us</span>
          </h1>
          <p className="text-lg md:text-xl text-white/90 leading-relaxed mb-4 max-w-2xl">
            A welcoming, piano-led pop-up choir in Armadale. No auditions, no experience needed.
          </p>
          <p className="text-base md:text-lg text-white/85 leading-relaxed mb-6 max-w-2xl">
            Learn harmony parts together and make music without pressure to be perfect.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
            <Button size="lg" className="h-12 md:h-14 px-6 md:px-8 text-base md:text-lg font-bold rounded-lg bg-[#D69FB0] text-[#2f1f17] hover:bg-[#D69FB0]/90 group" asChild>
              <a href="/next">
                Book your spot <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="h-12 md:h-14 px-6 md:px-8 text-base md:text-lg font-semibold rounded-lg bg-white/10 backdrop-blur-sm border-white/40 text-white hover:bg-white/15" asChild>
              <Link to="/learn-more">Learn more</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Music, MapPin, LogIn } from "lucide-react";

const HeroSection: React.FC = () => {
  return (
    <section className="relative bg-gradient-to-br from-hero-gradient-start to-hero-gradient-end dark:from-hero-gradient-start-dark dark:to-hero-gradient-end-dark py-16 md:py-32 text-center overflow-hidden border-b border-border/50">
      <div className="container mx-auto px-4 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-8 animate-fade-in-up">
          <Music className="h-4 w-4" />
          <span>Melbourne's Monthly Pop-Up Choir</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 font-lora text-foreground leading-[1.1] animate-fade-in-up [animation-delay:200ms]">
          Come and sing <br />
          <span className="text-primary">with us.</span>
        </h1>
        
        <p className="text-lg md:text-xl mb-10 max-w-3xl mx-auto text-muted-foreground leading-relaxed animate-fade-in-up [animation-delay:400ms]">
          I run a joyful pop-up choir in Armadale. You don't need to audition or have any experience—just come along and sing great songs in harmony with a friendly group.
        </p>

        <div className="flex items-center justify-center gap-2 text-primary font-bold mb-10 animate-fade-in-up [animation-delay:600ms]">
          <MapPin className="h-5 w-5" />
          <span>Armadale, VIC 3143</span>
        </div>
        
        <div className="flex flex-col items-center gap-4 animate-fade-in-up [animation-delay:800ms]">
          <div className="flex flex-col sm:flex-row justify-center gap-4 w-full max-w-md mx-auto">
            <Button size="lg" className="h-14 px-8 text-lg font-bold rounded-xl shadow-xl shadow-primary/20 group flex-1" asChild>
              <Link to="/current-event">
                Book Your Spot <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold rounded-xl bg-background/50 backdrop-blur-sm flex-1" asChild>
              <Link to="/learn-more">How it works</Link>
            </Button>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm font-bold text-muted-foreground/80 uppercase tracking-widest">
              Tickets are $30 via Humanitix
            </p>
            
            <Link 
              to="/login" 
              className="text-primary font-bold hover:underline flex items-center justify-center gap-2 transition-all hover:gap-3"
            >
              <LogIn className="h-5 w-5" />
              Already a member? Log in here
            </Link>
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 right-0 -translate-x-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
    </section>
  );
};

export default HeroSection;
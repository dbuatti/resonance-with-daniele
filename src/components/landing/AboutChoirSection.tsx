"use client";

import React from "react";
import { Users, Heart, Sparkles, Music } from "lucide-react";

const AboutChoirSection: React.FC = () => {
  return (
    <section className="py-24 md:py-32 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2 space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold font-lora leading-tight">
                A space where every <br /> voice belongs.
              </h2>
              <div className="w-20 h-1.5 bg-primary rounded-full" />
            </div>
            
            <p className="text-xl text-muted-foreground leading-relaxed">
              Led by Daniele Buatti, this choir is about the magic that happens when voices join together. Whether you're a total beginner or a seasoned singer, there's a place for you here.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <Heart className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">Joyful Experience</h4>
                  <p className="text-sm text-muted-foreground">Singing should feel good. We focus on the fun.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">Real Community</h4>
                  <p className="text-sm text-muted-foreground">Connect with people who love music as much as you.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">No Pressure</h4>
                  <p className="text-sm text-muted-foreground">No auditions. No stress. Just great harmonies.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <Music className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">Vocal Growth</h4>
                  <p className="text-sm text-muted-foreground">Learn technique while singing the songs you love.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:w-1/2 relative">
            <div className="absolute -inset-4 bg-primary/5 rounded-3xl -rotate-2" />
            <img
              src="/images/daniele-conduct.jpeg"
              alt="Daniele Buatti conducting the choir"
              className="relative w-full rounded-2xl shadow-2xl object-cover aspect-[4/3]"
            />
            <div className="absolute -bottom-6 -left-6 bg-accent p-6 rounded-2xl shadow-xl hidden md:block">
              <p className="text-accent-foreground font-black text-2xl font-lora">"Incredible sound."</p>
              <p className="text-accent-foreground/80 text-sm font-bold uppercase tracking-widest mt-1">— Past Participant</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutChoirSection;
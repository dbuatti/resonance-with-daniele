"use client";

import React from "react";
import { Users, Heart, Sparkles, Music, MapPin } from "lucide-react";

const AboutChoirSection: React.FC = () => {
  return (
    <section className="py-16 md:py-20 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2 space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold font-lora leading-tight">
                A simple place to <br /> sing together.
              </h2>
              <div className="w-20 h-1.5 bg-primary rounded-full" />
            </div>
            
            <p className="text-xl text-muted-foreground leading-relaxed">
              I'm Daniele, and I lead this choir in Armadale. It's a space for anyone who loves music to get together and sing. Whether you're a total beginner or you've been singing for years, you're welcome to join the circle.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">Local Group</h4>
                  <p className="text-sm text-muted-foreground">We meet at Armadale Baptist Church, near Malvern and Toorak.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">Meet People</h4>
                  <p className="text-sm text-muted-foreground">It's a great way to connect with others who enjoy singing.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">No Pressure</h4>
                  <p className="text-sm text-muted-foreground">There are no auditions. We just focus on the joy of the music.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <Music className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">Learn Harmonies</h4>
                  <p className="text-sm text-muted-foreground">I'll help you learn your part and improve your voice as we go.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:w-1/2 relative">
            <div className="absolute -inset-4 bg-primary/5 rounded-3xl -rotate-2" />
            <img
              src="/images/choir-session-1.jpg"
              alt="Daniele Buatti conducting the choir in Melbourne"
              className="relative w-full rounded-2xl shadow-2xl object-cover aspect-[4/3]"
            />
            <div className="absolute -bottom-6 -left-6 bg-accent p-6 rounded-2xl shadow-xl hidden md:block">
              <p className="text-accent-foreground font-black text-2xl font-lora">"Achieving the resonance 🥰"</p>
              <p className="text-accent-foreground/80 text-sm font-bold uppercase tracking-widest mt-1">— Past Participant</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutChoirSection;
"use client";

import React, { useEffect } from "react";
import { ExternalLink, CalendarDays, MapPin, Clock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const CurrentEventPage: React.FC = () => {
  const eventSlug = "resonance-melbourne-s-pop-up-choir-april-2026";
  const humanitixUrl = `https://events.humanitix.com/${eventSlug}`;
  const embedUrl = `https://events.humanitix.com/${eventSlug}?widget=checkout`;

  useEffect(() => {
    if (typeof window !== 'undefined' && !document.querySelector('script[src*="humanitix.com/scripts/widgets/inline.js"]')) {
      const script = document.createElement('script');
      script.src = "https://events.humanitix.com/scripts/widgets/inline.js";
      script.type = "module";
      document.body.appendChild(script);
      console.log("[CurrentEventPage] Injected Humanitix inline script.");
    }
  }, []);

  return (
    <div className="py-12 md:py-20 space-y-16 max-w-6xl mx-auto px-4">
      {/* Event Header Section */}
      <header className="text-center space-y-8">
        <div className="space-y-4">
          <Badge className="bg-primary text-primary-foreground px-4 py-1 rounded-full font-black uppercase tracking-widest text-[10px]">
            Next Session
          </Badge>
          <h1 className="text-5xl md:text-8xl font-black font-lora tracking-tighter leading-none">
            Resonance: April 2026
          </h1>
        </div>

        <div className="flex flex-wrap justify-center gap-6 md:gap-12">
          <div className="flex items-center gap-3 text-lg font-bold text-primary">
            <CalendarDays className="h-6 w-6" />
            <span>Saturday, April 18th</span>
          </div>
          <div className="flex items-center gap-3 text-lg font-bold text-primary">
            <Clock className="h-6 w-6" />
            <span>10:00 am – 1:00 pm</span>
          </div>
          <div className="flex items-center gap-3 text-lg font-bold text-primary">
            <MapPin className="h-6 w-6" />
            <span>Armadale Baptist Church</span>
          </div>
        </div>

        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium">
          Join us for a morning of harmony and connection. We'll be learning a beautiful new arrangement together in the heart of Armadale.
        </p>
      </header>

      {/* Booking Widget Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-[4rem] -z-10" />
        
        <div className="w-full rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white dark:border-gray-900 min-h-[80vh] bg-muted/20">
          <iframe
            src={embedUrl}
            data-checkout={eventSlug}
            title="Resonance April 2026 Event"
            className="w-full h-full border-0"
            allowFullScreen
            allow="payment"
          ></iframe>
        </div>
      </div>
      
      {/* Footer Info Section */}
      <div className="flex flex-col items-center gap-8 pt-8 border-t border-border/50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          <div className="space-y-4">
            <h3 className="text-2xl font-black font-lora flex items-center gap-2">
              <Info className="h-6 w-6 text-primary" /> Good to know
            </h3>
            <ul className="space-y-2 text-muted-foreground font-medium">
              <li>• No auditions or experience needed</li>
              <li>• Sheet music and practice tracks provided</li>
              <li>• Tea and coffee included in the break</li>
              <li>• All voices and levels are welcome</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl font-black font-lora flex items-center gap-2">
              <MapPin className="h-6 w-6 text-primary" /> Location
            </h3>
            <p className="text-muted-foreground font-medium">
              Armadale Baptist Church<br />
              88 Kooyong Rd, Armadale VIC 3143<br />
              <span className="text-sm opacity-70">Easy street parking and close to public transport.</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <Button asChild size="lg" className="h-16 px-10 text-xl font-black rounded-2xl shadow-2xl shadow-primary/20 hover:scale-105 transition-transform">
            <a href={humanitixUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-3 h-6 w-6" /> Open Booking in New Tab
            </a>
          </Button>
          <p className="text-sm font-medium text-muted-foreground text-center max-w-md">
            If the booking widget doesn't load, please click the button above to book directly on Humanitix.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CurrentEventPage;
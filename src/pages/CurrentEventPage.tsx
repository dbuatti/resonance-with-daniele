"use client";

import React, { useEffect } from "react";
import { ExternalLink, CalendarDays, MapPin } from "lucide-react";
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
    <div className="py-12 md:py-20 space-y-12 max-w-6xl mx-auto px-4">
      <header className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest mx-auto">
          <CalendarDays className="h-4 w-4" />
          <span>Saturday, April 18th 2026</span>
        </div>
        <h1 className="text-5xl md:text-8xl font-black font-lora tracking-tighter leading-none">Join the Circle</h1>
        <p className="text-xl md:text-2xl font-medium text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Secure your spot for our April session at <span className="text-foreground font-bold">Armadale Baptist Church</span>.
        </p>
      </header>

      <div className="relative">
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-[4rem] -z-10" />
        
        <div className="w-full rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white dark:border-gray-900 min-h-[75vh] bg-muted/20">
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
      
      <div className="flex flex-col items-center gap-6 pt-8">
        <Button asChild size="lg" className="h-16 px-10 text-xl font-black rounded-2xl shadow-2xl shadow-primary/20 hover:scale-105 transition-transform">
          <a href={humanitixUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-3 h-6 w-6" /> Open in New Tab
          </a>
        </Button>
        <p className="text-sm font-medium text-muted-foreground text-center max-w-md leading-relaxed">
          If the booking widget doesn't load, please click the button above to book directly on Humanitix.
        </p>
      </div>
    </div>
  );
};

export default CurrentEventPage;
"use client";

import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ExternalLink, CalendarDays, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const CurrentEventPage: React.FC = () => {
  const eventSlug = "resonance-melbourne-s-pop-up-choir-april-2026";
  const humanitixUrl = `https://events.humanitix.com/${eventSlug}`;
  // Using the absolute widget URL to prevent relative path 404 errors
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
    <div className="py-8 md:py-12 space-y-6 max-w-5xl mx-auto px-4">
      <Card className="p-4 sm:p-6 md:p-8 shadow-2xl rounded-[2.5rem] border-4 border-primary/10 overflow-hidden">
        <CardHeader className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest mx-auto">
            <CalendarDays className="h-3 w-3" />
            <span>Saturday, April 18th 2026</span>
          </div>
          <CardTitle className="text-4xl md:text-6xl font-black font-lora tracking-tight">Join the Circle</CardTitle>
          <CardDescription className="text-lg font-medium text-muted-foreground max-w-2xl mx-auto">
            Secure your spot for our April session at <span className="text-foreground font-bold">Armadale Baptist Church</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="w-full mx-auto rounded-[2rem] overflow-hidden shadow-2xl border-2 border-border min-h-[70vh] bg-muted/20">
            <iframe
              src={embedUrl}
              data-checkout={eventSlug}
              title="Resonance April 2026 Event"
              className="w-full h-full border-0"
              allowFullScreen
              allow="payment"
            ></iframe>
          </div>
          
          <div className="flex flex-col items-center gap-4">
            <Button asChild size="lg" className="h-14 px-8 rounded-xl font-bold shadow-xl">
              <a href={humanitixUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" /> Open in New Tab
              </a>
            </Button>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              If the booking widget doesn't load, please click the button above to book directly on Humanitix.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CurrentEventPage;
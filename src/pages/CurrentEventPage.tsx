"use client";

import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ExternalLink, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

// The Humanitix embed script is loaded via index.html or dynamically.
// We use the iframe structure provided by Humanitix for the embed.

const CurrentEventPage: React.FC = () => {
  const humanitixUrl = "https://events.humanitix.com/resonance-choir";

  // Inject the Humanitix inline script dynamically if it hasn't been loaded yet.
  // This ensures the iframe is correctly initialized.
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
    <div className="py-8 md:py-12 space-y-6">
      <Card className="p-4 sm:p-6 md:p-8 shadow-lg rounded-xl border-2 border-primary">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold font-lora">COMING UP!</CardTitle>
          <CardDescription className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join us for our next exciting pop-up choir event!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Removed fixed height constraints (min-h-[70vh] max-h-[80vh]) and added aspect-video for better responsiveness */}
          <div className="relative w-full mx-auto rounded-lg overflow-hidden shadow-xl border border-border aspect-video md:aspect-[16/10] lg:aspect-[16/9]">
            {/* Humanitix Inline Embed Iframe */}
            <iframe
              data-checkout="resonance-choir"
              title="Resonance with Daniele Choir Event"
              className="absolute top-0 left-0 w-full h-full border-0"
              allowFullScreen
              allow="payment"
            ></iframe>
          </div>
          <div className="text-center">
            <Button asChild size="lg">
              <a href={humanitixUrl} target="_blank" rel="noopener noreferrer">
                <span>
                  <ExternalLink className="mr-2 h-4 w-4" /> View Event Details
                </span>
              </a>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            If the embedded content is not loading, please click the button above to view the event directly on Humanitix.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CurrentEventPage;
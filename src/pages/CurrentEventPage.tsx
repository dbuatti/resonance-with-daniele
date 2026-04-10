"use client";

import React, { useEffect, useMemo } from "react";
import { ExternalLink, CalendarDays, MapPin, Clock, Info, Loader2, Calendar, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import BackButton from "@/components/ui/BackButton";

const CurrentEventPage: React.FC = () => {
  // Fetch the most recent upcoming event from the database
  const { data: event, isLoading } = useQuery({
    queryKey: ['currentUpcomingEvent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .gte("date", new Date().toISOString().split('T')[0])
        .order("date", { ascending: true })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    }
  });

  // Extract the slug from the Humanitix link
  const eventSlug = useMemo(() => {
    if (!event?.humanitix_link) return null;
    try {
      const urlStr = event.humanitix_link.trim();
      if (!urlStr.startsWith('http')) return urlStr;
      
      const url = new URL(urlStr);
      // Get the first part of the path which is the slug
      const parts = url.pathname.split('/').filter(Boolean);
      return parts[0];
    } catch (e) {
      return null;
    }
  }, [event]);

  // Construct the direct widget URL
  const widgetUrl = useMemo(() => {
    if (!eventSlug) return null;
    // Using the root slug with the widget param is the most reliable method
    return `https://events.humanitix.com/${eventSlug}?widget=checkout`;
  }, [eventSlug]);

  const humanitixUrl = event?.humanitix_link || "#";

  useEffect(() => {
    // Inject the Humanitix widget script
    if (typeof window !== 'undefined' && !document.querySelector('script[src*="humanitix.com/scripts/widgets/inline.js"]')) {
      const script = document.createElement('script');
      script.src = "https://events.humanitix.com/scripts/widgets/inline.js";
      script.type = "module";
      document.body.appendChild(script);
      console.log("[CurrentEventPage] Injected Humanitix inline script.");
    }
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
        <p className="text-muted-foreground font-medium">Finding the next session...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="py-20 text-center max-w-2xl mx-auto px-4">
        <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-6 opacity-20" />
        <h1 className="text-4xl font-black font-lora mb-4">No upcoming sessions yet</h1>
        <p className="text-xl text-muted-foreground mb-8">Check back soon for new dates in Armadale!</p>
        <Button asChild size="lg" className="rounded-xl font-bold">
          <a href="/">Return to Home</a>
        </Button>
      </div>
    );
  }

  const eventDate = parseISO(event.date);

  return (
    <div className="py-12 md:py-20 space-y-16 max-w-6xl mx-auto px-4">
      <div className="flex justify-between items-center mb-4">
        <BackButton to="/" />
        <Button variant="ghost" size="sm" onClick={handleRefresh} className="text-muted-foreground">
          <RefreshCw className="h-4 w-4 mr-2" /> Reload Widget
        </Button>
      </div>
      
      {/* Event Header Section */}
      <header className="text-center space-y-8">
        <div className="space-y-4">
          <Badge className="bg-primary text-primary-foreground px-4 py-1 rounded-full font-black uppercase tracking-widest text-[10px]">
            Next Session
          </Badge>
          <h1 className="text-5xl md:text-8xl font-black font-lora tracking-tighter leading-none">
            {event.title}
          </h1>
        </div>

        <div className="flex flex-wrap justify-center gap-6 md:gap-12">
          <div className="flex items-center gap-3 text-lg font-bold text-primary">
            <CalendarDays className="h-6 w-6" />
            <span>{format(eventDate, "EEEE, MMMM do")}</span>
          </div>
          <div className="flex items-center gap-3 text-lg font-bold text-primary">
            <Clock className="h-6 w-6" />
            <span>10:00 am – 1:00 pm</span>
          </div>
          <div className="flex items-center gap-3 text-lg font-bold text-primary">
            <MapPin className="h-6 w-6" />
            <span>{event.location || "Armadale Baptist Church"}</span>
          </div>
        </div>

        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium">
          {event.description || "Join us for a morning of harmony and connection. We'll be learning a beautiful new arrangement together in the heart of Armadale."}
        </p>
      </header>

      {/* Booking Widget Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-[4rem] -z-10" />
        
        <div className="w-full rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white dark:border-gray-900 min-h-[800px] bg-muted/20">
          {eventSlug ? (
            <iframe
              key={eventSlug}
              src={widgetUrl || undefined}
              data-checkout={eventSlug}
              title={event.title}
              className="w-full min-h-[800px] border-0"
              allowFullScreen
              allow="payment"
            ></iframe>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-12 text-center space-y-6">
              <Info className="h-12 w-12 text-primary opacity-20" />
              <p className="text-xl font-medium text-muted-foreground">Booking details are being finalized.</p>
              <Button asChild variant="outline">
                <a href={humanitixUrl} target="_blank" rel="noopener noreferrer">Check Humanitix Directly</a>
              </Button>
            </div>
          )}
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
              {event.location || "Armadale Baptist Church"}<br />
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
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CalendarDays, ArrowRight, MapPin, Music } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface Event {
  id: string;
  title: string;
  date: string;
  location?: string;
  description?: string;
  humanitix_link?: string;
  ai_chat_link?: string;
  main_song?: string;
}

const FeaturedSection: React.FC = () => {
  const [featuredEvent, setFeaturedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedEvent = async () => {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .gte("date", today)
        .order("date", { ascending: true })
        .limit(1);

      if (error) console.error("Error fetching featured event:", error);
      else if (data && data.length > 0) setFeaturedEvent(data[0]);
      setLoading(false);
    };
    fetchFeaturedEvent();
  }, []);

  return (
    <section className="py-24 md:py-32 bg-muted/30 border-y border-border/50">
      <div className="max-w-6xl mx-auto px-4">
        {loading ? (
          <div className="space-y-8 text-center">
            <Skeleton className="h-12 w-48 mx-auto rounded-full" />
            <Skeleton className="h-20 w-3/4 mx-auto" />
            <Skeleton className="h-40 w-full mx-auto rounded-[3rem]" />
          </div>
        ) : featuredEvent ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 text-center lg:text-left">
              <div className="space-y-4">
                <Badge className="bg-primary text-primary-foreground px-4 py-1 rounded-full font-black uppercase tracking-widest text-[10px]">
                  Next Session
                </Badge>
                <h2 className="text-5xl md:text-7xl font-black font-lora tracking-tighter leading-none">
                  {featuredEvent.title}
                </h2>
                <p className="text-2xl font-black text-primary tracking-tight">
                  {format(new Date(featuredEvent.date), "EEEE, MMMM do")}
                </p>
              </div>

              <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-background rounded-full border border-primary/10 text-sm font-bold shadow-sm">
                  <MapPin className="h-4 w-4 text-primary" />
                  {featuredEvent.location || "Armadale, VIC"}
                </div>
                {featuredEvent.main_song && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-background rounded-full border border-primary/10 text-sm font-bold shadow-sm">
                    <Music className="h-4 w-4 text-primary" />
                    Focus: {featuredEvent.main_song}
                  </div>
                )}
              </div>

              <p className="text-xl text-muted-foreground leading-relaxed font-medium">
                {featuredEvent.description || "Join us for a morning of harmony and connection. No auditions, no experience needed—just bring your voice!"}
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                <Button size="lg" className="h-16 px-10 text-xl font-black rounded-2xl shadow-2xl shadow-primary/20 group/btn transition-all hover:scale-105 w-full sm:w-auto" asChild>
                  <Link to="/current-event">
                    Reserve Your Spot <ArrowRight className="ml-3 h-6 w-6 transition-transform group-hover/btn:translate-x-2" />
                  </Link>
                </Button>
                <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">
                  Tickets $35 via Humanitix
                </p>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="absolute -inset-4 bg-primary/5 rounded-[4rem] rotate-3" />
              <img 
                src="/images/choir-session-2.jpg" 
                alt="Daniele conducting" 
                className="relative rounded-[3rem] shadow-2xl object-cover aspect-square"
              />
              <div className="absolute -bottom-6 -right-6 bg-accent p-8 rounded-[2rem] shadow-2xl max-w-xs">
                <p className="text-accent-foreground font-black text-xl font-lora leading-tight">"The harmonies are sounding beautiful already."</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-6 py-12">
            <h3 className="text-4xl font-black font-lora text-muted-foreground">New dates coming soon!</h3>
            <Button variant="outline" size="lg" className="rounded-xl font-bold h-14 px-8" asChild>
              <Link to="/events">View Past Events</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedSection;
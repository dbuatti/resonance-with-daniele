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
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : featuredEvent ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-3">
                <p className="text-sm font-semibold tracking-[0.2em] uppercase text-muted-foreground">
                  Upcoming session
                </p>
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold font-lora leading-[1.05]">
                  {featuredEvent.title}
                </h2>
                <p className="text-xl md:text-2xl font-semibold text-foreground/90">
                  {format(new Date(featuredEvent.date), "EEEE, d MMMM yyyy")} · 10am–1pm · Armadale
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-base text-foreground/90">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {featuredEvent.location || "Armadale, VIC"}
                </div>
                {featuredEvent.main_song && (
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4" />
                    Focus: {featuredEvent.main_song}
                  </div>
                )}
              </div>

              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
                {featuredEvent.description || "Join us for a morning of harmony and connection. No auditions, no experience needed—just bring your voice!"}
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Button size="lg" className="h-12 md:h-14 px-6 md:px-8 text-base md:text-lg font-bold rounded-lg" asChild>
                  <a href={featuredEvent.humanitix_link || "/next"}>
                    Book your spot <ArrowRight className="ml-2 h-5 w-5" />
                  </a>
                </Button>
                <p className="text-sm text-muted-foreground">
                  Early bird $30 · Early bird deadline 22 November
                </p>
              </div>
            </div>

            <div className="lg:col-span-5">
              <img 
                src="/images/choir-session-2.jpg" 
                alt="Daniele conducting the choir" 
                className="w-full h-[320px] md:h-[420px] lg:h-[520px] object-cover rounded-xl"
              />
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
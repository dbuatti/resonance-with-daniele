"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  date: string; // ISO date string
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
      const today = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD
      
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .gte("date", today) // Only get events from today onwards
        .order("date", { ascending: true })
        .limit(1);

      if (error) {
        console.error("Error fetching featured event:", error);
      } else if (data && data.length > 0) {
        setFeaturedEvent(data[0]);
      }
      setLoading(false);
    };

    fetchFeaturedEvent();
  }, []);

  return (
    <section className="py-16 md:py-24 bg-background text-foreground">
      <div className="max-w-6xl mx-auto text-center px-4">
        <div className="space-y-4 mb-12">
          <Badge variant="outline" className="px-4 py-1 rounded-full border-primary/30 text-primary font-black uppercase tracking-widest text-[10px]">
            Don't Miss Out
          </Badge>
          <h2 className="text-4xl md:text-5xl font-black font-lora tracking-tight">Our Next Session</h2>
        </div>
        
        <Card className="max-w-3xl mx-auto p-8 md:p-12 shadow-2xl rounded-[3rem] border-none bg-muted/20 relative overflow-hidden group">
          {/* Decorative background accent */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-primary/10 transition-colors" />
          
          {loading ? (
            <div className="space-y-6">
              <Skeleton className="h-12 w-12 rounded-full mx-auto" />
              <Skeleton className="h-10 w-3/4 mx-auto" />
              <Skeleton className="h-6 w-1/2 mx-auto" />
              <Skeleton className="h-24 w-full mx-auto" />
              <Skeleton className="h-14 w-48 mx-auto rounded-xl" />
            </div>
          ) : featuredEvent ? (
            <div className="relative z-10 space-y-8">
              <div className="space-y-6">
                <div className="bg-primary text-primary-foreground w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:scale-110 transition-transform duration-500">
                  <CalendarDays className="h-10 w-10" />
                </div>
                
                <div className="space-y-2">
                  <p className="text-2xl font-black text-primary tracking-tight">
                    {format(new Date(featuredEvent.date), "EEEE, MMMM do")}
                  </p>
                  <CardTitle className="text-4xl md:text-5xl font-black font-lora leading-tight">
                    {featuredEvent.title}
                  </CardTitle>
                </div>

                <div className="flex flex-wrap justify-center gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-background/50 rounded-full border border-primary/10 text-sm font-bold">
                    <MapPin className="h-4 w-4 text-primary" />
                    {featuredEvent.location || "Armadale, VIC"}
                  </div>
                  {featuredEvent.main_song && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-background/50 rounded-full border border-primary/10 text-sm font-bold">
                      <Music className="h-4 w-4 text-primary" />
                      Focus: {featuredEvent.main_song}
                    </div>
                  )}
                </div>
              </div>

              <CardContent className="p-0 space-y-10">
                <p className="text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto font-medium">
                  {featuredEvent.description || "Join us for a morning of harmony and connection. No auditions, no sheet music reading required—just bring your voice!"}
                </p>
                
                <div className="flex flex-col items-center gap-4">
                  <Button size="lg" className="h-16 px-10 text-xl font-black rounded-2xl shadow-2xl shadow-primary/20 group/btn transition-all hover:scale-105" asChild>
                    <Link to="/current-event">
                      Reserve Your Spot <ArrowRight className="ml-3 h-6 w-6 transition-transform group-hover/btn:translate-x-2" />
                    </Link>
                  </Button>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Tickets $35 via Humanitix
                  </p>
                </div>
              </CardContent>
            </div>
          ) : (
            <div className="space-y-6 py-12">
              <div className="bg-muted w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 opacity-30">
                <CalendarDays className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-3xl font-black font-lora text-muted-foreground">New dates coming soon!</h3>
              <p className="text-lg text-muted-foreground font-medium">I'm currently planning our next pop-up session. Check back shortly or join the mailing list.</p>
              <Button variant="outline" size="lg" className="rounded-xl font-bold h-14 px-8" asChild>
                <Link to="/events">View Past Events</Link>
              </Button>
            </div>
          )}
        </Card>
      </div>
    </section>
  );
};

export default FeaturedSection;
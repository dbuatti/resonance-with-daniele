"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CalendarDays, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface Event {
  id: string;
  title: string;
  date: string; // ISO date string
  location?: string;
  description?: string;
  humanitix_link?: string;
  ai_chat_link?: string;
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

  const humanitixLink = featuredEvent?.humanitix_link || "https://events.humanitix.com/resonance-choir";

  return (
    <section className="py-16 md:py-24 bg-background text-foreground">
      <div className="max-w-6xl mx-auto text-center px-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-12 font-lora">Featured Highlight</h2>
        
        <Card className="max-w-2xl mx-auto p-8 md:p-12 shadow-2xl rounded-3xl border-none bg-muted/20 relative overflow-hidden group">
          {/* Decorative background accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-primary/10 transition-colors" />
          
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
              <div className="space-y-4">
                <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <CalendarDays className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-3xl md:text-4xl font-black font-lora leading-tight">
                  {featuredEvent.title}
                </CardTitle>
                <p className="text-xl font-bold text-primary uppercase tracking-widest">
                  {format(new Date(featuredEvent.date), "MMMM do, yyyy")}
                </p>
              </div>

              <CardContent className="p-0 space-y-8">
                <p className="text-lg text-muted-foreground leading-relaxed max-w-md mx-auto">
                  {featuredEvent.description || "Join me for this exciting upcoming event!"}
                </p>
                
                <Button size="lg" className="h-14 px-8 text-lg font-bold rounded-xl shadow-lg shadow-primary/20 group/btn" asChild>
                  <a href={humanitixLink} target="_blank" rel="noopener noreferrer">
                    View Details & RSVP <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover/btn:translate-x-1" />
                  </a>
                </Button>
              </CardContent>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-muted w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 opacity-50">
                <CalendarDays className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold font-lora text-muted-foreground">No upcoming events scheduled</h3>
              <p className="text-muted-foreground">Check back soon or explore our past sessions.</p>
              <Button variant="outline" size="lg" className="rounded-xl font-bold" asChild>
                <Link to="/events">View All Events</Link>
              </Button>
            </div>
          )}
        </Card>
      </div>
    </section>
  );
};

export default FeaturedSection;
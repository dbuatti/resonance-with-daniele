"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CalendarDays } from "lucide-react";
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
}

const FeaturedSection: React.FC = () => {
  const [featuredEvent, setFeaturedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedEvent = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("date", { ascending: true })
        .limit(1); // Get only the next upcoming event

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
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-12 font-lora animate-fade-in-up">Featured Highlight</h2>
        <Card className="max-w-2xl mx-auto p-8 shadow-lg rounded-xl border-2 border-primary/20 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-10 rounded-full mx-auto" />
              <Skeleton className="h-8 w-3/4 mx-auto" />
              <Skeleton className="h-6 w-1/2 mx-auto" />
              <Skeleton className="h-4 w-full mx-auto" />
              <Skeleton className="h-4 w-5/6 mx-auto" />
              <Skeleton className="h-12 w-48 mx-auto" />
            </div>
          ) : featuredEvent ? (
            <>
              <CardHeader className="flex flex-col items-center">
                <div className="bg-primary/10 p-3 rounded-full mb-4">
                  <CalendarDays className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold mb-2 font-lora">{featuredEvent.title}</CardTitle>
                <CardDescription className="text-lg text-muted-foreground">
                  {format(new Date(featuredEvent.date), "PPP")}
                  {featuredEvent.location && ` at ${featuredEvent.location}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-md text-muted-foreground">
                  {featuredEvent.description || "Join us for this exciting upcoming event!"}
                </p>
                <Button size="lg" asChild>
                  <Link to={featuredEvent.humanitix_link || "/events"}>
                    {featuredEvent.humanitix_link ? "View Details & RSVP" : "View All Events"}
                  </Link>
                </Button>
              </CardContent>
            </>
          ) : (
            <CardContent className="space-y-4">
              <p className="text-xl font-semibold text-muted-foreground font-lora">No upcoming events at the moment.</p>
              <p className="text-md text-muted-foreground">Check back soon or explore our past events!</p>
              <Button size="lg" asChild>
                <Link to="/events">View All Events</Link>
              </Button>
            </CardContent>
          )}
        </Card>
      </div>
    </section>
  );
};

export default FeaturedSection;
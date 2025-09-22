"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ExternalLink, CalendarDays, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { format } from "date-fns";

interface Event {
  id: string;
  title: string;
  date: string; // ISO date string
  location?: string;
  description?: string;
  humanitix_link?: string;
}

const CurrentEventPage: React.FC = () => {
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentEvent = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .gte("date", format(new Date(), "yyyy-MM-dd")) // Only future events
        .order("date", { ascending: true })
        .limit(1); // Get only the next upcoming event

      if (error) {
        console.error("Error fetching current event:", error);
        showError("Failed to load current event details.");
        setCurrentEvent(null);
      } else if (data && data.length > 0) {
        setCurrentEvent(data[0]);
      } else {
        setCurrentEvent(null); // No upcoming event found
      }
      setLoading(false);
    };

    fetchCurrentEvent();
  }, []);

  if (loading) {
    return (
      <div className="py-8 md:py-12 space-y-6">
        <Card className="p-4 sm:p-6 md:p-8 shadow-lg rounded-xl border-2 border-primary">
          <CardHeader className="text-center">
            <Skeleton className="h-10 w-1/2 mx-auto mb-2" />
            <Skeleton className="h-6 w-3/4 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="w-full mx-auto rounded-lg min-h-[70vh] max-h-[80vh]" />
            <Skeleton className="h-12 w-48 mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

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
          {currentEvent && currentEvent.humanitix_link ? (
            <>
              <div className="relative w-full mx-auto rounded-lg overflow-hidden shadow-xl border border-border min-h-[70vh] max-h-[80vh]">
                <iframe
                  src={currentEvent.humanitix_link}
                  title={currentEvent.title}
                  className="absolute top-0 left-0 w-full h-full border-0"
                  allowFullScreen
                  allow="payment"
                ></iframe>
              </div>
              <div className="text-center">
                <Button asChild size="lg">
                  <a href={currentEvent.humanitix_link} target="_blank" rel="noopener noreferrer">
                    <span>
                      <ExternalLink className="mr-2 h-4 w-4" /> View Event Details
                    </span>
                  </a>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                If the embedded content is not loading, please click the button above to view the event directly on Humanitix.
              </p>
            </>
          ) : (
            <div className="text-center p-8 space-y-4">
              <CalendarDays className="h-16 w-16 text-muted-foreground mx-auto" />
              <p className="text-xl font-semibold text-muted-foreground font-lora">No upcoming event featured right now.</p>
              <p className="text-md text-muted-foreground">Check back soon for new events, or view all past and future events.</p>
              <Button asChild size="lg" className="mt-4">
                <Link to="/events">View All Events</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CurrentEventPage;
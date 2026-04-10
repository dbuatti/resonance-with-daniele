"use client";

import React from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Music, FileText, ArrowRight, Mic2, MessageSquareQuote, MapPin, Heart } from "lucide-react";
import { useSession } from "@/integrations/supabase/auth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import LatestAnnouncementsCard from "@/components/dashboard/LatestAnnouncementsCard";
import CoreHubLinks from "@/components/dashboard/CoreHubLinks";
import { Button } from "@/components/ui/button";
import { getResourcePillType, Resource, ResourceFolder } from "@/types/Resource";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import SetupChecklistCard from "@/components/dashboard/SetupChecklistCard";
import QuickActions from "@/components/dashboard/QuickActions";

interface Event {
  id: string;
  title: string;
  date: string;
  location?: string;
  description?: string;
  humanitix_link?: string;
  ai_chat_link?: string;
}

const resourcePillStyles: { [key: string]: { text: string, border: string } } = {
  pdf: { text: "text-red-600", border: "border-red-300" },
  audio: { text: "text-green-600", border: "border-green-300" },
  link: { text: "text-blue-600", border: "border-blue-300" },
  youtube: { text: "text-purple-600", border: "border-purple-300" },
  lyrics: { text: "text-orange-600", border: "border-orange-300" },
  default: { text: "text-muted-foreground", border: "border-border" },
};

const WelcomeHub: React.FC = () => {
  const { user, profile, loading: loadingSession } = useSession();

  const { data: upcomingEvent, isLoading: loadingEvent } = useQuery<Event | null, Error, Event | null, ['upcomingEvent']>({
    queryKey: ['upcomingEvent'],
    queryFn: async () => {
      const { data, error: fetchError } = await supabase
        .from("events")
        .select("*")
        .gte("date", format(new Date(), "yyyy-MM-dd"))
        .order("date", { ascending: true })
        .limit(1)
        .single();
      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
      return data || null;
    },
    enabled: !loadingSession,
    staleTime: 5 * 60 * 1000,
  });

  const { data: recentPastEvent } = useQuery<Event | null>({
    queryKey: ['recentPastEvent'],
    queryFn: async () => {
      const sevenDaysAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");
      const today = format(new Date(), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .lt("date", today)
        .gte("date", sevenDaysAgo)
        .order("date", { ascending: false })
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') return null;
      return data;
    },
    enabled: !loadingSession,
  });

  const { data: hasReviewed } = useQuery<boolean>({
    queryKey: ['hasReviewedEvent', recentPastEvent?.id],
    queryFn: async () => {
      if (!user?.id || !recentPastEvent?.id) return false;
      const { count, error } = await supabase
        .from("event_feedback")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("event_id", recentPastEvent.id);
      if (error) return false;
      return (count || 0) > 0;
    },
    enabled: !!recentPastEvent?.id && !!user?.id,
  });

  const { data: recentResources, isLoading: loadingResources } = useQuery<Resource[], Error, Resource[], ['recentResources']>({
    queryKey: ['recentResources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data || [];
    },
    enabled: !loadingSession,
  });

  const { data: nominatedFolder, isLoading: loadingNominatedFolder } = useQuery<ResourceFolder | null, Error, ResourceFolder | null, ['nominatedFolder']>({
    queryKey: ['nominatedFolder'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resource_folders")
        .select("*")
        .eq("is_nominated_for_dashboard", true)
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    },
    enabled: !loadingSession,
  });

  const isLoading = loadingSession || loadingEvent || loadingResources || loadingNominatedFolder;
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const firstName = profile?.first_name || user?.email?.split('@')[0] || "there";

  if (isLoading) {
    return (
      <div className="py-8 space-y-8">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  const renderResourceBadge = (resource: Resource) => {
    const pillType = getResourcePillType(resource);
    const style = resourcePillStyles[pillType] || resourcePillStyles.default;
    let text = pillType.charAt(0).toUpperCase() + pillType.slice(1);
    if (pillType === 'pdf') text = 'Sheet Music';
    if (pillType === 'audio') text = 'Audio';
    return <Badge variant="outline" className={cn("text-[9px] uppercase tracking-widest font-black bg-card border", style.text, style.border)}>{text}</Badge>;
  };

  return (
    <div className="py-8 space-y-12 animate-fade-in-up">
      {/* Hero Welcome Section */}
      <section className="flex flex-col md:flex-row items-center gap-8 border-b border-border pb-12">
        <div className="flex-shrink-0 relative group">
          <img 
            src={profile?.avatar_url || "/images/daniele-buatti-headshot.jpeg"} 
            alt={firstName} 
            className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-2 border-primary/10 shadow-lg" 
          />
          <div className="absolute -bottom-1 -right-1 bg-accent text-accent-foreground p-1.5 rounded-lg shadow-md border-2 border-background">
            <Mic2 className="h-4 w-4" />
          </div>
        </div>
        <div className="text-center md:text-left space-y-2">
          <h1 className="text-3xl md:text-5xl font-black font-lora tracking-tighter">
            {getGreeting()}, <span className="text-primary">{firstName}</span>!
          </h1>
          <p className="text-lg text-muted-foreground font-medium max-w-xl">
            Ready to find your resonance today?
          </p>
        </div>
      </section>

      {/* Feedback Prompt */}
      {recentPastEvent && !hasReviewed && (
        <div className="bg-accent/10 border border-accent/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-accent/20 p-3 rounded-xl">
              <MessageSquareQuote className="h-6 w-6 text-accent-foreground" />
            </div>
            <div>
              <p className="font-bold text-lg">How was "{recentPastEvent.title}"?</p>
              <p className="text-sm text-muted-foreground">Your feedback helps me make the next session even better.</p>
            </div>
          </div>
          <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold rounded-xl" asChild>
            <Link to={`/feedback?eventId=${recentPastEvent.id}`}>
              Give Feedback <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}

      {/* Core Navigation Links */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-6 w-1 bg-primary rounded-full" />
          <h2 className="text-xl font-black font-lora uppercase tracking-widest text-muted-foreground">The Hub</h2>
        </div>
        <CoreHubLinks />
      </section>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-12">
          <LatestAnnouncementsCard />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Next Event</h3>
                <CalendarDays className="h-4 w-4 text-primary opacity-50" />
              </div>
              <div className="bg-muted/30 rounded-2xl p-6 space-y-6 border border-border/50">
                <div className="space-y-2">
                  <p className="text-2xl font-black font-lora leading-tight">
                    {upcomingEvent ? upcomingEvent.title : "No Upcoming Events"}
                  </p>
                  {upcomingEvent && (
                    <div className="space-y-1">
                      <p className="text-lg font-bold text-primary">
                        {format(new Date(upcomingEvent.date), "EEEE, MMM do")}
                      </p>
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> {upcomingEvent.location || "Armadale Baptist Church"}
                      </p>
                    </div>
                  )}
                </div>
                {upcomingEvent ? (
                  <Button size="lg" className="w-full font-bold rounded-xl" asChild>
                    <Link to={upcomingEvent.humanitix_link || "/current-event"}>
                      RSVP Now <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Check back soon for new dates!</p>
                )}
              </div>
            </div>

            {nominatedFolder && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Current Focus</h3>
                  <Music className="h-4 w-4 text-accent opacity-50" />
                </div>
                <div className="bg-accent/5 rounded-2xl p-6 space-y-6 border border-accent/20">
                  <div className="space-y-2">
                    <p className="text-2xl font-black font-lora leading-tight">
                      {nominatedFolder.name}
                    </p>
                    <p className="text-sm font-medium text-muted-foreground">
                      Practice materials for our current song are ready for you.
                    </p>
                  </div>
                  <Button size="lg" variant="outline" className="w-full font-bold border-accent/50 text-accent-foreground hover:bg-accent hover:text-accent-foreground rounded-xl" asChild>
                    <Link to={`/resources?folderId=${nominatedFolder.id}`}>
                      Practice Now <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-12">
          <SetupChecklistCard />
          <QuickActions />
          
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" /> Recent Resources
            </h3>
            <div className="bg-muted/20 rounded-2xl overflow-hidden border border-border/50">
              <div className="divide-y divide-border/50">
                {recentResources && recentResources.length > 0 ? (
                  recentResources.map((resource) => (
                    <a 
                      key={resource.id} 
                      href={resource.url || "#"} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-all group"
                    >
                      <div className="flex-shrink-0">{renderResourceBadge(resource)}</div>
                      <span className="text-sm font-bold line-clamp-1 group-hover:text-primary transition-colors">{resource.title}</span>
                    </a>
                  ))
                ) : (
                  <div className="p-6 text-center text-sm text-muted-foreground italic">No recent resources.</div>
                )}
              </div>
              <Button variant="ghost" size="sm" className="w-full text-primary font-bold h-12 rounded-none border-t border-border/50" asChild>
                <Link to="/resources">
                  View all resources <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <footer className="text-center pt-12 border-t border-border/50 pb-8">
        <div className="flex flex-col items-center gap-4">
          <Heart className="h-6 w-6 text-primary opacity-20" />
          <p className="text-xl font-lora italic font-medium text-muted-foreground max-w-xl leading-relaxed">
            "Singing is the shortest distance between two people."
          </p>
        </div>
      </footer>
    </div>
  );
};

export default WelcomeHub;
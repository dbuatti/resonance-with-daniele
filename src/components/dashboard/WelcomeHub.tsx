"use client";

import React from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Music, FileText, ArrowRight, Mic2, MessageSquareQuote, MapPin, Heart, Sparkles, BookOpen } from "lucide-react";
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
        .maybeSingle();
      if (fetchError) throw fetchError;
      return data || null;
    },
    enabled: !loadingSession,
    staleTime: 5 * 60 * 1000,
  });

  const { data: eventFolder } = useQuery<ResourceFolder | null>({
    queryKey: ['eventFolder', upcomingEvent?.id],
    queryFn: async () => {
      if (!upcomingEvent?.id) return null;
      const { data, error } = await supabase
        .from("resource_folders")
        .select("*")
        .eq("event_id", upcomingEvent.id)
        .limit(1)
        .maybeSingle();
      if (error) return null;
      return data;
    },
    enabled: !!upcomingEvent?.id,
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
        .maybeSingle();
      if (error) return null;
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
        .maybeSingle();
      if (error) throw error;
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

  const currentResourceFolder = eventFolder || nominatedFolder;
  const bannerLink = upcomingEvent 
    ? `/sessions#event-${upcomingEvent.id}` 
    : (nominatedFolder?.event_id ? `/sessions#event-${nominatedFolder.event_id}` : "/sessions");

  return (
    <div className="py-8 space-y-12 animate-fade-in-up">
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
          <h1 className="text-4xl md:text-6xl font-black font-lora tracking-tighter">
            {getGreeting()}, <span className="text-primary">{firstName}</span>!
          </h1>
          <p className="text-xl text-muted-foreground font-medium max-w-xl">
            Ready to find your resonance today?
          </p>
        </div>
      </section>

      {recentPastEvent && !hasReviewed && (
        <div className="bg-accent/10 border border-accent/20 rounded-[2rem] p-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="bg-accent/20 p-4 rounded-2xl">
              <MessageSquareQuote className="h-8 w-8 text-accent-foreground" />
            </div>
            <div>
              <p className="font-black text-2xl font-lora">How was "{recentPastEvent.title}"?</p>
              <p className="text-lg text-muted-foreground font-medium">Your feedback helps me make the next session even better.</p>
            </div>
          </div>
          <Button size="lg" className="h-14 px-8 text-lg font-black bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl shadow-xl" asChild>
            <Link to={`/feedback?eventId=${recentPastEvent.id}`}>
              Give Feedback <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      )}

      {currentResourceFolder && (
        <section className="animate-fade-in-up">
          <Button 
            asChild 
            size="lg" 
            className="w-full h-24 md:h-32 rounded-[2.5rem] bg-primary text-primary-foreground shadow-2xl shadow-primary/20 hover:scale-[1.01] transition-all group relative overflow-hidden"
          >
            <Link to={bannerLink}>
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              <div className="flex items-center justify-between w-full px-6 md:px-12">
                <div className="flex items-center gap-6 md:gap-8">
                  <div className="bg-white/20 p-4 md:p-6 rounded-[1.5rem] shadow-inner">
                    <Music className="h-8 w-8 md:h-10 md:w-10 text-accent" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] opacity-70">Current Focus</p>
                    <p className="text-2xl md:text-4xl font-black font-lora tracking-tight">Practice: {currentResourceFolder.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 font-black text-base md:text-xl uppercase tracking-widest">
                  Open Session Hub <ArrowRight className="h-6 w-6 md:h-8 md:w-8 transition-transform group-hover:translate-x-2" />
                </div>
              </div>
            </Link>
          </Button>
        </section>
      )}

      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1.5 bg-primary rounded-full" />
          <h2 className="text-lg font-black uppercase tracking-[0.2em] text-muted-foreground">The Hub</h2>
        </div>
        <CoreHubLinks />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-16">
          <LatestAnnouncementsCard />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Next Event</h3>
                <CalendarDays className="h-4 w-4 text-primary opacity-50" />
              </div>
              <div className="bg-muted/30 rounded-[2rem] p-8 space-y-8 border border-border/50 shadow-inner">
                <div className="space-y-3">
                  <p className="text-3xl font-black font-lora leading-tight">
                    {upcomingEvent ? upcomingEvent.title : "No Upcoming Events"}
                  </p>
                  {upcomingEvent && (
                    <div className="space-y-2">
                      <p className="text-xl font-bold text-primary">
                        {format(new Date(upcomingEvent.date), "EEEE, MMM do")}
                      </p>
                      <p className="text-base font-medium text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> {upcomingEvent.location || "Armadale Baptist Church"}
                      </p>
                    </div>
                  )}
                </div>
                {upcomingEvent ? (
                  <Button size="lg" className="w-full h-14 text-lg font-black rounded-xl shadow-lg" asChild>
                    <Link to={upcomingEvent.humanitix_link || "/current-event"}>
                      RSVP Now <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                ) : (
                  <p className="text-base text-muted-foreground italic font-medium">Check back soon for new dates!</p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Community Voice</h3>
                <Sparkles className="h-4 w-4 text-accent opacity-50" />
              </div>
              <div className="bg-accent/5 rounded-[2rem] p-8 space-y-8 border border-accent/20 shadow-inner">
                <div className="space-y-3">
                  <p className="text-3xl font-black font-lora leading-tight">
                    Song Suggestions
                  </p>
                  <p className="text-base font-medium text-muted-foreground leading-relaxed">
                    Have a song you'd love to sing? Suggest it and vote on others!
                  </p>
                </div>
                <Button size="lg" variant="outline" className="w-full h-14 text-lg font-black border-accent/50 text-accent-foreground hover:bg-accent hover:text-accent-foreground rounded-xl shadow-sm" asChild>
                  <Link to="/song-suggestions">
                    Go to Suggestions <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-16">
          <SetupChecklistCard />
          <QuickActions />
          
          <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" /> Recent Resources
            </h3>
            <div className="bg-muted/20 rounded-[2rem] overflow-hidden border border-border/50 shadow-inner">
              <div className="divide-y divide-border/50">
                {recentResources && recentResources.length > 0 ? (
                  recentResources.map((resource) => (
                    <a 
                      key={resource.id} 
                      href={resource.url || "#"} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-5 hover:bg-muted/50 transition-all group"
                    >
                      <div className="flex-shrink-0">{renderResourceBadge(resource)}</div>
                      <span className="text-sm font-bold line-clamp-1 group-hover:text-primary transition-colors">{resource.title}</span>
                    </a>
                  ))
                ) : (
                  <div className="p-8 text-center text-sm text-muted-foreground italic font-medium">No recent resources.</div>
                )}
              </div>
              <Button variant="ghost" size="sm" className="w-full text-primary font-black h-14 rounded-none border-t border-border/50 hover:bg-primary/5" asChild>
                <Link to="/resources">
                  View all resources <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <footer className="text-center pt-16 border-t border-border/50 pb-8">
        <div className="flex flex-col items-center gap-6">
          <Heart className="h-8 w-8 text-primary opacity-20" />
          <p className="text-2xl font-lora italic font-medium text-muted-foreground max-w-xl leading-relaxed">
            "Singing is the shortest distance between two people."
          </p>
        </div>
      </footer>
    </div>
  );
};

export default WelcomeHub;
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { CalendarDays, Music, FileText, User as UserIcon, Folder, CheckCircle2, ArrowRight, Sparkles, Mic2, Heart, MessageSquareQuote, MapPin } from "lucide-react";
import { useSession } from "@/integrations/supabase/auth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays, isAfter, isBefore } from "date-fns";
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

  const { data: hasRsvpd, isLoading: loadingRsvp } = useQuery<boolean, Error, boolean, ['eventRsvpStatus', string | undefined]>({
    queryKey: ['eventRsvpStatus', upcomingEvent?.id],
    queryFn: async () => {
      if (!user?.id || !upcomingEvent?.id) return false;
      const { count, error } = await supabase
        .from("event_rsvps")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("event_id", upcomingEvent.id);
      if (error) throw error;
      return (count || 0) > 0;
    },
    enabled: !loadingSession && !!user?.id && !!upcomingEvent?.id,
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

  const isLoading = loadingSession || loadingEvent || loadingResources || loadingRsvp || loadingNominatedFolder;
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const firstName = profile?.first_name || user?.email?.split('@')[0] || "there";
  const memberSince = user?.created_at ? format(new Date(user.created_at), "MMMM yyyy") : null;

  if (isLoading) {
    return (
      <div className="py-6 space-y-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
    return <Badge variant="outline" className={cn("text-[9px] uppercase tracking-wider font-bold bg-card border", style.text, style.border)}>{text}</Badge>;
  };

  return (
    <div className="py-6 space-y-8 animate-fade-in-up">
      {/* Hero Welcome Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground p-6 md:p-10 soft-shadow border-2 border-white/10">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-shrink-0 relative group">
            <img 
              src={profile?.avatar_url || "/images/daniele-buatti-headshot.jpeg"} 
              alt="Daniele Buatti" 
              className="relative w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-2 border-white/20 shadow-xl transform transition-transform duration-500 group-hover:scale-105" 
            />
            <div className="absolute -bottom-1 -right-1 bg-accent text-accent-foreground p-1.5 rounded-full shadow-lg">
              <Mic2 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-center md:text-left space-y-3">
            <div className="space-y-1">
              <h1 className="text-3xl md:text-4xl font-black font-lora leading-tight tracking-tight">
                {getGreeting()}, <span className="text-accent">{firstName}</span>!
              </h1>
              {memberSince && (
                <Badge className="bg-white/10 text-white border-none px-2 py-0.5 text-[9px] uppercase tracking-widest font-bold">
                  Member since {memberSince}
                </Badge>
              )}
            </div>
            <p className="text-base md:text-lg text-primary-foreground/90 max-w-xl font-medium leading-relaxed">
              Your voice is your instrument. Ready to find your resonance today?
            </p>
          </div>
        </div>
      </section>

      {/* Feedback Prompt */}
      {recentPastEvent && !hasReviewed && (
        <section className="animate-fade-in-up">
          <Card className="bg-accent text-accent-foreground border-none shadow-md rounded-2xl overflow-hidden relative hover-lift">
            <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6 relative z-10">
              <div className="bg-white/20 p-3 rounded-xl shadow-inner">
                <MessageSquareQuote className="h-6 w-6" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <p className="text-lg font-black font-lora leading-tight">
                  I'd love your feedback on "{recentPastEvent.title}"
                </p>
                <p className="text-xs font-medium opacity-80">It only takes 2 minutes to help me improve.</p>
              </div>
              <Button size="sm" className="bg-accent-foreground text-accent hover:bg-accent-foreground/90 font-black rounded-xl h-10 px-6 shadow-lg group" asChild>
                <Link to={`/feedback?eventId=${recentPastEvent.id}`}>
                  Give Feedback <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Core Navigation Links */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <div className="h-6 w-1 bg-primary rounded-full" />
          <h2 className="text-xl font-black font-lora tracking-tight">Explore the Hub</h2>
        </div>
        <CoreHubLinks />
      </section>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <LatestAnnouncementsCard />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="soft-shadow border-none bg-secondary/40 dark:bg-secondary/10 overflow-hidden group hover-lift rounded-2xl">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="bg-background/80 border-primary/20 text-primary text-[10px] font-bold">Next Event</Badge>
                  <CalendarDays className="h-5 w-5 text-primary opacity-50" />
                </div>
                <CardTitle className="text-xl font-black font-lora mt-4 leading-tight">
                  {upcomingEvent ? upcomingEvent.title : "No Upcoming Events"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingEvent ? (
                  <>
                    <div className="space-y-1">
                      <p className="text-lg font-black text-primary">
                        {format(new Date(upcomingEvent.date), "EEEE, MMM do")}
                      </p>
                      {upcomingEvent.location && (
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                          <MapPin className="h-3 w-3" /> {upcomingEvent.location}
                        </p>
                      )}
                    </div>
                    <Button size="sm" className="w-full h-10 font-bold rounded-xl shadow-md group-hover:translate-x-0.5 transition-transform" asChild>
                      <Link to={upcomingEvent.humanitix_link || "/current-event"}>
                        {hasRsvpd ? "View Details" : "RSVP Now"} <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground font-medium">Check back soon for new dates!</p>
                )}
              </CardContent>
            </Card>

            {nominatedFolder && (
              <Card className="soft-shadow border-none bg-accent/10 dark:bg-accent/5 overflow-hidden group hover-lift rounded-2xl border-t-2 border-accent">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="bg-background/80 border-accent/30 text-accent-foreground text-[10px] font-bold">Current Focus</Badge>
                    <Music className="h-5 w-5 text-accent opacity-50" />
                  </div>
                  <CardTitle className="text-xl font-black font-lora mt-4 leading-tight">
                    {nominatedFolder.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                    Practice materials for our current song are ready for you.
                  </p>
                  <Button size="sm" variant="outline" className="w-full h-10 font-bold border-accent/50 text-accent-foreground hover:bg-accent hover:text-accent-foreground rounded-xl group-hover:translate-x-0.5 transition-transform" asChild>
                    <Link to={`/resources?folderId=${nominatedFolder.id}`}>
                      Practice Now <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <SetupChecklistCard />
          <QuickActions />
          
          <Card className="soft-shadow border-none rounded-2xl overflow-hidden">
            <CardHeader className="pb-2 bg-muted/30">
              <CardTitle className="text-lg font-black font-lora flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Recent Resources
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {recentResources && recentResources.length > 0 ? (
                  recentResources.map((resource) => (
                    <a 
                      key={resource.id} 
                      href={resource.url || "#"} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-all group"
                    >
                      <div className="flex-shrink-0">{renderResourceBadge(resource)}</div>
                      <span className="text-xs font-bold line-clamp-1 group-hover:text-primary transition-colors">{resource.title}</span>
                    </a>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-muted-foreground font-medium italic">No recent resources.</div>
                )}
              </div>
              <div className="p-4 bg-muted/10">
                <Button variant="link" size="sm" className="w-full text-primary font-bold p-0 h-auto group" asChild>
                  <Link to="/resources">
                    View all resources <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <footer className="text-center pt-8 border-t border-border/50 pb-6">
        <div className="flex flex-col items-center gap-4">
          <Heart className="h-5 w-5 text-primary opacity-40" />
          <p className="text-lg font-lora italic font-medium text-muted-foreground max-w-xl leading-relaxed">
            "Singing is the shortest distance between two people."
          </p>
          <Button variant="outline" size="sm" className="rounded-full font-black border-primary/20 text-primary hover:bg-primary hover:text-white transition-all" asChild>
            <a href="https://DanieleBuatti.com" target="_blank" rel="noopener noreferrer">DanieleBuatti.com</a>
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default WelcomeHub;
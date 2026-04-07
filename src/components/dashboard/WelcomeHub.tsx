"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { CalendarDays, Music, FileText, User as UserIcon, Folder, CheckCircle2, ArrowRight, Sparkles, Mic2, Heart, MessageSquareQuote } from "lucide-react";
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
      <div className="py-8 space-y-8">
        <Skeleton className="h-64 w-full rounded-[2.5rem]" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
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
    return <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider font-bold bg-card border", style.text, style.border)}>{text}</Badge>;
  };

  return (
    <div className="py-8 space-y-12 animate-fade-in-up">
      {/* Hero Welcome Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground p-8 md:p-16 soft-shadow border-4 border-white/10">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-shrink-0 relative group">
            <div className="absolute -inset-1 bg-accent rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <img 
              src={profile?.avatar_url || "/images/daniele-buatti-headshot.jpeg"} 
              alt="Daniele Buatti" 
              className="relative w-32 h-32 md:w-44 md:h-44 rounded-full object-cover border-4 border-white/20 shadow-2xl transform transition-transform duration-500 group-hover:scale-105" 
            />
            <div className="absolute -bottom-2 -right-2 bg-accent text-accent-foreground p-2.5 rounded-full shadow-lg animate-float">
              <Mic2 className="h-5 w-5" />
            </div>
          </div>
          <div className="text-center md:text-left space-y-6">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-6xl font-black font-lora leading-tight tracking-tight">
                {getGreeting()}, <span className="text-accent">{firstName}</span>!
              </h1>
              {memberSince && (
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <Badge className="bg-white/20 hover:bg-white/30 text-white border-none px-3 py-1 text-[10px] uppercase tracking-widest font-bold transition-colors">
                    <Sparkles className="h-3 w-3 mr-2 text-accent" /> Member since {memberSince}
                  </Badge>
                </div>
              )}
            </div>
            <p className="text-lg md:text-2xl text-primary-foreground/90 max-w-2xl font-medium leading-relaxed">
              Your voice is your instrument. Ready to find your resonance today?
            </p>
          </div>
        </div>
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[80px] pointer-events-none" />
      </section>

      {/* Feedback Prompt */}
      {recentPastEvent && !hasReviewed && (
        <section className="animate-fade-in-up">
          <Card className="bg-accent text-accent-foreground border-none shadow-xl rounded-[2.5rem] overflow-hidden relative hover-lift">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8 relative z-10">
              <div className="bg-white/20 p-5 rounded-2xl shadow-inner">
                <MessageSquareQuote className="h-10 w-10" />
              </div>
              <div className="flex-1 text-center md:text-left space-y-1">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-70">How was the session?</h3>
                <p className="text-2xl font-black font-lora leading-tight">
                  I'd love your feedback on "{recentPastEvent.title}"
                </p>
                <p className="text-sm font-medium opacity-80">It only takes 2 minutes and helps me make the next one even better.</p>
              </div>
              <Button size="lg" className="bg-accent-foreground text-accent hover:bg-accent-foreground/90 font-black rounded-2xl h-14 px-8 shadow-2xl group" asChild>
                <Link to={`/feedback?eventId=${recentPastEvent.id}`}>
                  Give Feedback <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Core Navigation Links */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="h-8 w-1.5 bg-primary rounded-full" />
          <h2 className="text-3xl font-black font-lora tracking-tight">Explore the Hub</h2>
        </div>
        <CoreHubLinks />
      </section>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          <LatestAnnouncementsCard />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="soft-shadow border-none bg-secondary/40 dark:bg-secondary/10 overflow-hidden group hover-lift rounded-3xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="bg-background/80 border-primary/20 text-primary font-bold">Next Event</Badge>
                  <div className="p-2 bg-primary/10 rounded-xl text-primary">
                    <CalendarDays className="h-6 w-6" />
                  </div>
                </div>
                <CardTitle className="text-3xl font-black font-lora mt-6 leading-tight">
                  {upcomingEvent ? upcomingEvent.title : "No Upcoming Events"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {upcomingEvent ? (
                  <>
                    <div className="space-y-2">
                      <p className="text-xl font-black text-primary">
                        {format(new Date(upcomingEvent.date), "EEEE, MMM do")}
                      </p>
                      {upcomingEvent.location && (
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/40" /> {upcomingEvent.location}
                        </p>
                      )}
                    </div>
                    <Button className="w-full h-12 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20 group-hover:translate-x-1 transition-transform" asChild>
                      <Link to={upcomingEvent.humanitix_link || "/current-event"}>
                        {hasRsvpd ? "View Details" : "RSVP Now"} <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  </>
                ) : (
                  <p className="text-muted-foreground font-medium">Check back soon for new dates!</p>
                )}
              </CardContent>
            </Card>

            {nominatedFolder && (
              <Card className="soft-shadow border-none bg-accent/10 dark:bg-accent/5 overflow-hidden group hover-lift rounded-3xl border-t-4 border-accent">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="bg-background/80 border-accent/30 text-accent-foreground font-bold">Current Focus</Badge>
                    <div className="p-2 bg-accent/20 rounded-xl text-accent-foreground">
                      <Music className="h-6 w-6" />
                    </div>
                  </div>
                  <CardTitle className="text-3xl font-black font-lora mt-6 leading-tight">
                    {nominatedFolder.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                    Practice materials for our current song are ready for you. Let's perfect those harmonies!
                  </p>
                  <Button variant="outline" className="w-full h-12 text-lg font-bold border-accent/50 text-accent-foreground hover:bg-accent hover:text-accent-foreground rounded-2xl group-hover:translate-x-1 transition-transform" asChild>
                    <Link to={`/resources?folderId=${nominatedFolder.id}`}>
                      Practice Now <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-10">
          <SetupChecklistCard />
          <QuickActions />
          
          <Card className="soft-shadow border-none rounded-3xl overflow-hidden">
            <CardHeader className="pb-4 bg-muted/30">
              <CardTitle className="text-xl font-black font-lora flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
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
                      className="flex items-center gap-4 p-5 hover:bg-muted/50 transition-all group"
                    >
                      <div className="flex-shrink-0 transform transition-transform group-hover:scale-110">{renderResourceBadge(resource)}</div>
                      <span className="text-sm font-bold line-clamp-1 group-hover:text-primary transition-colors">{resource.title}</span>
                    </a>
                  ))
                ) : (
                  <div className="p-8 text-center text-sm text-muted-foreground font-medium italic">No recent resources.</div>
                )}
              </div>
              <div className="p-5 bg-muted/10">
                <Button variant="link" className="w-full text-primary font-bold p-0 h-auto group" asChild>
                  <Link to="/resources">
                    View all resources <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <footer className="text-center pt-12 border-t border-border/50 pb-8">
        <div className="flex flex-col items-center gap-6">
          <div className="p-3 bg-primary/5 rounded-full">
            <Heart className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <p className="text-2xl font-lora italic font-medium text-muted-foreground max-w-2xl leading-relaxed">
            "Singing is the shortest distance between two people."
          </p>
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60">Learn more at</span>
            <Button variant="outline" className="rounded-full font-black border-primary/20 text-primary hover:bg-primary hover:text-white transition-all" asChild>
              <a href="https://DanieleBuatti.com" target="_blank" rel="noopener noreferrer">DanieleBuatti.com</a>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WelcomeHub;
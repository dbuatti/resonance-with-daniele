"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { CalendarDays, Music, FileText, User as UserIcon, Folder, CheckCircle2, ArrowRight, Sparkles, Mic2, Heart, MessageSquareQuote, MapPin, Bell, Zap } from "lucide-react";
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
    return <Badge variant="outline" className={cn("text-[10px] uppercase tracking-widest font-black bg-card border-2", style.text, style.border)}>{text}</Badge>;
  };

  return (
    <div className="py-8 space-y-10 animate-fade-in-up">
      {/* Hero Welcome Section */}
      <section className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground p-8 md:p-12 shadow-2xl border-4 border-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-shrink-0 relative group">
            <div className="absolute -inset-2 bg-accent/20 rounded-full blur-xl group-hover:bg-accent/40 transition-all duration-500" />
            <img 
              src={profile?.avatar_url || "/images/daniele-buatti-headshot.jpeg"} 
              alt={firstName} 
              className="relative w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white/20 shadow-2xl transform transition-transform duration-700 group-hover:scale-105" 
            />
            <div className="absolute -bottom-2 -right-2 bg-accent text-accent-foreground p-2.5 rounded-2xl shadow-2xl border-4 border-primary">
              <Mic2 className="h-6 w-6" />
            </div>
          </div>
          <div className="text-center md:text-left space-y-4">
            <div className="space-y-1">
              <h1 className="text-4xl md:text-6xl font-black font-lora leading-none tracking-tighter">
                {getGreeting()}, <span className="text-accent">{firstName}</span>!
              </h1>
              <p className="text-lg md:text-xl text-primary-foreground/80 font-medium max-w-xl leading-relaxed">
                Your voice is your instrument. Ready to find your resonance today?
              </p>
            </div>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <Badge className="bg-white/10 text-white border-none px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-black">
                Member since {user?.created_at ? format(new Date(user.created_at), "MMMM yyyy") : "2024"}
              </Badge>
              {profile?.is_admin && (
                <Badge className="bg-accent text-accent-foreground border-none px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-black">
                  Admin Access
                </Badge>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Feedback Prompt */}
      {recentPastEvent && !hasReviewed && (
        <section className="animate-fade-in-up">
          <Card className="bg-accent text-accent-foreground border-none shadow-xl rounded-[2rem] overflow-hidden relative hover-lift">
            <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8 relative z-10">
              <div className="bg-white/20 p-4 rounded-2xl shadow-inner">
                <MessageSquareQuote className="h-8 w-8" />
              </div>
              <div className="flex-1 text-center md:text-left space-y-1">
                <p className="text-2xl font-black font-lora leading-tight">
                  How was "{recentPastEvent.title}"?
                </p>
                <p className="text-sm font-bold opacity-80 uppercase tracking-widest">Your feedback helps me make the next session even better.</p>
              </div>
              <Button size="lg" className="bg-accent-foreground text-accent hover:bg-accent-foreground/90 font-black rounded-2xl h-14 px-10 shadow-2xl group" asChild>
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
          <h2 className="text-3xl font-black font-lora tracking-tight">The Hub</h2>
        </div>
        <CoreHubLinks />
      </section>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <LatestAnnouncementsCard />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="soft-shadow border-none bg-secondary/40 dark:bg-secondary/10 overflow-hidden group hover-lift rounded-[2.5rem] p-2">
              <CardHeader className="pb-4 p-6">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="bg-background/80 border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Next Event</Badge>
                  <CalendarDays className="h-6 w-6 text-primary opacity-50" />
                </div>
                <CardTitle className="text-2xl font-black font-lora mt-6 leading-tight">
                  {upcomingEvent ? upcomingEvent.title : "No Upcoming Events"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6 pt-0">
                {upcomingEvent ? (
                  <>
                    <div className="space-y-2">
                      <p className="text-xl font-black text-primary">
                        {format(new Date(upcomingEvent.date), "EEEE, MMM do")}
                      </p>
                      {upcomingEvent.location && (
                        <p className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" /> {upcomingEvent.location}
                        </p>
                      )}
                    </div>
                    <Button size="lg" className="w-full h-14 font-black text-lg rounded-2xl shadow-xl group-hover:shadow-2xl transition-all" asChild>
                      <Link to={upcomingEvent.humanitix_link || "/current-event"}>
                        {hasRsvpd ? "View Details" : "RSVP Now"} <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-2" />
                      </Link>
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground font-bold italic">Check back soon for new dates!</p>
                )}
              </CardContent>
            </Card>

            {nominatedFolder && (
              <Card className="soft-shadow border-none bg-accent/10 dark:bg-accent/5 overflow-hidden group hover-lift rounded-[2.5rem] border-t-8 border-accent p-2">
                <CardHeader className="pb-4 p-6">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="bg-background/80 border-accent/30 text-accent-foreground text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Current Focus</Badge>
                    <Music className="h-6 w-6 text-accent opacity-50" />
                  </div>
                  <CardTitle className="text-2xl font-black font-lora mt-6 leading-tight">
                    {nominatedFolder.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6 pt-0">
                  <p className="text-sm font-bold text-muted-foreground leading-relaxed">
                    Practice materials for our current song are ready for you.
                  </p>
                  <Button size="lg" variant="outline" className="w-full h-14 font-black text-lg border-accent/50 text-accent-foreground hover:bg-accent hover:text-accent-foreground rounded-2xl group-hover:shadow-xl transition-all" asChild>
                    <Link to={`/resources?folderId=${nominatedFolder.id}`}>
                      Practice Now <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <SetupChecklistCard />
          <QuickActions />
          
          <Card className="soft-shadow border-none rounded-[2.5rem] overflow-hidden">
            <CardHeader className="pb-4 bg-muted/30 p-6">
              <CardTitle className="text-xl font-black font-lora flex items-center gap-3">
                <FileText className="h-6 w-6 text-primary" />
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
                      <div className="flex-shrink-0">{renderResourceBadge(resource)}</div>
                      <span className="text-sm font-bold line-clamp-1 group-hover:text-primary transition-colors">{resource.title}</span>
                    </a>
                  ))
                ) : (
                  <div className="p-8 text-center text-sm text-muted-foreground font-bold italic">No recent resources.</div>
                )}
              </div>
              <div className="p-6 bg-muted/10">
                <Button variant="link" size="sm" className="w-full text-primary font-black p-0 h-auto group text-base" asChild>
                  <Link to="/resources">
                    View all resources <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <footer className="text-center pt-12 border-t border-border/50 pb-12">
        <div className="flex flex-col items-center gap-6">
          <Heart className="h-8 w-8 text-primary opacity-20 animate-pulse" />
          <p className="text-2xl font-lora italic font-medium text-muted-foreground max-w-2xl leading-relaxed text-balance">
            "Singing is the shortest distance between two people."
          </p>
          <Button variant="outline" size="lg" className="rounded-full font-black border-primary/20 text-primary hover:bg-primary hover:text-white transition-all px-8" asChild>
            <a href="https://DanieleBuatti.com" target="_blank" rel="noopener noreferrer">DanieleBuatti.com</a>
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default WelcomeHub;
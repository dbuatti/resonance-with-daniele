"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { CalendarDays, Music, FileText, User as UserIcon, Folder, CheckCircle2, ArrowRight } from "lucide-react";
import { useSession } from "@/integrations/supabase/auth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
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
      <div className="py-8 md:py-12 space-y-8">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
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
    <div className="py-8 md:py-12 space-y-10">
      {/* Hero Welcome Section */}
      <section className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground p-8 md:p-12 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-shrink-0">
            <img 
              src={profile?.avatar_url || "/images/daniele-buatti-headshot.jpeg"} 
              alt="Daniele Buatti" 
              className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-primary-foreground/20 shadow-xl" 
            />
          </div>
          <div className="text-center md:text-left space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold font-lora leading-tight">
              {getGreeting()}, {firstName}!
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl">
              Ready to find your resonance today? Explore your resources, check upcoming events, and stay connected with our community.
            </p>
          </div>
        </div>
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Core Navigation Links */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold font-lora px-2">Explore the Hub</h2>
        <CoreHubLinks />
      </section>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Announcements & Events */}
        <div className="lg:col-span-8 space-y-8">
          <LatestAnnouncementsCard />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Next Event Card */}
            <Card className="shadow-lg border-none bg-secondary/50 dark:bg-secondary/20 overflow-hidden group">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="bg-background/50">Next Event</Badge>
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-2xl font-lora mt-4">
                  {upcomingEvent ? upcomingEvent.title : "No Upcoming Events"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingEvent ? (
                  <>
                    <div className="space-y-1">
                      <p className="text-lg font-bold text-primary">
                        {format(new Date(upcomingEvent.date), "EEEE, MMM do")}
                      </p>
                      {upcomingEvent.location && (
                        <p className="text-sm text-muted-foreground">{upcomingEvent.location}</p>
                      )}
                    </div>
                    <Button className="w-full group-hover:translate-x-1 transition-transform" asChild>
                      <Link to={upcomingEvent.humanitix_link || "/current-event"}>
                        {hasRsvpd ? "View Details" : "RSVP Now"} <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </>
                ) : (
                  <p className="text-muted-foreground">Check back soon for new dates!</p>
                )}
              </CardContent>
            </Card>

            {/* Nominated Song Card */}
            {nominatedFolder && (
              <Card className="shadow-lg border-none bg-accent/10 dark:bg-accent/5 overflow-hidden group">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="bg-background/50 border-accent text-accent-foreground">Current Focus</Badge>
                    <Music className="h-5 w-5 text-accent" />
                  </div>
                  <CardTitle className="text-2xl font-lora mt-4">
                    {nominatedFolder.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Practice materials for our current song are ready for you.
                  </p>
                  <Button variant="outline" className="w-full border-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground group-hover:translate-x-1 transition-transform" asChild>
                    <Link to={`/resources?folderId=${nominatedFolder.id}`}>
                      Practice Now <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Right Column: Checklist & Quick Actions */}
        <div className="lg:col-span-4 space-y-8">
          <SetupChecklistCard />
          <QuickActions />
          
          {/* Recent Resources Sidebar */}
          <Card className="shadow-lg border-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-lora flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Recent Resources
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {recentResources && recentResources.length > 0 ? (
                  recentResources.map((resource) => (
                    <a 
                      key={resource.id} 
                      href={resource.url || "#"} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-shrink-0">{renderResourceBadge(resource)}</div>
                      <span className="text-sm font-medium line-clamp-1">{resource.title}</span>
                    </a>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">No recent resources.</div>
                )}
              </div>
              <div className="p-4 border-t border-border">
                <Button variant="link" className="w-full text-primary p-0 h-auto" asChild>
                  <Link to="/resources">View all resources</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer Quote/Link */}
      <footer className="text-center pt-8 border-t border-border/50">
        <p className="text-muted-foreground italic">
          "Singing is the shortest distance between two people."
        </p>
        <div className="mt-4 flex justify-center items-center gap-4">
          <span className="text-sm text-muted-foreground">Learn more at</span>
          <Button variant="link" className="p-0 h-auto text-primary font-bold" asChild>
            <a href="https://DanieleBuatti.com" target="_blank" rel="noopener noreferrer">DanieleBuatti.com</a>
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default WelcomeHub;
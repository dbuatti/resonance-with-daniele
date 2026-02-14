"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { CalendarDays, Music, Mic2, Users, Camera, Link as LinkIcon, FileText, User as UserIcon, Settings, ClipboardList, CheckCircle2, Folder } from "lucide-react";
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
import QuickActions from "@/components/dashboard/QuickActions"; // New import

interface Event {
  id: string;
  title: string;
  date: string;
  location?: string;
  description?: string;
  humanitix_link?: string;
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
  const firstName = profile?.first_name || user?.email?.split('@')[0] || "there";

  if (isLoading) {
    return (
      <div className="py-8 md:py-12 space-y-8">
        <Card className="p-6 md:p-10 shadow-lg rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardHeader className="text-center">
            <Skeleton className="w-40 h-40 rounded-full mx-auto mb-6" />
            <Skeleton className="h-10 w-3/4 mx-auto mb-4" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6"><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /></div>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderResourceBadge = (resource: Resource) => {
    const pillType = getResourcePillType(resource);
    const style = resourcePillStyles[pillType] || resourcePillStyles.default;
    let text = pillType.charAt(0).toUpperCase() + pillType.slice(1);
    if (pillType === 'pdf') text = 'Sheet Music';
    if (pillType === 'audio') text = 'Audio';
    return <Badge variant="outline" className={cn("text-xs font-semibold bg-card border", style.text, style.border)}>{text}</Badge>;
  };

  return (
    <div className="py-8 md:py-12 space-y-8">
      <Card className="p-6 md:p-10 shadow-lg rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <CardHeader className="text-center">
          <img src="/images/daniele-buatti-headshot.jpeg" alt="Daniele Buatti" className="w-40 h-40 rounded-full object-cover shadow-md mx-auto mb-6" />
          <CardTitle className="text-4xl md:text-5xl font-extrabold text-center text-foreground mb-4 font-lora">Welcome, {firstName} to the Resonance with Daniele Hub!</CardTitle>
          <p className="text-center text-lg text-muted-foreground mb-6">I believe in the transformative power of singing — not just as performance, but as connection, expression, and joy.</p>
        </header>
        <CardContent className="text-lg text-muted-foreground space-y-6">
          <CoreHubLinks />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SetupChecklistCard />
            <QuickActions />
          </div>
          {nominatedFolder && (
            <Card className="bg-accent/10 border-l-4 border-accent p-6 shadow-md rounded-xl mt-8 dark:bg-accent/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-4">
                <CardTitle className="text-xl font-lora flex items-center gap-2 text-accent-foreground"><Music className="h-6 w-6 text-accent" /> Next Song Practice: {nominatedFolder.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-4">
                <p className="text-base text-muted-foreground">All resources for our next song are ready! Click below to access sheet music, audio tracks, and lyrics.</p>
                <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 w-full dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90" asChild><Link to={`/resources?folderId=${nominatedFolder.id}`}><Folder className="mr-2 h-4 w-4" /> Go to Folder</Link></Button>
              </CardContent>
            </Card>
          )}
          <LatestAnnouncementsCard />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <Card className="shadow-md border border-border p-6 bg-primary/5 dark:bg-primary/10">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-2xl font-lora flex items-center gap-2 text-primary"><CalendarDays className="h-6 w-6" /> Next Event</CardTitle>
                <CardDescription>Your next opportunity to sing!</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {upcomingEvent ? (
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-foreground">{upcomingEvent.title}</h3>
                    <p className="text-2xl font-extrabold text-primary flex items-center gap-2"><CalendarDays className="h-6 w-6" />{format(new Date(upcomingEvent.date), "EEEE, PPP")}</p>
                    {upcomingEvent.location && <p className="block text-sm text-muted-foreground">{upcomingEvent.location}</p>}
                    {hasRsvpd ? <Button size="lg" className="w-full mt-4 bg-green-600 text-white hover:bg-green-700" disabled><CheckCircle2 className="mr-2 h-4 w-4" /> RSVP Confirmed</Button> : <Button size="lg" className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90" asChild><Link to={upcomingEvent.humanitix_link || "/current-event"}>{upcomingEvent.humanitix_link ? "View Details & RSVP" : "View Event Page"}</Link></Button>}
                  </div>
                ) : <div className="text-center text-muted-foreground py-4"><p>No upcoming events scheduled right now.</p><Button variant="link" className="p-0 h-auto mt-2" asChild><Link to="/events">View all events</Link></Button></div>}
              </CardContent>
            </Card>
            <Card className="shadow-md border border-border">
              <CardHeader><CardTitle className="text-2xl font-lora flex items-center gap-2"><FileText className="h-6 w-6 text-primary" /> Recent Resources</CardTitle><CardDescription>Fresh materials to help you practice.</CardDescription></CardHeader>
              <CardContent>
                {recentResources && recentResources.length > 0 ? (
                  <ul className="space-y-3">
                    {recentResources.map((resource) => (
                      <li key={resource.id} className="flex items-start gap-2"><div className="flex-shrink-0 mt-1">{renderResourceBadge(resource)}</div><div><a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">{resource.title}</a></div></li>
                    ))}
                    <Button variant="link" className="p-0 h-auto mt-2" asChild><Link to="/resources">View all resources</Link></Button>
                  </ul>
                ) : <div className="text-center text-muted-foreground"><p>No recent resources found yet.</p><Button variant="link" className="p-0 h-auto" asChild><Link to="/resources">View all resources</Link></Button></div>}
              </CardContent>
            </Card>
          </div>
          <p className="text-center">💡 Learn more about me and my work: <Button variant="link" className="p-0 h-auto text-primary hover:underline" asChild><a href="https://DanieleBuatti.com" target="_blank" rel="noopener noreferrer">DanieleBuatti.com</a></Button></p>
          <p className="text-right font-semibold text-foreground text-xl mt-8 font-lora">— Daniele</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default WelcomeHub;
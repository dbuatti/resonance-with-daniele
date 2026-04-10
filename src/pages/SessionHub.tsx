"use client";

import React, { useEffect, useMemo } from "react";
import { useSession } from "@/integrations/supabase/auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Music, BookOpen, Video, Mic2, FileText, StickyNote, Calendar, Heart, History, ArrowRight, Youtube, Play, Download, ExternalLink } from "lucide-react";
import BackButton from "@/components/ui/BackButton";
import { format, parseISO, isAfter, startOfToday } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";

interface EventWithResources {
  id: string;
  title: string;
  date: string;
  lesson_notes: string | null;
  main_song: string | null;
  resources: any[];
}

const getYouTubeEmbedUrl = (url: string | null): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}?rel=0&showinfo=0&modestbranding=1`;
  }
  return null;
};

const SessionHub: React.FC = () => {
  const { user, loading: loadingSession } = useSession();
  const { hash } = useLocation();

  const { data: allEvents, isLoading } = useQuery({
    queryKey: ['sessionHubData'],
    queryFn: async () => {
      const { data: events, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .order("date", { ascending: false });
      
      if (eventsError) throw eventsError;

      const { data: folders } = await supabase
        .from("resource_folders")
        .select("id, event_id");

      const { data: resources } = await supabase
        .from("resources")
        .select("*")
        .eq("is_published", true);

      return events.map(event => {
        const eventFolderIds = folders?.filter(f => f.event_id === event.id).map(f => f.id) || [];
        const eventResources = resources?.filter(r => eventFolderIds.includes(r.folder_id)) || [];
        
        return {
          ...event,
          resources: eventResources
        };
      });
    },
    enabled: !loadingSession
  });

  const { currentEvent, pastEvents } = useMemo(() => {
    if (!allEvents || allEvents.length === 0) return { currentEvent: null, pastEvents: [] };
    
    const today = startOfToday();
    const upcoming = allEvents
      .filter(e => !isAfter(today, parseISO(e.date)))
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
    
    if (upcoming.length > 0) {
      const current = upcoming[0];
      const others = allEvents.filter(e => e.id !== current.id);
      return { currentEvent: current, pastEvents: others };
    }

    return { currentEvent: allEvents[0], pastEvents: allEvents.slice(1) };
  }, [allEvents]);

  useEffect(() => {
    if (!isLoading && hash) {
      const id = hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [isLoading, hash]);

  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
        <p className="text-muted-foreground font-medium">Loading your session library...</p>
      </div>
    );
  }

  const renderEventContent = (event: EventWithResources) => {
    const videoResources = event.resources.filter(r => r.type === 'youtube' || r.youtube_url);
    const fileResources = event.resources.filter(r => r.type !== 'youtube');
    const hasNotes = !!event.lesson_notes?.trim();

    return (
      <div className="space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Resources Column */}
          <div className={cn("space-y-8", hasNotes ? "lg:col-span-7" : "lg:col-span-12")}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Mic2 className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">
                Practice Materials
              </h3>
            </div>
            
            {fileResources.length > 0 ? (
              <div className={cn(
                "grid gap-6",
                hasNotes ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              )}>
                {fileResources.map((res) => (
                  <a 
                    key={res.id}
                    href={res.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group block"
                  >
                    <Card className="h-full border-none soft-shadow hover:shadow-xl transition-all duration-500 rounded-[2rem] overflow-hidden bg-card hover:-translate-y-1">
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex items-start justify-between mb-4">
                          <div className={cn(
                            "p-4 rounded-2xl shrink-0 transition-transform group-hover:scale-110 shadow-inner",
                            res.type === 'lyrics' ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"
                          )}>
                            {res.type === 'lyrics' ? <Mic2 className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                          </div>
                          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-primary/10 bg-primary/5 text-primary">
                            {res.voice_part || "General"}
                          </Badge>
                        </div>
                        <div className="space-y-2 flex-grow">
                          <p className="font-black font-lora text-lg leading-tight group-hover:text-primary transition-colors">{res.title}</p>
                          <p className="text-xs font-medium text-muted-foreground line-clamp-2">
                            {res.description || `Access the ${res.type} for this session.`}
                          </p>
                        </div>
                        <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between text-primary font-black text-[10px] uppercase tracking-widest">
                          <span>{res.type === 'file' ? 'Download File' : 'Open Link'}</span>
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-muted/20 rounded-[3rem] border-4 border-dashed border-border/50">
                <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-lg font-bold text-muted-foreground font-lora">No files uploaded yet.</p>
              </div>
            )}
          </div>

          {/* Notes Column */}
          {hasNotes && (
            <div className="lg:col-span-5 space-y-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/20 rounded-lg">
                  <StickyNote className="h-5 w-5 text-accent-foreground" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">
                  Daniele's Notes
                </h3>
              </div>
              <Card className="border-none shadow-2xl bg-yellow-50/50 dark:bg-yellow-950/10 rounded-[3rem] overflow-hidden relative min-h-[300px]">
                <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-400/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                <CardContent className="p-10 relative z-10">
                  <div className="prose prose-lg dark:prose-invert max-w-none">
                    <p className="text-xl font-medium font-lora italic leading-relaxed text-yellow-900 dark:text-yellow-200/80 whitespace-pre-wrap">
                      {event.lesson_notes}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Video Embeds Section */}
        {videoResources.length > 0 && (
          <div className="space-y-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <Youtube className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">
                Video References
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {videoResources.map((res) => {
                const embedUrl = getYouTubeEmbedUrl(res.type === 'youtube' ? res.url : res.youtube_url);
                if (!embedUrl) return null;
                
                return (
                  <div key={res.id} className="group space-y-6">
                    <div className="relative aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white dark:border-gray-800 bg-black transition-transform duration-500 group-hover:scale-[1.02]">
                      <iframe
                        src={embedUrl}
                        title={res.title}
                        className="absolute inset-0 w-full h-full"
                        allowFullScreen
                      />
                    </div>
                    <div className="px-6 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-black font-lora text-2xl leading-tight">{res.title}</p>
                        <Badge className="bg-red-600 text-white font-black text-[9px] uppercase tracking-widest">YouTube</Badge>
                      </div>
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Mic2 className="h-4 w-4 text-primary" />
                        {res.voice_part ? `Focus: ${res.voice_part}` : "Reference Performance"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="py-8 space-y-20 max-w-6xl mx-auto px-4">
      <BackButton to="/" />
      
      <header className="space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
          <BookOpen className="h-4 w-4" />
          <span>Learning Portal</span>
        </div>
        <h1 className="text-5xl md:text-8xl font-black font-lora tracking-tighter leading-none">Session Hub</h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl font-medium leading-relaxed">
          Access your tracks, lyrics, and my personal notes for our current and past sessions.
        </p>
      </header>

      {/* Featured Current Session */}
      {currentEvent ? (
        <section id={`event-${currentEvent.id}`} className="space-y-12 animate-fade-in-up scroll-mt-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-8 border-primary pb-8">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">
                  Current Session
                </Badge>
                {currentEvent.main_song && (
                  <Badge className="bg-accent text-accent-foreground font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                    Focus: {currentEvent.main_song}
                  </Badge>
                )}
              </div>
              <h2 className="text-5xl md:text-7xl font-black font-lora tracking-tight leading-none">{currentEvent.title}</h2>
            </div>
            <div className="flex items-center gap-3 text-primary font-black text-2xl md:text-3xl tracking-tighter">
              <Calendar className="h-8 w-8" />
              {format(parseISO(currentEvent.date), "EEEE, MMMM do")}
            </div>
          </div>

          {renderEventContent(currentEvent)}
        </section>
      ) : (
        <div className="text-center py-24 bg-muted/20 rounded-[4rem] border-4 border-dashed border-border/50">
          <Music className="h-20 w-20 text-muted-foreground mx-auto mb-6 opacity-10" />
          <h2 className="text-3xl font-black font-lora text-muted-foreground">No sessions found</h2>
        </div>
      )}

      {/* Past Sessions Section */}
      {pastEvents.length > 0 && (
        <section className="space-y-16 pt-20 border-t-2 border-border/50">
          <div className="space-y-2">
            <h2 className="text-4xl md:text-6xl font-black font-lora tracking-tighter flex items-center gap-4">
              <History className="h-10 w-10 text-muted-foreground/40" /> Session History
            </h2>
            <p className="text-xl text-muted-foreground font-medium">Catch up on what we've learned in previous months.</p>
          </div>

          <div className="grid grid-cols-1 gap-24">
            {pastEvents.map((event) => (
              <div key={event.id} id={`event-${event.id}`} className="space-y-12 scroll-mt-24 group">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="bg-muted p-5 rounded-[2rem] shadow-inner group-hover:bg-primary/5 transition-colors">
                    <Calendar className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-3xl md:text-5xl font-black font-lora tracking-tight">{event.title}</h3>
                    <p className="text-sm font-black text-primary uppercase tracking-[0.3em]">
                      {format(parseISO(event.date), "MMMM yyyy")}
                    </p>
                  </div>
                </div>
                {renderEventContent(event)}
                <Separator className="opacity-30" />
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="text-center pt-24 pb-12 border-t border-border/50">
        <div className="flex flex-col items-center gap-6">
          <div className="bg-primary/5 p-4 rounded-full">
            <Heart className="h-8 w-8 text-primary opacity-40 animate-pulse" />
          </div>
          <p className="text-sm font-black text-muted-foreground uppercase tracking-[0.4em]">Keep Singing, Keep Growing</p>
        </div>
      </footer>
    </div>
  );
};

export default SessionHub;